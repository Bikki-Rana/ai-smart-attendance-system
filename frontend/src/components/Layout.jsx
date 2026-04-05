import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'
import { useState } from 'react'

export default function Layout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="page-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="main-content">
        {/* Mobile topbar */}
        <div style={{ display: 'none' }} className="mobile-topbar">
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f1f5f9' }}>
            <Menu size={24} />
          </button>
        </div>

        {/* Page header */}
        {title && (
          <div className="topbar">
            <div>
              <h1 style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                fontFamily: 'Space Grotesk, sans-serif',
                color: '#f1f5f9',
                lineHeight: 1.2,
              }}>{title}</h1>
              {subtitle && <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}>{subtitle}</p>}
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="animate-fade-up">{children}</div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          .main-content { margin-left: 0 !important; }
          .mobile-topbar { display: flex !important; align-items: center; gap: 16px; margin-bottom: 24px; }
        }
      `}</style>
    </div>
  )
}
