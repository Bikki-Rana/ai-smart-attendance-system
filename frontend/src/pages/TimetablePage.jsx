import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuthStore } from '../store'
import api from '../api/client'
import { Calendar, Clock, BookOpen, User } from 'lucide-react'
import toast from 'react-hot-toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const COLORS = {
  'CD':    '#3b82f6', 'ML':     '#7c3aed', 'WT':   '#06b6d4',
  'CN':   '#10b981', 'FSE':    '#f59e0b',
  'WT-LAB':'#0e7490','ML-LAB': '#6d28d9','CD-LAB':'#1d4ed8','CN-LAB':'#065f46',
}

export default function TimetablePage() {
  const { user } = useAuthStore()
  const [schedule, setSchedule] = useState([])
  const [currentClass, setCurrentClass] = useState(null)
  const [activeDay, setActiveDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [schedRes, classRes] = await Promise.all([
          api.get('/timetable/schedule'),
          api.get('/timetable/current-class'),
        ])
        setSchedule(schedRes.data)
        setCurrentClass(classRes.data)
      } catch { toast.error('Failed to load timetable') }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const daySlots = schedule.filter(s => s.day === activeDay)

  return (
    <Layout title="Timetable" subtitle="CSE VI Semester · Spring 2026">
      {/* Current class banner */}
      {currentClass?.is_ongoing && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(124,58,237,0.15))',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: '16px', padding: '20px 24px', marginBottom: '24px',
        }}>
          <div style={{ width: 46, height: 46, borderRadius: '12px', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
              🔴 Currently In Progress
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif' }}>{currentClass.subject_name}</div>
            <div style={{ color: '#64748b', fontSize: '0.825rem', marginTop: '2px' }}>
              {currentClass.teacher_name} · {currentClass.start_time} – {currentClass.end_time}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Time Remaining</div>
            <ClockDisplay endTime={currentClass.end_time} />
          </div>
        </div>
      )}

      {/* Day picker */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {DAYS.map(day => {
          const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' })
          const isActive = day === activeDay
          return (
            <button key={day} onClick={() => setActiveDay(day)} style={{
              padding: '10px 20px', borderRadius: '100px', fontSize: '0.875rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
              background: isActive ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : 'transparent',
              color: isActive ? 'white' : isToday ? '#3b82f6' : '#64748b',
              border: isActive ? 'none' : isToday ? '1px solid rgba(59,130,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
            }}>
              {day}
              {isToday && !isActive && <span style={{ width: 6, height: 6, background: '#3b82f6', borderRadius: '50%', display: 'inline-block', marginLeft: '6px', verticalAlign: 'middle' }} />}
            </button>
          )
        })}
      </div>

      {/* Schedule grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90, borderRadius: '16px' }} />)}
        </div>
      ) : daySlots.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {daySlots.map((slot, i) => {
            const color = COLORS[slot.code] || '#3b82f6'
            const isOngoing = currentClass?.is_ongoing && currentClass.subject_code === slot.code
            return (
              <div key={i} style={{
                display: 'flex', gap: '16px', alignItems: 'center',
                padding: '20px 24px', borderRadius: '16px',
                background: isOngoing ? 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(124,58,237,0.12))' : 'var(--bg-card)',
                border: `1px solid ${isOngoing ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.06)'}`,
                position: 'relative', overflow: 'hidden',
                transition: 'all 0.3s',
              }}>
                {/* Color stripe */}
                <div style={{ width: 4, height: '60%', background: color, borderRadius: '2px', flexShrink: 0 }} />

                {/* Time */}
                <div style={{ width: 90, flexShrink: 0, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f1f5f9' }}>{slot.start}</div>
                  <div style={{ fontSize: '0.72rem', color: '#475569', margin: '2px 0' }}>—</div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 700, color: '#f1f5f9' }}>{slot.end}</div>
                </div>

                {/* Subject info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'Space Grotesk, sans-serif', marginBottom: '6px' }}>
                    {slot.subject}
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#64748b' }}>
                      <User size={12} /> {slot.teacher_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: '#64748b' }}>
                      <Clock size={12} /> {slot.start} – {slot.end}
                    </div>
                  </div>
                </div>

                {/* Badge */}
                <div style={{ flexShrink: 0 }}>
                  {isOngoing ? (
                    <span className="badge badge-success" style={{ animation: 'pulse-ring 2s infinite' }}>🔴 LIVE</span>
                  ) : (
                    <span style={{
                      padding: '4px 12px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 600,
                      background: `${color}20`, color, border: `1px solid ${color}30`,
                    }}>{slot.code}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
          <Calendar size={48} style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No classes on {activeDay}</h3>
          <p style={{ fontSize: '0.875rem' }}>Enjoy your day off!</p>
        </div>
      )}
    </Layout>
  )
}

function ClockDisplay({ endTime }) {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    const update = () => {
      const now = new Date()
      const [h, m] = endTime.split(':').map(Number)
      const end = new Date()
      end.setHours(h, m, 0, 0)
      const diff = end - now
      if (diff <= 0) { setRemaining('Ended'); return }
      const mins = Math.floor(diff / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setRemaining(`${mins}m ${secs}s`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [endTime])
  return <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#3b82f6', fontFamily: 'Space Grotesk, sans-serif' }}>{remaining}</div>
}
