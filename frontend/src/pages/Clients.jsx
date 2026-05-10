import { useEffect, useState } from 'react'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  })

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await fetch('https://ai-office-employee-api.vercel.app/api/clients')
      const data = await res.json()
      if (data.success) {
        setClients(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const method = editingClient ? 'PATCH' : 'POST'
    const url = editingClient 
      ? `https://ai-office-employee-api.vercel.app/api/clients/${editingClient.id}`
      : 'https://ai-office-employee-api.vercel.app/api/clients'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        fetchClients()
        setShowModal(false)
        setEditingClient(null)
        setFormData({ name: '', email: '', phone: '', company: '', notes: '' })
      }
    } catch (error) {
      console.error('Failed to save client:', error)
    }
  }

  const handleEdit = (client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      notes: client.notes
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this client?')) {
      try {
        await fetch(`https://ai-office-employee-api.vercel.app/api/clients/${id}`, {
          method: 'DELETE'
        })
        fetchClients()
      } catch (error) {
        console.error('Failed to delete client:', error)
      }
    }
  }

  return (
    <div className="clients-page">
      <div className="page-header">
        <h1>Clients</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Client</button>
      </div>
      <div className="clients-list">
        {clients.length === 0 ? (
          <p className="no-data">No clients found</p>
        ) : (
          clients.map(client => (
            <div key={client.id} className="client-card">
              <div className="client-header">
                <h3>{client.name}</h3>
                {client.company && <span className="company-badge">{client.company}</span>}
              </div>
              <div className="client-info">
                {client.email && <p>📧 {client.email}</p>}
                {client.phone && <p>📞 {client.phone}</p>}
              </div>
              {client.notes && <p className="client-notes">{client.notes}</p>}
              <div className="client-actions">
                <button className="btn btn-small" onClick={() => handleEdit(client)}>Edit</button>
                <button className="btn btn-small btn-danger" onClick={() => handleDelete(client.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Company</label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setShowModal(false)
                  setEditingClient(null)
                  setFormData({ name: '', email: '', phone: '', company: '', notes: '' })
                }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
