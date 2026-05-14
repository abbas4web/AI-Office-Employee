import { useEffect, useState } from 'react'
import { API_URL, authHeader } from '../api'
import { RefreshCw, UserPlus, Mail, Phone, Pencil, Trash2, Building2 } from 'lucide-react'
import Drawer from '../components/Drawer'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [showDrawer, setShowDrawer] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const emptyForm = { name: '', email: '', phone: '', company: '', notes: '' }
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => { fetchClients() }, [])

  const fetchClients = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_URL}/api/clients`, { headers: authHeader() })
      const data = await res.json()
      if (data.success) setClients(data.data)
      else setError('Failed to load clients.')
    } catch { setError('Cannot reach server.') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormError(''); setSaving(true)
    const method = editingClient ? 'PATCH' : 'POST'
    const url = editingClient ? `${API_URL}/api/clients/${editingClient.id}` : `${API_URL}/api/clients`
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...authHeader() }, body: JSON.stringify(formData) })
      const data = await res.json()
      if (res.ok) { fetchClients(); closeDrawer() }
      else setFormError(data.message || 'Failed to save client.')
    } catch { setFormError('Cannot reach server.') }
    finally { setSaving(false) }
  }

  const openAdd = () => { setEditingClient(null); setFormData(emptyForm); setFormError(''); setShowDrawer(true) }

  const openEdit = (client) => {
    setEditingClient(client)
    setFormData({ name: client.name||'', email: client.email||'', phone: client.phone||'', company: client.company||'', notes: client.notes||'' })
    setFormError(''); setShowDrawer(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return
    try {
      const res = await fetch(`${API_URL}/api/clients/${id}`, { method: 'DELETE', headers: authHeader() })
      if (res.ok) fetchClients()
      else setError('Failed to delete client.')
    } catch { setError('Cannot reach server.') }
  }

  const closeDrawer = () => { setShowDrawer(false); setEditingClient(null); setFormData(emptyForm); setFormError('') }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Clients</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchClients} disabled={loading}>
            <RefreshCw size={15} />{loading ? 'Loading...' : 'Refresh'}
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <UserPlus size={15} />Add Client
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading clients...</p></div>
      ) : (
        <div className="clients-list">
          {clients.length === 0 ? <p className="no-data">No clients found</p> : clients.map(client => (
            <div key={client.id} className="client-card">
              <div className="client-header">
                <h3>{client.name}</h3>
                {client.company && <span className="company-badge"><Building2 size={12} style={{marginRight:'4px'}}/>{client.company}</span>}
              </div>
              <div className="client-info">
                {client.email && <p><Mail size={14} />{client.email}</p>}
                {client.phone && <p><Phone size={14} />{client.phone}</p>}
              </div>
              {client.notes && <p className="client-notes">{client.notes}</p>}
              <div className="client-actions">
                <button className="btn btn-small btn-secondary" onClick={() => openEdit(client)}><Pencil size={13} />Edit</button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(client.id)}><Trash2 size={13} />Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={showDrawer}
        onClose={closeDrawer}
        title={editingClient ? 'Edit Client' : 'Add New Client'}
        subtitle={editingClient ? 'Update client contact information.' : 'Add a new client to your contact list.'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeDrawer} disabled={saving}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editingClient ? 'Save Changes' : 'Add Client'}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} id="client-form">
          {formError && <div className="error-banner" style={{marginBottom:'1rem'}}>{formError}</div>}

          <div className="drawer-section">
            <p className="drawer-section-title">Contact Information</p>
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Smith" required />
            </div>
            <div className="form-grid-2">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="john@example.com" />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 234 567 8900" />
              </div>
            </div>
            <div className="form-group">
              <label>Company</label>
              <input type="text" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} placeholder="Company name" />
            </div>
          </div>

          <div className="drawer-section">
            <p className="drawer-section-title">Additional Notes</p>
            <div className="form-group">
              <label>Notes</label>
              <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Any additional notes about this client..." rows={4} />
            </div>
          </div>
        </form>
      </Drawer>
    </div>
  )
}
