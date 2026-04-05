import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/client'
import { Users, Plus, Trash2, Search, Camera, Eye, X, Loader, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function StudentsPage() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: 'student123', student_id: '', department: 'CSE', semester: 6, section: 'A' })
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/users/students')
      setStudents(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const addStudent = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) return toast.error('Name and email required')
    setAdding(true)
    try {
      await api.post('/users/', { ...form, role: 'student', semester: Number(form.semester) })
      toast.success('Student added successfully')
      setShowAdd(false)
      setForm({ name: '', email: '', password: 'student123', student_id: '', department: 'CSE', semester: 6, section: 'A' })
      load()
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Failed to add student')
    } finally { setAdding(false) }
  }

  const deleteStudent = async (id, name) => {
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await api.delete(`/users/${id}`)
      toast.success(`${name} removed`)
      setStudents(p => p.filter(s => s.id !== id))
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Delete failed')
    } finally { setDeleting(null) }
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.student_id || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="Students" subtitle={`${students.length} registered students`}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={15} color="#475569" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input className="input-field" style={{ paddingLeft: '40px', padding: '10px 14px 10px 40px' }}
            placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> Add Student
        </button>
      </div>

      {/* Add Student Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setShowAdd(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
            <h3 style={{ fontWeight: 800, fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.2rem', marginBottom: '24px' }}>Add New Student</h3>
            <form onSubmit={addStudent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input className="input-field" placeholder="Full Name *" value={form.name} onChange={e => setF('name', e.target.value)} required />
              <input className="input-field" type="email" placeholder="Email *" value={form.email} onChange={e => setF('email', e.target.value)} required />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input className="input-field" placeholder="Enroll No (BT/CSE/23/059)" value={form.student_id} onChange={e => setF('student_id', e.target.value)} />
                <select className="input-field" value={form.section} onChange={e => setF('section', e.target.value)}>
                  {['A','B'].map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <select className="input-field" value={form.department} onChange={e => setF('department', e.target.value)}>
                  {['CSE','IT'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="input-field" value={form.semester} onChange={e => setF('semester', e.target.value)}>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                </select>
              </div>
              <input className="input-field" type="password" placeholder="Password (default: student123)" value={form.password} onChange={e => setF('password', e.target.value)} />
              <button type="submit" className="btn-primary" disabled={adding} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                {adding ? <><Loader size={15} className="animate-spin" /> Adding...</> : 'Add Student'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Students grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: '16px' }} />)}
        </div>
      ) : filtered.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filtered.map(s => (
            <div key={s.id} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                {/* Avatar */}
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 800, color: 'white', flexShrink: 0,
                }}>{s.name[0].toUpperCase()}</div>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.775rem', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {s.student_id && <span className="badge badge-muted" style={{ fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ opacity: 0.6 }}>ENROLL: </span>{s.student_id}
                    </span>}
                    {s.department && <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{s.department}</span>}
                    <span className={`badge ${s.face_registered ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.68rem' }}>
                      {s.face_registered ? '✓ Face' : '! No Face'}
                    </span>
                  </div>
                </div>

                <button onClick={() => deleteStudent(s.id, s.name)} className="btn-danger" style={{ padding: '6px', borderRadius: '8px', flexShrink: 0 }} disabled={deleting === s.id}>
                  {deleting === s.id ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
          <Users size={48} style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No students found</h3>
          <p style={{ fontSize: '0.875rem' }}>Add your first student to get started</p>
        </div>
      )}
    </Layout>
  )
}
