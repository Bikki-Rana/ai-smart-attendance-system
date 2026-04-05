import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { useAuthStore } from '../store'
import api from '../api/client'
import { Download, Filter, Search, Calendar, BarChart3, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const { user } = useAuthStore()
  const [records, setRecords] = useState([])
  const [heatmap, setHeatmap] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const load = async () => {
      try {
        const [recRes, hmRes, statRes] = await Promise.all([
          api.get('/attendance/'),
          api.get(`/reports/heatmap/${user.id}`),
          api.get(`/attendance/stats/student/${user.id}`),
        ])
        setRecords(recRes.data)
        setHeatmap(hmRes.data)
        setStats(statRes.data)
      } catch { toast.error('Failed to load reports') }
      finally { setLoading(false) }
    }
    if (user?.id) load()
  }, [user])

  const filtered = records.filter(r =>
    (r.subject_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.student_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.date || '').includes(search)
  )

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  // Chart data
  const subjectChartData = stats?.subject_breakdown?.map(s => ({
    name: s.subject_name.split(' ').slice(0, 2).join(' '),
    attended: s.attended,
    total: s.total_classes,
    pct: s.percentage,
  })) || []

  const heatmapByMonth = heatmap.reduce((acc, { date, count }) => {
    const month = date.slice(0, 7)
    acc[month] = (acc[month] || 0) + count
    return acc
  }, {})
  const trendData = Object.entries(heatmapByMonth).map(([month, count]) => ({ month, count }))

  const Tooltip2 = ({ active, payload, label }) => active && payload?.length ? (
    <div style={{ background: '#131929', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '10px 14px', fontSize: '0.8rem' }}>
      <p style={{ color: '#94a3b8', marginBottom: '4px' }}>{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</p>)}
    </div>
  ) : null

  return (
    <Layout title="Reports & Analytics" subtitle="Detailed attendance analytics and history">
      {/* Export buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', justifyContent: 'flex-end' }}>
        <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.875rem' }}
          onClick={() => window.open('/api/reports/export/csv', '_blank')}>
          <Download size={15} /> Export CSV
        </button>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '0.875rem' }}
          onClick={() => window.open('/api/reports/export/excel', '_blank')}>
          <Download size={15} /> Export Excel
        </button>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Subject bar chart */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '4px' }}>Subject-wise Attendance</h3>
          <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '20px' }}>Classes attended per subject</p>
          {subjectChartData.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={subjectChartData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                <Tooltip content={<Tooltip2 />} />
                <Bar dataKey="attended" fill="#3b82f6" radius={[4,4,0,0]} name="Attended" />
                <Bar dataKey="total" fill="rgba(255,255,255,0.06)" radius={[4,4,0,0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
              <BarChart3 size={32} />
            </div>
          )}
        </div>

        {/* Monthly trend */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '4px' }}>Monthly Trend</h3>
          <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '20px' }}>Classes attended per month</p>
          {trendData.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#475569" tick={{ fontSize: 10 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                <Tooltip content={<Tooltip2 />} />
                <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={{ fill: '#7c3aed', r: 4 }} name="Classes" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
              <TrendingUp size={32} />
            </div>
          )}
        </div>
      </div>

      {/* Attendance Heatmap */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif', marginBottom: '20px' }}>Attendance Heatmap</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {heatmap.length ? heatmap.map(({ date, count }) => (
            <div
              key={date}
              className="heatmap-cell"
              title={`${date}: ${count} class(es)`}
              style={{
                background: count === 0 ? 'rgba(255,255,255,0.04)'
                  : count === 1 ? 'rgba(59,130,246,0.3)'
                  : count <= 2 ? 'rgba(59,130,246,0.6)'
                  : '#3b82f6',
              }}
            />
          )) : (
            <p style={{ color: '#475569', fontSize: '0.875rem' }}>No attendance data yet</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center', fontSize: '0.72rem', color: '#475569' }}>
          <span>Less</span>
          {['rgba(255,255,255,0.04)', 'rgba(59,130,246,0.3)', 'rgba(59,130,246,0.6)', '#3b82f6'].map(c => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: '3px', background: c }} />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Records Table */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
          <h3 style={{ fontWeight: 700, fontFamily: 'Space Grotesk, sans-serif' }}>Attendance Records</h3>
          <div style={{ position: 'relative', flex: '0 0 260px' }}>
            <Search size={15} color="#475569" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input className="input-field" style={{ paddingLeft: '36px', padding: '9px 12px 9px 36px', fontSize: '0.8rem' }}
              placeholder="Search subject, student, date..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {isAdmin && <th>Student</th>}
                <th>Subject</th>
                <th>Date</th>
                <th>Status</th>
                <th>Liveness</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i}>
                    {isAdmin && <td><div className="skeleton" style={{ height: 16, width: 120, borderRadius: '6px' }} /></td>}
                    <td><div className="skeleton" style={{ height: 16, width: 140, borderRadius: '6px' }} /></td>
                    <td><div className="skeleton" style={{ height: 16, width: 90, borderRadius: '6px' }} /></td>
                    <td><div className="skeleton" style={{ height: 20, width: 70, borderRadius: '100px' }} /></td>
                    <td><div className="skeleton" style={{ height: 20, width: 60, borderRadius: '100px' }} /></td>
                    <td><div className="skeleton" style={{ height: 16, width: 60, borderRadius: '6px' }} /></td>
                  </tr>
                ))
              ) : paginated.length ? paginated.map(r => (
                <tr key={r.id}>
                  {isAdmin && <td style={{ fontWeight: 600 }}>{r.student_name || '—'}</td>}
                  <td>{r.subject_name || '—'}</td>
                  <td style={{ color: '#64748b' }}>{r.date}</td>
                  <td><span className={`badge ${r.status === 'present' ? 'badge-success' : 'badge-danger'}`}>{r.status}</span></td>
                  <td><span className={`badge ${r.liveness_passed ? 'badge-success' : 'badge-danger'}`}>{r.liveness_passed ? 'Pass' : 'Fail'}</span></td>
                  <td style={{ color: '#64748b' }}>{r.confidence ? `${r.confidence.toFixed(1)}%` : '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '32px', color: '#475569' }}>No records found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ display: 'flex', alignItems: 'center', color: '#64748b', fontSize: '0.8rem' }}>Page {page} of {totalPages}</span>
            <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </Layout>
  )
}
