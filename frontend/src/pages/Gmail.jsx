import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_URL, authHeader } from '../api'

export default function Gmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState({ connected: false, gmail_email: null })
  const [statusLoading, setStatusLoading] = useState(true)
  const [emails, setEmails] = useState([])
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [emailsError, setEmailsError] = useState('')
  const [converting, setConverting] = useState({}) // { emailId: true/false }
  const [converted, setConverted] = useState({})   // { emailId: taskTitle }
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // Check connection status on load
  const checkStatus = useCallback(async () => {
    setStatusLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/gmail/status`, { headers: authHeader() })
      const data = await res.json()
      setStatus(data)
    } catch {
      setStatus({ connected: false })
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    checkStatus()
    // Handle redirect back from Google
    if (searchParams.get('connected') === 'true') {
      showToast('✅ Gmail connected successfully!')
    }
    if (searchParams.get('error')) {
      showToast('❌ Gmail connection failed. Please try again.')
    }
  }, [checkStatus, searchParams])

  // Connect Gmail — open Google OAuth in current tab
  const connectGmail = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gmail/auth-url`, { headers: authHeader() })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      showToast('❌ Could not initiate Gmail connection.')
    }
  }

  // Disconnect Gmail
  const disconnectGmail = async () => {
    if (!window.confirm('Disconnect your Gmail account?')) return
    try {
      await fetch(`${API_URL}/api/gmail/disconnect`, {
        method: 'DELETE',
        headers: authHeader(),
      })
      setStatus({ connected: false })
      setEmails([])
      showToast('Gmail disconnected.')
    } catch {
      showToast('❌ Failed to disconnect Gmail.')
    }
  }

  // Fetch emails
  const fetchEmails = async () => {
    setEmailsLoading(true)
    setEmailsError('')
    try {
      const res = await fetch(`${API_URL}/api/gmail/emails?limit=20`, { headers: authHeader() })
      const data = await res.json()
      if (data.success) {
        setEmails(data.emails)
      } else {
        setEmailsError(data.message || 'Failed to load emails.')
      }
    } catch {
      setEmailsError('Cannot reach server.')
    } finally {
      setEmailsLoading(false)
    }
  }

  // Convert email to task
  const convertToTask = async (email) => {
    setConverting(prev => ({ ...prev, [email.id]: true }))
    try {
      const res = await fetch(`${API_URL}/api/gmail/emails/to-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) {
        setConverted(prev => ({ ...prev, [email.id]: data.task.title }))
        showToast(`✅ Task created: "${data.task.title}"`)
      } else {
        showToast('❌ Failed to create task.')
      }
    } catch {
      showToast('❌ Server error.')
    } finally {
      setConverting(prev => ({ ...prev, [email.id]: false }))
    }
  }

  return (
    <div className="gmail-page">
      {/* Toast */}
      {toast && <div className="gmail-toast">{toast}</div>}

      {/* Header */}
      <div className="page-header">
        <h1>📧 Gmail Integration</h1>
      </div>

      {/* Connection Card */}
      <div className="gmail-connect-card">
        {statusLoading ? (
          <p>Checking Gmail connection...</p>
        ) : status.connected ? (
          <div className="gmail-connected">
            <div className="gmail-connected-info">
              <span className="gmail-dot connected" />
              <div>
                <strong>Gmail Connected</strong>
                <p>{status.gmail_email}</p>
              </div>
            </div>
            <div className="gmail-connect-actions">
              <button className="btn btn-primary" onClick={fetchEmails} disabled={emailsLoading}>
                {emailsLoading ? 'Loading...' : '📥 Fetch Emails'}
              </button>
              <button className="btn btn-danger" onClick={disconnectGmail}>
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="gmail-disconnected">
            <div className="gmail-connect-icon">📧</div>
            <h3>Connect Your Gmail</h3>
            <p>Connect your Gmail account to read emails and convert them into tasks automatically.</p>
            <button className="btn btn-primary btn-lg" onClick={connectGmail}>
              🔗 Connect Gmail
            </button>
          </div>
        )}
      </div>

      {/* Setup Instructions (shown when not connected) */}
      {!status.connected && !statusLoading && (
        <div className="gmail-setup-card">
          <h3>⚙️ Setup Required</h3>
          <ol className="gmail-setup-steps">
            <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">console.cloud.google.com</a></li>
            <li>Create a project → Enable <strong>Gmail API</strong></li>
            <li>Create <strong>OAuth 2.0 credentials</strong> (Web application)</li>
            <li>Add redirect URI: <code>https://ai-office-employee-api.vercel.app/api/gmail/callback</code></li>
            <li>Copy your <strong>Client ID</strong> and <strong>Client Secret</strong></li>
            <li>Add them to your Vercel environment variables</li>
            <li>Redeploy with <code>vercel --prod</code></li>
          </ol>
        </div>
      )}

      {/* Emails Error */}
      {emailsError && <div className="error-banner">{emailsError}</div>}

      {/* Email List */}
      {emails.length > 0 && (
        <div className="gmail-emails-section">
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h2>📥 Recent Emails ({emails.length})</h2>
            <button className="btn btn-secondary" onClick={fetchEmails} disabled={emailsLoading}>
              Refresh
            </button>
          </div>

          <div className="gmail-email-list">
            {emails.map((email) => (
              <div key={email.id} className={`gmail-email-card ${converted[email.id] ? 'converted' : ''}`}>
                <div className="gmail-email-meta">
                  <div className="gmail-sender">
                    <div className="gmail-avatar">
                      {email.sender_name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <strong>{email.sender_name}</strong>
                      <span className="gmail-email-addr">{email.sender_email}</span>
                    </div>
                  </div>
                  <span className="gmail-date">{new Date(email.date).toLocaleDateString()}</span>
                </div>

                <p className="gmail-subject">{email.subject}</p>
                <p className="gmail-snippet">{email.snippet}</p>

                <div className="gmail-email-footer">
                  {converted[email.id] ? (
                    <span className="gmail-task-badge">✅ Task created: {converted[email.id]}</span>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => convertToTask(email)}
                      disabled={converting[email.id]}
                    >
                      {converting[email.id] ? 'Creating...' : '➕ Convert to Task'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {status.connected && emails.length === 0 && !emailsLoading && !emailsError && (
        <div className="empty-state">
          <p>Click "Fetch Emails" to load your recent unread emails.</p>
        </div>
      )}
    </div>
  )
}
