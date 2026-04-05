import { useEffect, useState, useRef, useCallback } from 'react'
import Layout from '../components/Layout'
import { useAuthStore } from '../store'
import api from '../api/client'
import { Camera, User, Mail, Hash, BookOpen, CheckCircle, Loader, RefreshCw, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import Webcam from 'react-webcam'

export default function ProfilePage() {
  const { user, fetchMe } = useAuthStore()
  const [userData, setUserData] = useState(null)
  const [captureMode, setCaptureMode] = useState(false)
  const [captured, setCaptured] = useState(null)
  const [registering, setRegistering] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const webcamRef = useRef(null)

  useEffect(() => {
    if (window.isSecureContext === false) {
      toast.error('Browser is in an insecure context. Camera access will be blocked. Please use "localhost" or "HTTPS".', { duration: 10000 })
    }
    api.get(`/users/${user?.id}`).then(r => setUserData(r.data)).catch(() => {})
  }, [user])

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const img = webcamRef.current.getScreenshot()
      if (img) {
        setCaptured(img)
      } else {
        toast.error('Failed to capture. Please ensure camera is allowed and fully loaded.')
      }
    }
  }, [])

  const registerFace = async () => {
    if (!captured) return toast.error('Please capture your photo first')
    setRegistering(true)
    try {
      await api.post(`/users/${user.id}/register-face-data`, { image: captured })
      toast.success('Face registered successfully! You can now mark attendance.')
      await fetchMe()
      setUserData(p => ({ ...p, face_registered: true }))
      setCaptureMode(false)
      setCaptured(null)
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Face registration failed')
    } finally {
      setRegistering(false)
    }
  }

  const fileInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      return toast.error('Please upload an image file (JPEG, PNG)')
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const { data } = await api.post(`/users/${user.id}/profile-image`, formData)
      toast.success('Profile picture updated!')
      await fetchMe() // Update global auth store
      setUserData(p => ({ ...p, profile_image: data.profile_image }))
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const info = userData || user

  return (
    <Layout title="My Profile" subtitle="Manage your account and face registration">
      <div style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Profile card */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 90, height: 90, borderRadius: '50%',
                background: info?.profile_image ? `url(${info.profile_image}) center/cover no-repeat` : 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.2rem', fontWeight: 800, color: 'white', flexShrink: 0,
                cursor: 'pointer', position: 'relative', border: '3px solid rgba(255,255,255,0.1)',
                overflow: 'hidden', transition: 'all 0.3s ease',
              }}
              className="group"
            >
              {!info?.profile_image && (info?.name?.[0]?.toUpperCase() || 'U')}
              
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: uploading ? 1 : 0, transition: 'opacity 0.2s',
              }} className="group-hover:opacity-100">
                {uploading ? <Loader size={20} className="animate-spin" /> : <Camera size={20} />}
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handleImageUpload} 
            />

            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '4px' }}>{info?.name}</h2>
              <div style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '8px' }}>{info?.email}</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span className={`badge ${info?.role === 'admin' ? 'badge-info' : 'badge-muted'}`}>{info?.role}</span>
                {userData?.face_registered ? (
                  <span className="badge badge-success"><CheckCircle size={11} style={{ marginRight: '3px' }} />Face Registered</span>
                ) : (
                  <span className="badge badge-warning">Face Not Registered</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { icon: Hash,     label: 'Enroll No',   val: info?.student_id  || 'N/A' },
              { icon: BookOpen, label: 'Department',   val: info?.department  || 'N/A' },
              { icon: User,     label: 'Semester',     val: info?.semester ? `Semester ${info.semester}` : 'N/A' },
              { icon: Shield,   label: 'Section',      val: info?.section     || 'N/A' },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} style={{
                padding: '14px 18px', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Icon size={14} color="#475569" />
                  <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Face Registration */}
        <div className="card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={20} color="#7c3aed" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>Face Registration</h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Required to mark attendance via face scan</p>
            </div>
            {userData?.face_registered && (
              <span className="badge badge-success" style={{ marginLeft: 'auto' }}>✓ Registered</span>
            )}
          </div>

          {!captureMode ? (
            <button className="btn-primary" onClick={() => setCaptureMode(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={16} />
              {userData?.face_registered ? 'Re-register Face' : 'Register My Face'}
            </button>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                {/* Webcam */}
                <div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>Live Camera</p>
                  <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#0a0e1a', aspectRatio: '4/3', position: 'relative' }}>
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      mirrored={true}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      videoConstraints={{ facingMode: 'user' }}
                      onUserMedia={() => setCameraReady(true)}
                      onUserMediaError={(err) => {
                        setCameraReady(false)
                        let msg = 'Camera error: '
                        if (err.name === 'NotAllowedError') msg += 'Access denied. Please click the camera icon in your browser URL bar and choose "Allow".'
                        else if (err.name === 'NotFoundError') msg += 'No camera device found. Please plug in a webcam.'
                        else msg += err.name + ': ' + (err.message || 'Unknown error')
                        toast.error(msg, { duration: 6000 })
                      }}
                    />
                    {!cameraReady && !captured && (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0e1a', color: '#64748b', fontSize: '0.8rem' }}>
                        <Loader size={20} className="animate-spin" style={{ marginRight: '8px' }} /> Initializing camera...
                      </div>
                    )}
                  </div>
                  <button className="btn-primary" onClick={capture} disabled={!cameraReady} style={{ width: '100%', marginTop: '12px', padding: '10px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Camera size={15} /> Capture Photo
                  </button>
                </div>

                {/* Preview */}
                <div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>Captured Preview</p>
                  <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#0a0e1a', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {captured ? (
                      <img src={captured} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Captured" />
                    ) : (
                      <p style={{ color: '#475569', fontSize: '0.8rem' }}>No photo yet</p>
                    )}
                  </div>
                  {captured && (
                    <button onClick={() => setCaptured(null)} className="btn-secondary" style={{ width: '100%', marginTop: '12px', padding: '10px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <RefreshCw size={14} /> Retake
                    </button>
                  )}
                </div>
              </div>

              {/* Tips */}
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '12px', padding: '14px', marginBottom: '16px', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.7 }}>
                💡 <strong style={{ color: '#3b82f6' }}>Tips for best results:</strong> Ensure good lighting, look directly at camera, keep face centered and unobstructed.
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-primary" onClick={registerFace} disabled={!captured || registering}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  {registering ? <><Loader size={15} className="animate-spin" /> Registering...</> : <><CheckCircle size={15} /> Save Face Data</>}
                </button>
                <button className="btn-secondary" onClick={() => { setCaptureMode(false); setCaptured(null) }} style={{ flex: '0 0 auto', padding: '12px 20px' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
