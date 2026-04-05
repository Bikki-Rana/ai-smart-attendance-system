import { useEffect, useState, useRef, useCallback } from 'react'
import Layout from '../components/Layout'
import { useAuthStore } from '../store'
import api from '../api/client'
import {
  Camera, CheckCircle, XCircle, Loader, Eye, RefreshCw,
  Clock, BookOpen, User, Zap, AlertTriangle, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'
import Webcam from 'react-webcam'

const CAPTURE_INTERVAL_MS = 800
const MIN_FRAMES = 4

export default function AttendancePage() {
  const { user } = useAuthStore()
  const webcamRef = useRef(null)
  const framesRef = useRef([])
  const timerRef = useRef(null)

  const [phase, setPhase] = useState('idle')       // idle | scanning | processing | success | error
  const [currentClass, setCurrentClass] = useState(null)
  const [result, setResult] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const [blinkMsg, setBlinkMsg] = useState('Look at the camera')
  const [cameraError, setCameraError] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)

  useEffect(() => {
    if (window.isSecureContext === false) {
      toast.error('Browser is in an insecure context. Camera access will be blocked. Please use "localhost" or "HTTPS".', { duration: 10000 })
    }
    api.get('/timetable/current-class').then(r => setCurrentClass(r.data)).catch(() => {})
    return () => clearInterval(timerRef.current)
  }, [])

  const startScan = useCallback(() => {
    framesRef.current = []
    setPhase('scanning')
    setCountdown(MIN_FRAMES)
    setBlinkMsg('Look at the camera and blink naturally...')

    let count = 0
    timerRef.current = setInterval(() => {
      if (webcamRef.current) {
        const frame = webcamRef.current.getScreenshot()
        if (frame) {
          framesRef.current.push(frame)
          count++
          setCountdown(MIN_FRAMES - count)
          if (count === 1) setBlinkMsg('Keep still... analyzing face...')
          if (count === 2) setBlinkMsg('Please blink once...')
          if (count === 3) setBlinkMsg('Almost done...')
        } else if (count === 0 && !cameraError) {
          // If we can't get even the first frame, show error
          setCameraError(true)
          toast.error('Unable to capture from camera. Please check permissions.')
          clearInterval(timerRef.current)
          setPhase('idle')
        }
      }
      if (count >= MIN_FRAMES) {
        clearInterval(timerRef.current)
        processAttendance()
      }
    }, CAPTURE_INTERVAL_MS)
  }, [])

  const processAttendance = async () => {
    setPhase('processing')
    setBlinkMsg('Verifying identity...')
    try {
      const frames = framesRef.current
      const snapshot = frames[frames.length - 1]
      const res = await api.post('/attendance/mark', { frames, snapshot })
      setResult(res.data)
      setPhase(res.data.success ? 'success' : 'error')
      if (res.data.success) {
        toast.success(`Attendance marked for ${res.data.subject_name}!`)
        api.get('/timetable/current-class').then(r => setCurrentClass(r.data)).catch(() => {})
      }
    } catch (err) {
      setResult({ success: false, message: err?.response?.data?.detail || 'Something went wrong. Please try again.' })
      setPhase('error')
    }
  }

  const reset = () => {
    clearInterval(timerRef.current)
    framesRef.current = []
    setPhase('idle')
    setResult(null)
    setCountdown(MIN_FRAMES)
    setBlinkMsg('Look at the camera')
  }

  const overlayClass = phase === 'scanning' || phase === 'processing' ? 'camera-scanning'
    : phase === 'success' ? 'camera-success'
    : phase === 'error' ? 'camera-error' : ''

  return (
    <Layout title="Mark Attendance" subtitle="Look at the camera and blink to verify your identity">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', maxWidth: '900px' }}>

        {/* Camera card */}
        <div className="card" style={{ padding: '24px' }}>
          {/* Current class info */}
          {currentClass?.is_ongoing ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '14px', padding: '14px 18px', marginBottom: '20px',
            }}>
              <div style={{ width: 10, height: 10, background: '#10b981', borderRadius: '50%', animation: 'pulse-ring 2s infinite' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#10b981' }}>{currentClass.subject_name}</div>
                <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{currentClass.teacher_name} · {currentClass.start_time} – {currentClass.end_time}</div>
              </div>
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>LIVE</span>
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '14px', padding: '14px 18px', marginBottom: '20px',
            }}>
              <Clock size={18} color="#f59e0b" />
              <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.875rem' }}>No class scheduled right now</div>
            </div>
          )}

          {/* Webcam */}
          <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#0a0e1a', aspectRatio: '4/3' }}>
            {cameraError ? (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#64748b' }}>
                <Camera size={48} />
                <p style={{ fontSize: '0.875rem' }}>Camera not available</p>
              </div>
            ) : (
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                screenshotQuality={0.85}
                mirrored={true}
                videoConstraints={{ facingMode: 'user' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onUserMedia={() => setCameraReady(true)}
                onUserMediaError={(err) => {
                  setCameraError(true)
                  setCameraReady(false)
                  let msg = 'Camera error: '
                  if (err.name === 'NotAllowedError') msg += 'Access denied. Please click the camera icon in your browser URL bar and choose "Allow".'
                  else if (err.name === 'NotFoundError') msg += 'No camera device found.'
                  else msg += err.name + ': ' + (err.message || 'Unknown error')
                  toast.error(msg, { duration: 6000 })
                }}
              />
            )}

            {/* Scanning overlay */}
            <div className={`camera-overlay ${overlayClass}`} />

            {/* Face guide frame */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -60%)',
              width: '160px', height: '200px',
              border: `2px solid ${phase === 'success' ? 'rgba(16,185,129,0.6)' : phase === 'error' ? 'rgba(239,68,68,0.6)' : 'rgba(59,130,246,0.4)'}`,
              borderRadius: '50% 50% 45% 45%',
              transition: 'border-color 0.3s',
            }} />

            {/* Status overlay */}
            {phase !== 'idle' && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                padding: '20px 16px 16px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                {phase === 'scanning' && <Eye size={16} color="#3b82f6" className="animate-pulse" />}
                {phase === 'processing' && <Loader size={16} color="#f59e0b" className="animate-spin" />}
                {phase === 'success' && <CheckCircle size={16} color="#10b981" />}
                {phase === 'error' && <XCircle size={16} color="#ef4444" />}
                <span style={{
                  fontSize: '0.8rem', fontWeight: 600,
                  color: phase === 'success' ? '#10b981' : phase === 'error' ? '#ef4444' : '#f1f5f9',
                }}>
                  {blinkMsg}
                </span>
                {phase === 'scanning' && countdown > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'rgba(59,130,246,0.3)', borderRadius: '100px', padding: '2px 8px', fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700 }}>
                    {countdown} frames left
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
            {(phase === 'idle' || phase === 'error') && (
              <button className="btn-primary" onClick={startScan}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                disabled={cameraError || !cameraReady || !currentClass?.is_ongoing}>
                <Camera size={18} />
                {phase === 'error' ? 'Try Again' : 'Start Face Scan'}
              </button>
            )}
            {phase === 'scanning' && (
              <button className="btn-secondary" onClick={reset} style={{ flex: 1 }}>Cancel</button>
            )}
            {(phase === 'success' || phase === 'error') && (
              <button className="btn-secondary" onClick={reset}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <RefreshCw size={16} /> Mark Another
              </button>
            )}
          </div>
        </div>

        {/* Info panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Result */}
          {result && (
            <div className="card animate-bounce-in" style={{ padding: '20px', borderColor: result.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                {result.success ? <CheckCircle size={24} color="#10b981" /> : <XCircle size={24} color="#ef4444" />}
                <span style={{ fontWeight: 700, color: result.success ? '#10b981' : '#ef4444' }}>
                  {result.success ? 'Attendance Marked!' : 'Failed'}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6 }}>{result.message}</p>
              {result.confidence && (
                <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(59,130,246,0.08)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: '#64748b' }}>Face Match Confidence</span>
                    <span style={{ color: '#3b82f6', fontWeight: 700 }}>{result.confidence?.toFixed(1)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Liveness guide */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Shield size={18} color="#7c3aed" />
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Anti-Spoofing Guide</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: '👁', step: 'Look directly at the camera' },
                { icon: '😊', step: 'Keep a neutral face expression' },
                { icon: '👁‍🗨', step: 'Blink once when prompted'   },
                { icon: '💡', step: 'Ensure your face is well-lit' },
                { icon: '📵', step: 'Remove any masks or glasses' },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                  {s.step}
                </div>
              ))}
            </div>
          </div>

          {/* Today's classes */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <BookOpen size={18} color="#06b6d4" />
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Current Class</h3>
            </div>
            {currentClass?.is_ongoing ? (
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '6px' }}>{currentClass.subject_name}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={13} /> {currentClass.teacher_name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} /> {currentClass.start_time} – {currentClass.end_time}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#475569', fontSize: '0.875rem' }}>Check back during class hours</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
