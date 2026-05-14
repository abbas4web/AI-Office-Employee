import { useEffect, useState, useMemo } from 'react'
import { API_URL, authHeader } from '../api'
import { RefreshCw, UserPlus, Pencil, Trash2 } from 'lucide-react'
import Drawer from '../components/Drawer'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community'

// Register AG Grid Modules
ModuleRegistry.registerModules([AllCommunityModule]);

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

  // Pagination State
  const [gridApi, setGridApi] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // AG-Grid Pagination Helpers
  const onGridReady = (params) => setGridApi(params.api);

  const onPaginationChanged = () => {
    if (gridApi) {
      setCurrentPage(gridApi.paginationGetCurrentPage() + 1);
      setTotalPages(gridApi.paginationGetTotalPages() === 0 ? 1 : gridApi.paginationGetTotalPages());
    }
  };

  const handlePageSizeChange = (e) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    if (gridApi) gridApi.paginationSetPageSize(newSize);
  };

  const goToPage = (page) => {
    if (page === '...') return;
    if (gridApi) gridApi.paginationGoToPage(page - 1);
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // AG-Grid Column Definitions
  const colDefs = useMemo(() => [
    { field: "name", headerName: "Name", flex: 1, minWidth: 150 },
    { field: "company", headerName: "Company", flex: 1, minWidth: 150, valueFormatter: p => p.value || "-" },
    { field: "email", headerName: "Email", flex: 1.2, minWidth: 180, valueFormatter: p => p.value || "-" },
    { field: "phone", headerName: "Phone", flex: 1, minWidth: 130, valueFormatter: p => p.value || "-" },
    { field: "notes", headerName: "Notes", flex: 1.5, minWidth: 200, valueFormatter: p => p.value || "-" },
    {
      headerName: "Actions",
      flex: 1,
      minWidth: 160,
      sortable: false,
      filter: false,
      cellRenderer: (params) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '100%' }}>
          <button className="btn btn-small btn-secondary" onClick={() => openEdit(params.data)} style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Pencil size={13} />Edit
          </button>
          <button className="btn btn-small btn-danger" onClick={() => handleDelete(params.data.id)} style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Trash2 size={13} />Delete
          </button>
        </div>
      )
    }
  ], []);

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
        <div 
          className="table-and-pagination-wrapper"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: 'calc(100vh - 160px)', 
            minHeight: '450px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            paddingTop: '1rem',
            paddingLeft: '1rem',
            paddingRight: '1rem'
          }}
        >
          <div 
            className="ag-theme-quartz premium-grid" 
            style={{ 
              flex: 1,
              width: '100%',
              minHeight: 0
            }}
          >
            <AgGridReact 
              rowData={clients} 
              columnDefs={colDefs} 
              rowHeight={60}
              headerHeight={48}
              pagination={true}
              paginationPageSize={pageSize}
              suppressPaginationPanel={true}
              onGridReady={onGridReady}
              onPaginationChanged={onPaginationChanged}
              defaultColDef={{
                sortable: true,
                filter: true,
                resizable: true,
                suppressMovable: true
              }}
              autoSizeStrategy={{
                type: 'fitGridWidth'
              }}
            />
          </div>

          {/* Custom Pagination Footer */}
          {clients.length > 0 && (
            <div className="custom-pagination" style={{ padding: '0.75rem 0.5rem', borderTop: '1px solid #f3f4f6', background: '#ffffff', margin: 0 }}>
              <div className="page-size-selector">
                <span>Item Per Page</span>
                <select value={pageSize} onChange={handlePageSizeChange} className="page-size-dropdown">
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="page-controls">
                <button 
                  onClick={() => goToPage(currentPage - 1)} 
                  disabled={currentPage === 1} 
                  className="page-btn prev-next"
                >
                  &larr; Previous
                </button>
                
                {getPageNumbers().map((page, index) => (
                  <button 
                    key={index} 
                    onClick={() => goToPage(page)} 
                    className={`page-btn num-btn ${currentPage === page ? 'active' : ''} ${page === '...' ? 'dots' : ''}`}
                    disabled={page === '...'}
                  >
                    {page}
                  </button>
                ))}

                <button 
                  onClick={() => goToPage(currentPage + 1)} 
                  disabled={currentPage === totalPages} 
                  className="page-btn prev-next"
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          )}
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
