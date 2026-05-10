import { useEffect, useState } from 'react'

export default function Reminders() {
  const [reminders, setReminders] = useState([])

  useEffect(() => {
    fetchReminders()
  }, [])

  const fetchReminders = async () => {
    try {
      const res = await fetch('https://ai-office-employee-api.vercel.app/api/reminders')
      const data = await res.json()
      if (data.success) {
        setReminders(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch reminders:', error)
    }
  }

  const markAsRead = async (id) => {
    try {
      await fetch(`https://ai-office-employee-api.vercel.app/api/reminders/${id}`, {
        method: 'PATCH'
      })
      fetchReminders()
    } catch (error) {
      console.error('Failed to mark reminder as read:', error)
    }
  }

  return (
    <div className="reminders-page">
      <div className="page-header">
        <h1>Reminders</h1>
        <button className="btn btn-secondary" onClick={fetchReminders}>Refresh</button>
      </div>

      {reminders.length === 0 ? (
        <p className="no-data">No reminders</p>
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
                <p className="reminder-task">Task: {reminder.task_title}</p>
              )}
              <div className="reminder-meta">
                <span>Created: {new Date(reminder.created_at).toLocaleString()}</span>
              </div>
              {!reminder.is_read && (
                <button className="btn btn-small" onClick={() => markAsRead(reminder.id)}>
                  Mark as Read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
