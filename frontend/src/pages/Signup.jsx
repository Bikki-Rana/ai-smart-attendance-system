import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store'
import { Camera, Loader, User, Mail, Lock, Hash, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Signup() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', student_id: '',
    department: 'CSE', semester: 6, section: 'A',
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all required fields')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error('Please enter a valid email address')
    if (form.password.length < 8 || !/(?=.*[A-Z])(?=.*[\d!@#$%^&*])/.test(form.password)) return toast.error('Password must be at least 8 chars, with 1 uppercase and 1 number/symbol')
    
    // Enroll No validation (Format: BT/CSE/23/059)
    const enrollRegex = /^BT\/[A-Za-z]+\/\d{2}\/\d{3}$/i
    if (form.student_id && !enrollRegex.test(form.student_id)) {
      return toast.error('Enroll No must match format: BT/DEPT/YY/ROLL (e.g., BT/CSE/23/059)')
    }

    setLoading(true)
    try {
      const payload = { ...form, role: 'student', semester: Number(form.semester) }
      if (!payload.student_id) delete payload.student_id
      const data = await register(payload)
      toast.success('Account created! Please register your face.')
      navigate('/profile')
    } catch (err) {
      console.error("Registration error:", err);
      let errMsg = 'Registration failed';
      if (err?.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errMsg = detail[0].msg + " (" + detail[0].loc.join(".") + ")";
        } else if (typeof detail === 'string') {
          errMsg = detail;
        }
      } else if (err.message === "Network Error") {
        errMsg = "Network error: Cannot connect to the server.";
      } else if (err.message) {
        errMsg = err.message;
      }
      toast.error(errMsg);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ width: 60, height: 60, borderRadius: '16px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Camera size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>Create Account</h1>
          <p style={{ color: '#64748b', marginTop: '8px', fontSize: '0.9rem' }}>Join SmartAttend as a student</p>
        </div>

        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Full Name */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Full Name *</label>
              <div style={{ position: 'relative' }}>
                <User size={15} color="#475569" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input className="input-field" style={{ paddingLeft: '40px' }} placeholder="Bikki Kumar Rana" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#475569" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input className="input-field" style={{ paddingLeft: '40px' }} type="email" placeholder="you@gmail.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
            </div>

            {/* Enroll No + Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Enroll No</label>
                <div style={{ position: 'relative' }}>
                  <Hash size={15} color="#475569" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input className="input-field" style={{ paddingLeft: '40px' }} placeholder="BT/CSE/23/059" value={form.student_id} onChange={e => set('student_id', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Section</label>
                <select className="input-field" value={form.section} onChange={e => set('section', e.target.value)}>
                  {['A', 'B'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Department + Semester */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Department</label>
                <select className="input-field" value={form.department} onChange={e => set('department', e.target.value)}>
                  {['CSE', 'IT'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Semester</label>
                <select className="input-field" value={form.semester} onChange={e => set('semester', e.target.value)}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#475569" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input className="input-field" style={{ paddingLeft: '40px' }} type="password" placeholder="Min 8 chars, 1 uppercase, 1 symbol/num" value={form.password} onChange={e => set('password', e.target.value)} required />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
              {loading ? <><Loader size={16} className="animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '0.875rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
