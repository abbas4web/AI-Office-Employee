import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { API_URL, authHeader } from '../api'
import { Mail, WifiOff, Wifi, RefreshCw, Inbox, Bot, CheckCircle2, Trash2, AlertTriangle, AlertCircle, Clock, Tag, Sparkles, Building2 } from 'lucide-react'

const CATEGORY_LABELS = {
  client_request: 'Client Request',
  bug_report:     'Bug Report',
  meeting:        'Meeting',
  invoice:        'Invoice',
  follow_up:      'Follow-up',
  review:         'Review',
  general:        'General',
}

const PRIORITY_COLORS = {
  urgent: '#e74c3c', high: '#e67e22', medium: '#3498db', low: '#27ae60',
}

export default function Gmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState({ connected: false, gmail_email: null })
  const [statusLoading, setStatusLoading] = useState(true)
  const [emails, setEmails] = useState([])
  const [emailsLoading, setEmailsLoading] = useState(false)
  const [emailsError, setEmailsError] = useState('')

  // Per-email AI analysis state
  const [analyzing, setAnalyzing] = useState({})    // { id: true }
  const [analysis, setAnalysis] = useState({})       // { id: analysisObj }

  // Per-email task creation state
  const [converting, setConverting] = useState({})  // { id: true }
  const [converted, setConverted] = useState({})    // { id: task }

  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

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
    if (searchParams.get('connected') === 'true') showToast('✅ Gmail connected successfully!')
    if (searchParams.get('error')) showToast('❌ Gmail connection failed. Please try again.')
  }, [checkStatus, searchParams])

  const connectGmail = async () => {
    try {
      const res = await fetch(`${API_URL}/api/gmail/auth-url`, { headers: authHeader() })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { showToast('❌ Could not initiate Gmail connection.') }
  }

  const disconnectGmail = async () => {
    if (!window.confirm('Disconnect your Gmail account?')) return
    try {
      await fetch(`${API_URL}/api/gmail/disconnect`, { method: 'DELETE', headers: authHeader() })
      setStatus({ connected: false }); setEmails([])
      showToast('Gmail disconnected.')
    } catch { showToast('❌ Failed to disconnect Gmail.') }
  }

  const fetchEmails = async () => {
    setEmailsLoading(true); setEmailsError('')
    try {
      const res = await fetch(`${API_URL}/api/gmail/emails?limit=20`, { headers: authHeader() })
      const data = await res.json()
      
      if (res.status === 401 && data.error === 'invalid_grant') {
        setStatus({ connected: false });
        setEmails([]);
        showToast('⚠️ Gmail connection expired. Please reconnect.');
        return;
      }

      if (data.success) setEmails(data.emails)
      else setEmailsError(data.message || 'Failed to load emails.')
    } catch { setEmailsError('Cannot reach server.') }
    finally { setEmailsLoading(false) }
  }

  // Step 1: AI analysis
  const analyzeEmail = async (email) => {
    setAnalyzing(prev => ({ ...prev, [email.id]: true }))
    try {
      const res = await fetch(`${API_URL}/api/gmail/emails/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.success) setAnalysis(prev => ({ ...prev, [email.id]: data.analysis }))
      else showToast('❌ AI analysis failed.')
    } catch { showToast('❌ Server error.') }
    finally { setAnalyzing(prev => ({ ...prev, [email.id]: false })) }
  }

  // Step 2: Confirm task creation with AI data
  const convertToTask = async (email) => {
    setConverting(prev => ({ ...prev, [email.id]: true }))
    try {
      const res = await fetch(`${API_URL}/api/gmail/emails/to-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ email, analysis: analysis[email.id] }),
      })
      const data = await res.json()
      if (data.success) {
        setConverted(prev => ({ ...prev, [email.id]: data.task }))
        showToast(`✅ Task created: "${data.task.title}"`)
      } else showToast('❌ Failed to create task.')
    } catch { showToast('❌ Server error.') }
    finally { setConverting(prev => ({ ...prev, [email.id]: false })) }
  }

  return (
    <div className="gmail-page">
      {toast && <div className="gmail-toast">{toast}</div>}

      <div className="page-header">
        <h1 style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><Mail size={22}/>Gmail Integration</h1>
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
                <Inbox size={15}/>{emailsLoading ? 'Loading...' : 'Fetch Emails'}
              </button>
              <button className="btn btn-danger" onClick={disconnectGmail}><Trash2 size={15}/>Disconnect</button>
            </div>
          </div>
        ) : (
          <div className="gmail-disconnected">
            <div className="gmail-connect-icon"><Mail size={40} strokeWidth={1.2}/></div>
            <h3>Connect Your Gmail</h3>
            <p>Read emails and convert them into tasks with AI-powered analysis.</p>
            <button className="btn btn-primary btn-lg" onClick={connectGmail}><Wifi size={16}/>Connect Gmail</button>
          </div>
        )}
      </div>

      {/* Setup Instructions */}
      {!status.connected && !statusLoading && (
        <div className="gmail-setup-card">
          <h3>⚙️ Setup Required</h3>
          <ol className="gmail-setup-steps">
            <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">console.cloud.google.com</a></li>
            <li>Create a project → Enable <strong>Gmail API</strong></li>
            <li>Create <strong>OAuth 2.0 credentials</strong> (Web application)</li>
            <li>Add redirect URI: <code>https://ai-office-employee-api.vercel.app/api/gmail/callback</code></li>
            <li>Set app to <strong>External</strong> + add your Gmail as a test user</li>
            <li>Add Client ID &amp; Secret to Vercel env vars → redeploy</li>
          </ol>
        </div>
      )}

      {emailsError && <div className="error-banner">{emailsError}</div>}

      {/* Email List */}
      {emails.length > 0 && (
        <div className="gmail-emails-section">
          <div className="page-header" style={{ marginBottom: '1rem' }}>
            <h2 style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><Inbox size={18}/>Recent Emails ({emails.length})</h2>
            <button className="btn btn-secondary" onClick={fetchEmails} disabled={emailsLoading}>Refresh</button>
          </div>

          <div className="gmail-email-list">
            {emails.map((email) => {
              const a = analysis[email.id]
              const isConverted = !!converted[email.id]
              return (
                <div key={email.id} className={`gmail-email-card ${isConverted ? 'converted' : ''}`}>
                  {/* Email header */}
                  <div className="gmail-email-meta">
                    <div className="gmail-sender">
                      <div className="gmail-avatar">{email.sender_name?.[0]?.toUpperCase() || '?'}</div>
                      <div>
                        <strong>{email.sender_name}</strong>
                        <span className="gmail-email-addr">{email.sender_email}</span>
                      </div>
                    </div>
                    <span className="gmail-date">{(() => {
                      const d = new Date(email.date);
                      if (isNaN(d.getTime())) return "-";
                      return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                    })()}</span>
                  </div>

                  <p className="gmail-subject">{email.subject}</p>
                  <p className="gmail-snippet">{email.snippet}</p>

                  {/* AI Analysis Panel */}
                  {a && !isConverted && (
                    <div className="gmail-analysis-panel">
                      <div className="gmail-analysis-header">
                        <span style={{display:'flex',alignItems:'center',gap:'0.4rem'}}><Bot size={15}/>AI Analysis</span>
                        <span
                          className="gmail-priority-badge"
                          style={{ background: PRIORITY_COLORS[a.priority] + '22', color: PRIORITY_COLORS[a.priority] }}
                        >
                          {a.priority?.toUpperCase()}
                        </span>
                        {a.is_urgent && <span className="gmail-urgent-badge"><AlertCircle size={14}/> URGENT</span>}
                      </div>
                      <p className="gmail-analysis-title">📋 <strong>Task:</strong> {a.task_title}</p>
                      <p className="gmail-analysis-summary">💡 {a.summary}</p>
                      <div className="gmail-analysis-meta">
                        <span style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                          <Tag size={13}/>{CATEGORY_LABELS[a.category] || 'General'}
                        </span>
                        {a.suggested_due_days && (
                          <span style={{display:'flex',alignItems:'center',gap:'0.4rem'}}>
                            <Clock size={13}/>Due in {a.suggested_due_days} day{a.suggested_due_days !== 1 ? 's' : ''}
                          </span>
                        )}
                        {a.matched_client && (
                          <span className="gmail-client-match">
                            <Building2 size={13}/>
                            Client matched: <strong>{a.matched_client.name}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="gmail-email-footer">
                    {isConverted ? (
                      <span className="gmail-task-badge">
                        ✅ Task: "{converted[email.id].title}"
                        <span className="gmail-task-priority" style={{ color: PRIORITY_COLORS[converted[email.id].priority] }}>
                          {' '}· {converted[email.id].priority}
                        </span>
                      </span>
                    ) : a ? (
                      <button className="btn btn-primary btn-sm" onClick={() => convertToTask(email)} disabled={converting[email.id]}>
                        <CheckCircle2 size={14}/>{converting[email.id] ? 'Creating...' : 'Confirm Task'}
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => analyzeEmail(email)} disabled={analyzing[email.id]}>
                        <Sparkles size={14}/>{analyzing[email.id] ? 'Analyzing...' : 'Analyze & Convert'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {status.connected && emails.length === 0 && !emailsLoading && !emailsError && (
        <div className="empty-state"><p>Click "Fetch Emails" to load your recent unread emails.</p></div>
      )}
    </div>
  )
}
