import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL, authHeader } from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    tasks: 0, clients: 0, pending: 0, completed: 0, urgent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Summary state
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const [tasksRes, clientsRes] = await Promise.all([
        fetch(`${API_URL}/api/tasks`, { headers: authHeader() }),
        fetch(`${API_URL}/api/clients`, { headers: authHeader() }),
      ]);
      const tasksData = await tasksRes.json();
      const clientsData = await clientsRes.json();

      if (tasksData.success && clientsData.success) {
        const tasks = tasksData.data;
        setStats({
          tasks: tasks.length,
          clients: clientsData.data.length,
          pending: tasks.filter((t) => t.status === "pending").length,
          completed: tasks.filter((t) => t.status === "completed").length,
          urgent: tasks.filter((t) => t.priority === "urgent").length,
        });
      } else {
        setError('Failed to load dashboard data.');
      }
    } catch {
      setError('Cannot reach server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAISummary = async () => {
    setSummaryLoading(true);
    setSummaryError('');
    setSummary(null);
    try {
      const res = await fetch(`${API_URL}/api/ai/task-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
      } else {
        setSummaryError('Failed to generate summary.');
      }
    } catch {
      setSummaryError('Cannot reach AI service.');
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button className="btn btn-secondary" onClick={fetchStats} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading dashboard...</p></div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Tasks</h3>
            <p className="stat-number">{stats.tasks}</p>
          </div>
          <div className="stat-card urgent-card">
            <h3>Urgent Tasks</h3>
            <p className="stat-number">{stats.urgent}</p>
          </div>
          <div className="stat-card">
            <h3>Pending Tasks</h3>
            <p className="stat-number">{stats.pending}</p>
          </div>
          <div className="stat-card completed-card">
            <h3>Completed</h3>
            <p className="stat-number">{stats.completed}</p>
          </div>
          <div className="stat-card">
            <h3>Total Clients</h3>
            <p className="stat-number">{stats.clients}</p>
          </div>
        </div>
      )}

      {/* ── AI Daily Summary Card ── */}
      <div className="ai-summary-section">
        <div className="ai-summary-header">
          <h2>🤖 AI Daily Summary</h2>
          <button
            className="btn btn-primary"
            onClick={fetchAISummary}
            disabled={summaryLoading}
          >
            {summaryLoading ? 'Analyzing...' : summary ? 'Regenerate' : 'Generate Summary'}
          </button>
        </div>

        {summaryError && <div className="error-banner">{summaryError}</div>}

        {summaryLoading && (
          <div className="loading-state" style={{ padding: '2rem' }}>
            <div className="spinner"></div>
            <p>AI is analyzing your tasks...</p>
          </div>
        )}

        {summary && !summaryLoading && (
          <div className="ai-summary-card">
            {/* Overview */}
            <p className="ai-summary-text">{summary.daily_summary}</p>

            {/* Stats Row */}
            <div className="ai-summary-stats">
              <span className="ai-stat urgent">🔴 {summary.stats?.urgent || 0} Urgent</span>
              <span className="ai-stat overdue">⚠️ {summary.stats?.overdue || 0} Overdue</span>
              <span className="ai-stat pending">🕐 {summary.stats?.pending || 0} Pending</span>
              <span className="ai-stat progress">🔄 {summary.stats?.in_progress || 0} In Progress</span>
              <span className="ai-stat done">✅ {summary.stats?.completed || 0} Done</span>
            </div>

            {/* Urgent Tasks */}
            {summary.urgent_tasks?.length > 0 && (
              <div className="ai-summary-block">
                <h4>🔴 Urgent Tasks</h4>
                <ul>
                  {summary.urgent_tasks.map((t, i) => (
                    <li key={i}>
                      <strong>{t.title}</strong>
                      {t.assigned_to && <span> — {t.assigned_to}</span>}
                      {t.due_date && <span className="due-chip"> Due: {t.due_date}</span>}
                      {t.reason && <p className="task-reason">{t.reason}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Overdue Tasks */}
            {summary.overdue_tasks?.length > 0 && (
              <div className="ai-summary-block">
                <h4>⚠️ Overdue Tasks</h4>
                <ul>
                  {summary.overdue_tasks.map((t, i) => (
                    <li key={i}>
                      <strong>{t.title}</strong>
                      {t.assigned_to && <span> — {t.assigned_to}</span>}
                      {t.days_overdue > 0 && (
                        <span className="overdue-chip"> {t.days_overdue} day{t.days_overdue !== 1 ? 's' : ''} overdue</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Priority Order */}
            {summary.priority_order?.length > 0 && (
              <div className="ai-summary-block">
                <h4>📋 Suggested Priority Order</h4>
                <ol>
                  {summary.priority_order.map((title, i) => (
                    <li key={i}>{title}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* Recommendation */}
            {summary.recommendation && (
              <div className="ai-recommendation">
                <span>💡</span>
                <p>{summary.recommendation}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="recent-activity">
        <h2>Quick Links</h2>
        <div className="quick-links">
          <Link to="/tasks" className="quick-link">View All Tasks</Link>
          <Link to="/clients" className="quick-link">View All Clients</Link>
          <Link to="/reminders" className="quick-link">View Reminders</Link>
          <Link to="/activity" className="quick-link">Activity Log</Link>
        </div>
      </div>
    </div>
  );
}
