import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { Camera, Zap, Shield, BarChart3, Clock, Users, ChevronRight, Check, Star } from 'lucide-react'

const features = [
  { icon: Camera,   color: '#3b82f6', title: 'Face Recognition',      desc: 'DeepFace AI engine identifies students with 99%+ accuracy in real-time.' },
  { icon: Shield,   color: '#7c3aed', title: 'Liveness Detection',    desc: 'MediaPipe anti-spoofing prevents photo/video fraud attempts.' },
  { icon: Clock,    color: '#06b6d4', title: 'Timetable Intelligence', desc: 'Auto-detects current subject & teacher based on schedule.' },
  { icon: BarChart3,color: '#10b981', title: 'Smart Analytics',        desc: 'Real-time heatmaps, subject-wise charts, and attendance trends.' },
  { icon: Zap,      color: '#f59e0b', title: 'Instant Alerts',         desc: 'Automatic warnings when attendance drops below 60%.' },
  { icon: Users,    color: '#ef4444', title: 'Role-Based Access',      desc: 'Separate admin and student portals with full security.' },
]

const stats = [
  { label: 'Accuracy', value: '99.2%' },
  { label: 'Detection Time', value: '<0.5s' },
  { label: 'Anti-Spoofing', value: '100%' },
  { label: 'Students Supported', value: '∞' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const dashboardPath = isAdmin ? '/admin' : '/dashboard'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* ─── Navbar ─── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 40px', height: '70px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(10,14,26,0.8)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 38, height: 38, borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={20} color="white" />
          </div>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.2rem' }}>SmartAttend</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isAuthenticated ? (
            <>
              <button className="btn-secondary" style={{ padding: '9px 20px', fontSize: '0.875rem' }} onClick={() => { logout(); navigate('/') }}>Logout</button>
              <button className="btn-primary" style={{ padding: '9px 20px', fontSize: '0.875rem' }} onClick={() => navigate(dashboardPath)}>Go to Dashboard</button>
            </>
          ) : (
            <>
              <button className="btn-secondary" style={{ padding: '9px 20px', fontSize: '0.875rem' }} onClick={() => navigate('/login')}>Login</button>
              <button className="btn-primary" style={{ padding: '9px 20px', fontSize: '0.875rem' }} onClick={() => navigate('/signup')}>Get Started</button>
            </>
          )}
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '100px 24px 60px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '40%', left: '20%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '800px', position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '100px', padding: '6px 16px', marginBottom: '32px',
          }}>
            <div style={{ width: 8, height: 8, background: '#3b82f6', borderRadius: '50%', animation: 'pulse-ring 2s infinite' }} />
            <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>AI-Powered Attendance System</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 5rem)',
            fontWeight: 900, lineHeight: 1.1, marginBottom: '24px',
            fontFamily: 'Space Grotesk, sans-serif',
          }}>
            Smart Attendance
            <br />
            <span className="gradient-text">with Face AI</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.8 }}>
            End manual attendance forever. SmartAttend uses real-time face recognition and liveness detection to mark attendance instantly — secure, accurate, and effortless.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <>
                <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => navigate(dashboardPath)}>
                  Back to Dashboard <ChevronRight size={18} />
                </button>
                <button className="btn-secondary" style={{ padding: '16px 32px', fontSize: '1rem' }}
                  onClick={() => { logout(); navigate('/') }}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <button className="btn-primary" style={{ padding: '16px 32px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => navigate('/signup')}>
                  Get Started Free <ChevronRight size={18} />
                </button>
                <button className="btn-secondary" style={{ padding: '16px 32px', fontSize: '1rem' }}
                  onClick={() => navigate('/login')}>
                  Admin Login
                </button>
              </>
            )}
          </div>

          {/* Stats bar */}
          <div style={{
            display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap',
            marginTop: '64px', padding: '24px 40px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
          }}>
            {stats.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section style={{ padding: '80px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '16px' }}>
            Everything You Need
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>Built for educational institutions serious about attendance integrity</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {features.map((f) => (
            <div key={f.title} className="card" style={{ padding: '28px' }}>
              <div style={{
                width: 50, height: 50, borderRadius: '14px', marginBottom: '20px',
                background: `${f.color}20`, border: `1px solid ${f.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <f.icon size={24} color={f.color} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '10px', fontFamily: 'Space Grotesk, sans-serif' }}>{f.title}</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── How it Works ─── */}
      <section style={{ padding: '80px 40px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '60px' }}>How It Works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '32px' }}>
            {[
              { step: '01', icon: Users,  title: 'Register',     desc: 'Student registers with face capture' },
              { step: '02', icon: Camera, title: 'Scan Face',    desc: 'Open camera & look at screen' },
              { step: '03', icon: Shield, title: 'Liveness Check',desc: 'Blink detection confirms real person' },
              { step: '04', icon: Check,  title: 'Attendance Marked', desc: 'Auto-logged for current subject' },
            ].map(item => (
              <div key={item.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--gradient-main)', margin: '0 auto 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif',
                }}>{item.step}</div>
                <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>{item.title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '80px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '24px' }}>
            Ready to Get Started?
          </h2>
          <p style={{ color: '#64748b', marginBottom: '32px' }}>Join SmartAttend and transform your institution's attendance system.</p>
          <button className="btn-primary" style={{ padding: '16px 40px', fontSize: '1rem' }} onClick={() => navigate(isAuthenticated ? dashboardPath : '/signup')}>
            {isAuthenticated ? 'Go to Dashboard' : 'Create Your Account →'}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 40px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', color: '#475569', fontSize: '0.8rem' }}>
        © 2026 SmartAttend — AI-Powered Attendance System
      </footer>
    </div>
  )
}
