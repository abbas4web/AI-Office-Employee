import { useEffect, useState } from 'react'
import { API_URL, authHeader } from '../api'
import { UserCog, UserPlus, Crown, Briefcase, User, Pencil, Trash2, RefreshCw, Lock } from 'lucide-react'

const ROLE_COLORS = {
  admin:    { bg: '#fde8e8', color: '#c0392b' },
  manager:  { bg: '#fff3e0', color: '#e65100' },
  employee: { bg: '#e8f5e9', color: '#2e7d32' },
}

const ROLE_ICONS = { admin: <Crown size={13}/>, manager: <Briefcase size={13}/>, employee: <User size={13}/> }

const initForm = { name: '', email: '', password: '', role: 'employee' }

export default function Team() {
  const [employees, setEmployees]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [toast, setToast]           = useState('')

  // Modal state
  const [showModal, setShowModal]   = useState(false)
  const [editTarget, setEditTarget] = useState(null) // null = add, obj = edit
  const [form, setForm]             = useState(initForm)
  const [formError, setFormError]   = useState('')
  const [saving, setSaving]         = useState(false)

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  const currentUser  = JSON.parse(localStorage.getItem('user') || '{}')

  // Read role from JWT token (always fresh) with localStorage fallback
  const getRole = () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return currentUser.role || 'employee'
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.role || currentUser.role || 'employee'
    } catch { return currentUser.role || 'employee' }
  }
  const myRole       = getRole()
  const isPrivileged = myRole === 'admin' || myRole === 'manager'

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  // Fetch all employees
  const fetchEmployees = async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${API_URL}/api/users`, { headers: authHeader() })
      const data = await res.json()
      if (data.success) setEmployees(data.data)
      else setError('Failed to load employees.')
    } catch { setError('Cannot reach server.') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchEmployees() }, [])

  // Open Add modal
  const openAdd = () => {
    setEditTarget(null); setForm(initForm); setFormError(''); setShowModal(true)
  }

  // Open Edit modal
  const openEdit = (emp) => {
    setEditTarget(emp)
    setForm({ name: emp.name, email: emp.email, password: '', role: emp.role })
    setFormError(''); setShowModal(true)
  }

  // Save (create or update)
  const handleSave = async (e) => {
    e.preventDefault(); setFormError(''); setSaving(true)
    try {
      const isEdit = !!editTarget
      const url    = isEdit ? `${API_URL}/api/users/${editTarget.id}` : `${API_URL}/api/users`
      const method = isEdit ? 'PATCH' : 'POST'
      const body   = { ...form }
      if (isEdit && !body.password) delete body.password // don't send empty password on edit

      const res  = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) { setFormError(data.message || 'Failed to save.'); return }

      setShowModal(false)
      fetchEmployees()
      showToast(isEdit ? `✅ ${data.data.name} updated!` : `✅ ${data.data.name} added to team!`)
    } catch { setFormError('Server error. Try again.') }
    finally { setSaving(false) }
  }

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res  = await fetch(`${API_URL}/api/users/${deleteTarget.id}`, {
        method: 'DELETE', headers: authHeader(),
      })
      const data = await res.json()
      if (!res.ok) { showToast(`❌ ${data.message}`); return }
      setDeleteTarget(null)
      fetchEmployees()
      showToast(`🗑 ${deleteTarget.name} removed from team.`)
    } catch { showToast('❌ Server error.') }
    finally { setDeleting(false) }
  }

  // Stats
  const stats = {
    total:    employees.length,
    admins:   employees.filter(e => e.role === 'admin').length,
    managers: employees.filter(e => e.role === 'manager').length,
    employees:employees.filter(e => e.role === 'employee').length,
  }

  return (
    <div className="team-page">
      {/* Toast */}
      {toast && <div className="gmail-toast">{toast}</div>}

      {/* Header */}
      <div className="page-header">
        <h1 style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><UserCog size={22}/>Team Management</h1>
        {isPrivileged && (
          <button className="btn btn-primary" onClick={openAdd}><UserPlus size={15}/>Add Employee</button>
        )}
      </div>

      {/* Stats */}
      <div className="team-stats">
        <div className="team-stat-card"><span className="team-stat-num">{stats.total}</span><span>Total</span></div>
        <div className="team-stat-card admin"><span className="team-stat-num">{stats.admins}</span><span style={{display:'flex',alignItems:'center',gap:'4px'}}><Crown size={12}/>Admins</span></div>
        <div className="team-stat-card manager"><span className="team-stat-num">{stats.managers}</span><span style={{display:'flex',alignItems:'center',gap:'4px'}}><Briefcase size={12}/>Managers</span></div>
        <div className="team-stat-card employee"><span className="team-stat-num">{stats.employees}</span><span style={{display:'flex',alignItems:'center',gap:'4px'}}><User size={12}/>Employees</span></div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Employee Grid */}
      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading team...</p></div>
      ) : (
        <div className="team-grid">
          {employees.map(emp => {
            const roleStyle = ROLE_COLORS[emp.role] || ROLE_COLORS.employee
            const isMe      = emp.id === currentUser.id
            return (
              <div key={emp.id} className={`team-card ${isMe ? 'team-card-me' : ''}`}>
                {isMe && <span className="team-you-badge">You</span>}

                {/* Avatar */}
                <div className="team-avatar">
                  {emp.name?.[0]?.toUpperCase() || '?'}
                </div>

                {/* Info */}
                <h3 className="team-name">{emp.name}</h3>
                {isPrivileged
                  ? <p className="team-email">{emp.email}</p>
                  : <p className="team-email" style={{ letterSpacing: '0.1em', opacity: 0.5 }}>••••@••••.com</p>
                }

                {/* Role Badge */}
                <span
                  className="team-role-badge"
                  style={{ background: roleStyle.bg, color: roleStyle.color }}
                >
                  {ROLE_ICONS[emp.role]} {emp.role?.charAt(0).toUpperCase() + emp.role?.slice(1)}
                </span>

                <p className="team-joined">
                  Joined {new Date(emp.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                </p>

                {/* Actions — admin & manager only */}
                {isPrivileged && (
                  <div className="team-card-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => openEdit(emp)}><Pencil size={13}/>Edit</button>
                    {!isMe && <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(emp)}><Trash2 size={13}/>Remove</button>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!isPrivileged && (
        <p className="team-admin-note" style={{display:'flex',alignItems:'center',gap:'0.4rem',justifyContent:'center'}}>
          <Lock size={14}/>Only admins and managers can add, edit, or remove employees.
        </p>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editTarget ? '✏️ Edit Employee' : '➕ Add Employee'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {formError && <div className="error-banner">{formError}</div>}

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text" value={form.name} required
                  onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. John Smith"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email" value={form.email} required
                  onChange={e => setForm({...form, email: e.target.value})}
                  placeholder="john@company.com"
                />
              </div>
              <div className="form-group">
                <label>{editTarget ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                <input
                  type="password" value={form.password}
                  required={!editTarget}
                  minLength={editTarget ? 0 : 6}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder={editTarget ? 'Leave blank to keep current' : 'Min 6 characters'}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="employee">👤 Employee</option>
                  <option value="manager">🏢 Manager</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🗑 Remove Employee</h2>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <p style={{ color: '#555', margin: '1rem 0' }}>
              Are you sure you want to remove <strong>{deleteTarget.name}</strong> from the team?
              This cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
