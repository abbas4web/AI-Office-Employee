import { useEffect, useState } from 'react'
import { API_URL, authHeader } from '../api'

export default function Reminders() {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [marking, setMarking] = useState(null) // id of reminder being marked

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/reminders`, { headers: authHeader() })
      const data = await res.json()
      if (data.success) {
        setReminders(data.data)
      } else {
        setError('Failed to load reminders.')
      }
    } catch {
      setError('Cannot reach server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    setMarking(id)
    try {
      const res = await fetch(`${API_URL}/api/reminders/${id}`, {
        method: 'PATCH',
        headers: authHeader()
      })
      if (res.ok) {
        fetchReminders()
      } else {
        setError('Failed to mark reminder as read.')
      }
    } catch {
      setError('Cannot reach server.')
    } finally {
      setMarking(null)
    }
  }

  const unreadCount = reminders.filter(r => !r.is_read).length

  return (
    <div className="reminders-page">
      <div className="page-header">
        <h1>
          Reminders
          {unreadCount > 0 && <span className="badge" style={{ marginLeft: '10px' }}>{unreadCount} new</span>}
        </h1>
        <button className="btn btn-secondary" onClick={fetchReminders} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading reminders...</p>
        </div>
      ) : reminders.length === 0 ? (
        <p className="no-data">No reminders found</p>
      ) : (
        <div className="reminders-list">
          {reminders.map(reminder => (
            <div key={reminder.id} className={`reminder-card ${reminder.is_read ? 'read' : 'unread'}`}>
              <div className="reminder-header">
                <h3>{reminder.title}</h3>
                {!reminder.is_read && <span className="badge">New</span>}
              </div>
              <p className="reminder-message">{reminder.message}</p>
              {reminder.task_title && (
                <p className="reminder-task">📋 Task: {reminder.task_title}</p>
              )}
              <div className="reminder-meta">
                <span>🕐 {new Date(reminder.created_at).toLocaleString()}</span>
              </div>
              {!reminder.is_read && (
                <button
                  className="btn btn-small"
                  onClick={() => markAsRead(reminder.id)}
                  disabled={marking === reminder.id}
                >
                  {marking === reminder.id ? 'Marking...' : 'Mark as Read'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
