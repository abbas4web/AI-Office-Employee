import { useEffect, useState } from 'react'
import { API_URL, authHeader } from '../api'

export default function Activity() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    fetchLogs()
  }, [filterType])

  const fetchLogs = async () => {
    setLoading(true)
    setError('')
    try {
      let url = `${API_URL}/api/activity-logs?limit=50`
      if (filterType === 'task') url += '&entity_type=task'
      if (filterType === 'client') url += '&entity_type=client'
      
      const res = await fetch(url, { headers: authHeader() })
      const data = await res.json()
      if (data.success) {
        setLogs(data.data)
      } else {
        setError('Failed to load activity logs.')
      }
    } catch {
      setError('Cannot reach server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return '#4caf50'
      case 'UPDATE': return '#3498db'
      case 'COMPLETE': return '#9c27b0'
      case 'DELETE': return '#e74c3c'
      default: return '#7f8c8d'
    }
  }

  const getActionLabel = (action, entityType) => {
    if (action === 'COMPLETE') return `completed ${entityType}`
    if (action === 'CREATE') return `created ${entityType}`
    if (action === 'UPDATE') return `updated ${entityType}`
    if (action === 'DELETE') return `deleted ${entityType}`
    return `${action} ${entityType}`
  }

  return (
    <div className="activity-page">
      <div className="page-header">
        <h1>Activity Log</h1>
        <div className="header-actions">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Activity</option>
            <option value="task">Tasks Only</option>
            <option value="client">Clients Only</option>
          </select>
          <button className="btn btn-secondary" onClick={fetchLogs} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading && logs.length === 0 ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading activity logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <p className="no-data">No activity found</p>
      ) : (
        <div className="timeline">
          {logs.map(log => (
            <div key={log.id} className="timeline-item">
              <div 
                className="timeline-badge" 
                style={{ backgroundColor: getActionColor(log.action) }}
              >
                {log.action.substring(0, 1)}
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <strong>{log.performed_by || 'System'}</strong> 
                  <span className="timeline-action">
                    {' '}{getActionLabel(log.action, log.entity_type)}
                  </span>
                  <span className="timeline-date">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
                {log.details && (
                  <div className="timeline-details">
                    {log.details.title && <p><strong>Task:</strong> {log.details.title}</p>}
                    {log.details.name && <p><strong>Client:</strong> {log.details.name}</p>}
                    {log.details.status && log.action === 'UPDATE' && (
                      <p><strong>Status:</strong> changed to {log.details.status}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
