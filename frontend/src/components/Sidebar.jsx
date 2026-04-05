import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import {
  LayoutDashboard, Camera, Calendar, BarChart3,
  User, Users, LogOut, Shield, Bell, BookOpen, ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import api from '../api/client'

const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <div style={{
      width: 38, height: 38, borderRadius: '10px',
      background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Camera size={20} color="white" />
    </div>
    <div>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.1rem', color: '#f1f5f9' }}>SmartAttend</div>
      <div style={{ fontSize: '0.65rem', color: '#7c3aed', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>AI Powered</div>
    </div>
  </div>
)

export default function Sidebar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts/unread-count')
        setAlertCount(res.data.count)
      } catch {}
    }
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const isAdmin = user?.role === 'admin'

  const adminLinks = [
    { to: '/admin',          icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/students', icon: Users,           label: 'Students'  },
    { to: '/admin/reports',  icon: BarChart3,       label: 'Reports'   },
    { to: '/admin/timetable',icon: Calendar,        label: 'Timetable' },
    { to: '/profile',        icon: User,            label: 'Profile'   },
  ]

  const studentLinks = [
    { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
    { to: '/attendance', icon: Camera,          label: 'Attendance' },
    { to: '/timetable',  icon: Calendar,        label: 'Timetable'  },
    { to: '/reports',    icon: BarChart3,       label: 'Reports'    },
    { to: '/profile',    icon: User,            label: 'Profile'    },
  ]

  const links = isAdmin ? adminLinks : studentLinks

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', padding: '24px 16px' }}>
      {/* Logo */}
      <div style={{ marginBottom: '32px', paddingLeft: '8px' }}>
        <Logo />
      </div>

      {/* User info */}
      <div style={{
        background: 'rgba(59,130,246,0.08)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: '14px',
        padding: '14px',
        marginBottom: '24px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: user?.profile_image ? `url(${user.profile_image}) center/cover no-repeat` : 'linear-gradient(135deg, #3b82f6, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', fontWeight: 700, color: 'white', flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden'
        }}>
          {!user?.profile_image && (user?.name?.[0]?.toUpperCase() || 'U')}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
            {isAdmin ? <Shield size={11} color="#7c3aed" /> : <User size={11} color="#3b82f6" />}
            <span style={{ fontSize: '0.7rem', color: isAdmin ? '#7c3aed' : '#3b82f6', fontWeight: 600, textTransform: 'capitalize' }}>{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: '8px' }}>
          Navigation
        </div>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin' || to === '/dashboard'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span style={{ flex: 1 }}>{label}</span>
            {label === 'Attendance' && alertCount > 0 && (
              <span style={{
                background: '#ef4444', color: 'white',
                borderRadius: '100px', padding: '2px 7px', fontSize: '0.65rem', fontWeight: 700
              }}>{alertCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', marginTop: '16px' }}>
        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}
