import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL, authHeader } from "../api";
import {
  RefreshCw, Bot, TrendingUp, AlertOctagon, AlertTriangle,
  Clock, CheckCircle2, ArrowRight, Lightbulb, Target,
  Zap, List, RotateCcw
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ tasks: 0, clients: 0, pending: 0, completed: 0, urgent: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [productivity, setProductivity] = useState(null);
  const [productivityLoading, setProductivityLoading] = useState(false);
  const [productivityError, setProductivityError] = useState('');

  const fetchStats = async () => {
    setLoading(true); setError('');
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
          tasks: tasks.length, clients: clientsData.data.length,
          pending: tasks.filter(t => t.status === "pending").length,
          completed: tasks.filter(t => t.status === "completed").length,
          urgent: tasks.filter(t => t.priority === "urgent").length,
        });
      } else { setError('Failed to load dashboard data.'); }
    } catch { setError('Cannot reach server.'); }
    finally { setLoading(false); }
  };

  const fetchAISummary = async () => {
    setSummaryLoading(true); setSummaryError(''); setSummary(null);
    try {
      const res = await fetch(`${API_URL}/api/ai/task-summary`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      const data = await res.json();
      if (data.success) setSummary(data.data);
      else setSummaryError('Failed to generate summary.');
    } catch { setSummaryError('Cannot reach AI service.'); }
    finally { setSummaryLoading(false); }
  };

  const fetchProductivity = async () => {
    setProductivityLoading(true); setProductivityError(''); setProductivity(null);
    try {
      const res = await fetch(`${API_URL}/api/ai/productivity`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      const data = await res.json();
      if (data.success) setProductivity(data.data);
      else setProductivityError('Failed to generate suggestions.');
    } catch { setProductivityError('Cannot reach AI service.'); }
    finally { setProductivityLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <button className="btn btn-secondary" onClick={fetchStats} disabled={loading}>
          <RefreshCw size={15} style={{ marginRight: '0.4rem' }} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state"><div className="spinner"></div><p>Loading dashboard...</p></div>
      ) : (
        <div className="stats-grid">
          <div className="stat-card"><h3>Total Tasks</h3><p className="stat-number">{stats.tasks}</p></div>
          <div className="stat-card urgent-card"><h3>Urgent Tasks</h3><p className="stat-number">{stats.urgent}</p></div>
          <div className="stat-card"><h3>Pending Tasks</h3><p className="stat-number">{stats.pending}</p></div>
          <div className="stat-card completed-card"><h3>Completed</h3><p className="stat-number">{stats.completed}</p></div>
          <div className="stat-card"><h3>Total Clients</h3><p className="stat-number">{stats.clients}</p></div>
        </div>
      )}

      {/* AI Daily Summary */}
      <div className="ai-summary-section">
        <div className="ai-summary-header">
          <h2 style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><Bot size={20} />AI Daily Summary</h2>
          <button className="btn btn-primary" onClick={fetchAISummary} disabled={summaryLoading}>
            {summaryLoading ? <><RotateCcw size={14} style={{marginRight:'0.3rem'}} />Analyzing...</> : summary ? 'Regenerate' : 'Generate Summary'}
          </button>
        </div>
        {summaryError && <div className="error-banner">{summaryError}</div>}
        {summaryLoading && <div className="loading-state" style={{padding:'2rem'}}><div className="spinner"></div><p>AI is analyzing your tasks...</p></div>}
        {summary && !summaryLoading && (
          <div className="ai-summary-card">
            <p className="ai-summary-text">{summary.daily_summary}</p>
            <div className="ai-summary-stats">
              <span className="ai-stat urgent"><AlertOctagon size={13} /> {summary.stats?.urgent||0} Urgent</span>
              <span className="ai-stat overdue"><AlertTriangle size={13} /> {summary.stats?.overdue||0} Overdue</span>
              <span className="ai-stat pending"><Clock size={13} /> {summary.stats?.pending||0} Pending</span>
              <span className="ai-stat progress"><RefreshCw size={13} /> {summary.stats?.in_progress||0} In Progress</span>
              <span className="ai-stat done"><CheckCircle2 size={13} /> {summary.stats?.completed||0} Done</span>
            </div>
            {summary.urgent_tasks?.length > 0 && (
              <div className="ai-summary-block">
                <h4 style={{display:'flex',alignItems:'center',gap:'0.4rem'}}><AlertOctagon size={15}/>Urgent Tasks</h4>
                <ul>{summary.urgent_tasks.map((t,i)=><li key={i}><strong>{t.title}</strong>{t.assigned_to&&<span> — {t.assigned_to}</span>}{t.due_date&&<span className="due-chip">Due: {t.due_date}</span>}{t.reason&&<p className="task-reason">{t.reason}</p>}</li>)}</ul>
              </div>
            )}
            {summary.overdue_tasks?.length > 0 && (
              <div className="ai-summary-block">
                <h4 style={{display:'flex',alignItems:'center',gap:'0.4rem'}}><AlertTriangle size={15}/>Overdue Tasks</h4>
                <ul>{summary.overdue_tasks.map((t,i)=><li key={i}><strong>{t.title}</strong>{t.assigned_to&&<span> — {t.assigned_to}</span>}{t.days_overdue>0&&<span className="overdue-chip">{t.days_overdue} day{t.days_overdue!==1?'s':''} overdue</span>}</li>)}</ul>
              </div>
            )}
            {summary.priority_order?.length > 0 && (
              <div className="ai-summary-block">
                <h4 style={{display:'flex',alignItems:'center',gap:'0.4rem'}}><List size={15}/>Suggested Priority Order</h4>
                <ol>{summary.priority_order.map((title,i)=><li key={i}>{title}</li>)}</ol>
              </div>
            )}
            {summary.recommendation && (
              <div className="ai-recommendation"><Lightbulb size={16}/><p>{summary.recommendation}</p></div>
            )}
          </div>
        )}
      </div>

      {/* AI Productivity Suggestions */}
      <div className="ai-summary-section">
        <div className="ai-summary-header">
          <h2 style={{display:'flex',alignItems:'center',gap:'0.5rem'}}><TrendingUp size={20}/>Productivity Suggestions</h2>
          <button className="btn btn-primary" onClick={fetchProductivity} disabled={productivityLoading}>
            {productivityLoading ? <><RotateCcw size={14} style={{marginRight:'0.3rem'}}/>Analyzing...</> : productivity ? 'Refresh' : 'Analyze Workload'}
          </button>
        </div>
        {productivityError && <div className="error-banner">{productivityError}</div>}
        {productivityLoading && <div className="loading-state" style={{padding:'2rem'}}><div className="spinner"></div><p>AI is analyzing your workload...</p></div>}
        {productivity && !productivityLoading && (
          <div className="ai-summary-card">
            {productivity.productivity_score!==undefined && (
              <div className="productivity-score-row">
                <span className="score-label">Productivity Score</span>
                <div className="score-bar-wrap"><div className="score-bar" style={{width:`${productivity.productivity_score}%`,background:productivity.productivity_score>=70?'#4caf50':productivity.productivity_score>=40?'#ff9800':'#e74c3c'}}/></div>
                <span className="score-value">{productivity.productivity_score}/100</span>
              </div>
            )}
            <p className="ai-summary-text">{productivity.summary}</p>
            {productivity.top_priority && (
              <div className="ai-summary-block">
                <h4 style={{display:'flex',alignItems:'center',gap:'0.4rem'}}><Target size={15}/>Top Priority Right Now</h4>
                <div className="priority-box"><strong>{productivity.top_priority.task}</strong><p>{productivity.top_priority.reason}</p></div>
              </div>
            )}
            {productivity.risks?.length > 0 && (
              <div className="ai-summary-block">
                <h4 style={{display:'flex',alignItems:'center',gap:'0.4rem'}}><AlertTriangle size={15}/>Identified Risks</h4>
                <ul>{productivity.risks.map((r,i)=><li key={i}><span className={`risk-badge ${r.severity}`}>{r.severity}</span> <strong>{r.title}</strong> — {r.description}</li>)}</ul>
              </div>
            )}
            {productivity.workload_issues?.length > 0 && (
              <div className="ai-summary-block">
                <h4 style={{display:'flex',alignItems:'center',gap:'0.4rem'}}><RefreshCw size={15}/>Workload Issues</h4>
                <ul>{productivity.workload_issues.map((w,i)=><li key={i}><strong>{w.issue}</strong> — {w.detail}</li>)}</ul>
              </div>
            )}
            {productivity.quick_wins?.length > 0 && (
              <div className="ai-summary-block">
                <h4 style={{display:'flex',alignItems:'center',gap:'0.4rem'}}><Zap size={15}/>Quick Wins</h4>
                <ul>{productivity.quick_wins.map((qw,i)=><li key={i}>{qw}</li>)}</ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="recent-activity">
        <h2>Quick Links</h2>
        <div className="quick-links">
          <Link to="/tasks" className="quick-link"><ArrowRight size={14}/>View All Tasks</Link>
          <Link to="/clients" className="quick-link"><ArrowRight size={14}/>View All Clients</Link>
          <Link to="/reminders" className="quick-link"><ArrowRight size={14}/>View Reminders</Link>
          <Link to="/activity" className="quick-link"><ArrowRight size={14}/>Activity Log</Link>
        </div>
      </div>
    </div>
  );
}
