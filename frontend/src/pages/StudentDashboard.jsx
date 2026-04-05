import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuthStore } from '../store'
import api from '../api/client'
import {
  BarChart3, TrendingUp, BookOpen, AlertTriangle,
  Camera, Calendar, Download, ChevronRight
} from 'lucide-react'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const COLORS = ['#3b82f6', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

export default function StudentDashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [currentClass, setCurrentClass] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, alertsRes, classRes] = await Promise.all([
          api.get(`/attendance/stats/student/${user.id}`),
          api.get('/alerts/'),
          api.get('/timetable/current-class'),
        ])
        setStats(statsRes.data)
        setAlerts(alertsRes.data.filter(a => !a.is_read))
        setCurrentClass(classRes.data)
      } catch { toast.error('Failed to load dashboard') }
      finally { setLoading(false) }
    }
    if (user?.id) load()
  }, [user])

  const dismissAlert = async (id) => {
    await api.patch(`/alerts/${id}/read`)
    setAlerts(p => p.filter(a => a.id !== id))
  }

  const pct = stats?.percentage ?? 0
  const pctColor = pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <Layout title="My Dashboard" subtitle={`Welcome, ${user?.name} — Track your attendance`}>
      {/* Low attendance banner */}
      {!loading && pct > 0 && pct < 60 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '14px', padding: '16px 20px', marginBottom: '24px',
          animation: 'fadeInUp 0.4s ease',
        }}>
          <AlertTriangle size={20} color="#ef4444" />
          <div>
            <div style={{ fontWeight: 700, color: '#ef4444' }}>⚠️ Low Attendance Warning!</div>
            <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Your attendance is {pct.toFixed(1)}%. Minimum required is 60%. Please attend classes regularly.</div>
          </div>
        </div>
      )}

      {/* Unread alerts */}
      {alerts.map(a => (
        <div key={a.id} style={{
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          background: a.alert_type === 'danger' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${a.alert_type === 'danger' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
          borderRadius: '12px', padding: '14px 18px', marginBottom: '12px',
        }}>
          <AlertTriangle size={18} color={a.alert_type === 'danger' ? '#ef4444' : '#f59e0b'} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.title}</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>{a.message}</div>
          </div>
          <button onClick={() => dismissAlert(a.id)} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
        </div>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Overall percentage ring */}
        <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Attendance</div>
          <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 16px' }}>
            <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
              <circle cx="60" cy="60" r="50" fill="none" stroke={pctColor} strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1.5s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: pctColor }}>
                {loading ? '...' : `${pct.toFixed(0)}%`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{stats?.attended ?? '—'} / {stats?.total_classes ?? '—'} classes</span>
          </div>
          <div style={{ marginTop: '12px' }}>
            <span className={`badge ${pct >= 75 ? 'badge-success' : pct >= 60 ? 'badge-warning' : 'badge-danger'}`}>
              {pct >= 75 ? '✓ Good Standing' : pct >= 60 ? '⚡ Borderline' : '⚠ Critical'}
            </span>
          </div>
        </div>

        {/* Subject breakdowns */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>Subject-wise Attendance</h3>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              onClick={() => window.open('/api/reports/export/csv', '_blank')}>
              <Download size={13} style={{ marginRight: '4px' }} /> Export CSV
            </button>
          </div>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: '8px', marginBottom: '10px' }} />)
          ) : stats?.subject_breakdown?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '260px', overflowY: 'auto' }}>
              {stats.subject_breakdown.map((s, i) => (
                <div key={s.subject_id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{s.subject_name}</span>
                    <span style={{ color: s.percentage < 60 ? '#ef4444' : s.percentage < 75 ? '#f59e0b' : '#10b981', fontWeight: 700 }}>
                      {s.percentage}% ({s.attended}/{s.total_classes})
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{
                      width: `${s.percentage}%`,
                      background: i % 2 === 0 ? 'linear-gradient(90deg, #3b82f6, #7c3aed)' : 'linear-gradient(90deg, #06b6d4, #10b981)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#475569' }}>
              <BarChart3 size={32} style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.875rem' }}>No attendance records yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Current class + Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Current class */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: 8, height: 8, background: currentClass?.is_ongoing ? '#10b981' : '#475569', borderRadius: '50%', ...(currentClass?.is_ongoing ? { animation: 'pulse-ring 2s infinite' } : {}) }} />
            <h3 style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.95rem' }}>
              {currentClass?.is_ongoing ? 'Class In Progress' : 'No Active Class'}
            </h3>
          </div>
          {currentClass?.is_ongoing ? (
            <>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px', fontFamily: 'Space Grotesk, sans-serif' }}>{currentClass.subject_name}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>{currentClass.teacher_name} · {currentClass.start_time}–{currentClass.end_time}</div>
              <button className="btn-primary" onClick={() => navigate('/attendance')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Camera size={16} /> Mark Attendance Now
              </button>
            </>
          ) : (
            <div style={{ color: '#475569', fontSize: '0.875rem' }}>
              <p>Check the timetable for upcoming classes</p>
              <button className="btn-secondary" style={{ marginTop: '12px', width: '100%', fontSize: '0.85rem' }}
                onClick={() => navigate('/timetable')}>View Timetable</button>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '16px', fontSize: '0.95rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Mark Attendance', icon: Camera,   path: '/attendance', color: '#3b82f6' },
              { label: 'View Timetable',  icon: Calendar, path: '/timetable',  color: '#7c3aed' },
              { label: 'View Reports',    icon: BarChart3,path: '/reports',    color: '#06b6d4' },
              { label: 'My Profile',      icon: TrendingUp,path: '/profile',   color: '#10b981' },
            ].map(({ label, icon: Icon, path, color }) => (
              <button key={path} onClick={() => navigate(path)} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 14px', borderRadius: '12px',
                background: `${color}10`, border: `1px solid ${color}25`,
                color: '#f1f5f9', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                transition: 'all 0.2s',
              }}>
                <Icon size={17} color={color} />
                {label}
                <ChevronRight size={15} style={{ marginLeft: 'auto', color: '#475569' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
