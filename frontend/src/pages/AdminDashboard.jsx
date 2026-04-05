import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuthStore } from '../store'
import api from '../api/client'
import {
  BarChart3, Users, Calendar, TrendingUp, AlertTriangle,
  UserCheck, Clock, Download, Bell, ChevronRight, Activity
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const COLORS = ['#3b82f6', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [summary, setSummary] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, alertsRes] = await Promise.all([
          api.get('/attendance/admin/summary'),
          api.get('/alerts/'),
        ])
        setSummary(summaryRes.data)
        if (Array.isArray(alertsRes.data)) {
          setAlerts(alertsRes.data.slice(0, 5))
        }
      } catch (e) {
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const StatCard = ({ icon: Icon, label, value, color, sub }) => (
    <div className="stat-card" style={{ '--glow': color }}>
      <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, borderRadius: '50%', background: color, opacity: 0.06, transform: 'translate(30px,-30px)' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ width: 46, height: 46, borderRadius: '12px', background: `${color}20`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', color: '#f1f5f9', marginBottom: '4px' }}>
        {loading ? <div className="skeleton" style={{ width: 60, height: 32 }} /> : value}
      </div>
      <div style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '6px', fontWeight: 600 }}>{sub}</div>}
    </div>
  )

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: '#131929', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem' }}>
          <p style={{ color: '#94a3b8', marginBottom: '4px' }}>{label}</p>
          <p style={{ color: '#3b82f6', fontWeight: 700 }}>{payload[0].value} present</p>
        </div>
      )
    }
    return null
  }

  return (
    <Layout title="Admin Dashboard" subtitle={`Welcome back, ${user?.name} — Here's what's happening today`}>
      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <StatCard icon={Users}     label="Total Students"     value={summary?.total_students ?? '—'}     color="#3b82f6" />
        <StatCard icon={UserCheck} label="Present Today"      value={summary?.today_present ?? '—'}      color="#10b981" />
        <StatCard icon={AlertTriangle} label="Low Attendance" value={summary?.low_attendance_count ?? '—'} color="#ef4444" sub="Below 60%" />
        <StatCard icon={Activity}  label="Total Records"      value={summary?.total_records ?? '—'}      color="#7c3aed" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Attendance trend chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '4px' }}>Attendance Trend</h3>
              <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Daily present count (last 14 days)</p>
            </div>
            <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => navigate('/admin/reports')}>
              Full Report <ChevronRight size={14} />
            </button>
          </div>
          {loading ? (
            <div className="skeleton" style={{ width: '100%', height: 220 }} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary?.daily_trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} tickFormatter={d => d?.slice(5)} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                <Tooltip content={customTooltip} />
                <Bar dataKey="count" fill="url(#blueGradient)" radius={[6,6,0,0]} />
                <defs>
                  <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Low attendance students */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <AlertTriangle size={18} color="#ef4444" />
            <h3 style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>Low Attendance</h3>
            {summary?.low_attendance_count > 0 && (
              <span style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '100px', padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                {summary.low_attendance_count}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loading ? (
              [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 54, borderRadius: '10px' }} />)
            ) : summary?.low_attendance_students?.length ? (
              summary.low_attendance_students.slice(0, 6).map(s => (
                <div key={s.student_id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px', borderRadius: '10px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Enroll No: {s.student_id}</div>
                  </div>
                  <span className="badge badge-danger">{s.percentage}%</span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: '#10b981' }}>
                <UserCheck size={32} style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>All students on track!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent alerts */}
      <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Bell size={18} color="#f59e0b" />
          <h3 style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>Recent Alerts</h3>
          <button className="btn-secondary" style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => api.post('/alerts/broadcast', { title: 'Reminder', message: 'Please ensure attendance is above 60%.', alert_type: 'warning' }).then(() => toast.success('Alert broadcasted!'))}>
            Broadcast Alert
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.length ? alerts.map(a => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.alert_type === 'danger' ? '#ef4444' : a.alert_type === 'warning' ? '#f59e0b' : '#3b82f6', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.title}</div>
                <div style={{ color: '#64748b', fontSize: '0.775rem' }}>{a.message.slice(0, 80)}...</div>
              </div>
              <div style={{ color: '#475569', fontSize: '0.72rem', flexShrink: 0 }}>{new Date(a.created_at).toLocaleDateString()}</div>
            </div>
          )) : (
            <p style={{ color: '#475569', fontSize: '0.875rem', textAlign: 'center', padding: '20px' }}>No alerts yet</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
        {[
          { label: 'Add Student',      icon: Users,    action: () => navigate('/admin/students'), color: '#3b82f6' },
          { label: 'View Reports',     icon: BarChart3, action: () => navigate('/admin/reports'),  color: '#7c3aed' },
          { label: 'Upload Timetable', icon: Calendar, action: () => navigate('/admin/timetable'), color: '#06b6d4' },
          { label: 'Export All Data',  icon: Download, action: () => { window.open('/api/reports/export/excel', '_blank') }, color: '#10b981' },
        ].map(({ label, icon: Icon, action, color }) => (
          <button key={label} onClick={action} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '16px 20px', borderRadius: '14px',
            background: `${color}10`, border: `1px solid ${color}25`,
            color: '#f1f5f9', cursor: 'pointer', transition: 'all 0.2s',
            fontWeight: 600, fontSize: '0.875rem',
          }}
            onMouseOver={e => { e.currentTarget.style.background = `${color}20`; e.currentTarget.style.borderColor = `${color}50` }}
            onMouseOut={e => { e.currentTarget.style.background = `${color}10`; e.currentTarget.style.borderColor = `${color}25` }}
          >
            <Icon size={18} color={color} />
            {label}
          </button>
        ))}
      </div>
    </Layout>
  )
}
