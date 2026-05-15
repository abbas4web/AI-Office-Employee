import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL, authHeader } from "../api";
import {
  RefreshCw, TrendingUp, AlertOctagon, AlertTriangle,
  Clock, CheckCircle2, Users, ListTodo, Briefcase,
  ShieldAlert, Target, Zap, Star, Mail, ChevronRight,
  RotateCcw, Sparkles, Activity
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ tasks: 0, clients: 0, pending: 0, completed: 0, urgent: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workflow, setWorkflow] = useState(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState('');
  const today = new Date();
  const todayStr = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

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
          tasks: tasks.length,
          clients: clientsData.data.length,
          pending: tasks.filter(t => t.status === "pending").length,
          completed: tasks.filter(t => t.status === "completed").length,
          urgent: tasks.filter(t => t.priority === "urgent").length,
          inProgress: tasks.filter(t => t.status === "in_progress").length,
        });
      } else { setError('Failed to load dashboard data.'); }
    } catch { setError('Cannot reach server.'); }
    finally { setLoading(false); }
  };

  const fetchWorkflow = async () => {
    setWorkflowLoading(true); setWorkflowError(''); setWorkflow(null);
    try {
      const res = await fetch(`${API_URL}/api/ai/workflow`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader() },
      });
      const data = await res.json();
      if (data.success) setWorkflow(data.data);
      else setWorkflowError('Failed to generate briefing.');
    } catch { setWorkflowError('Cannot reach AI service.'); }
    finally { setWorkflowLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const scoreColor = (s) => s >= 70 ? '#16a34a' : s >= 40 ? '#d97706' : '#dc2626';
  const scoreBg   = (s) => s >= 70 ? '#f0fdf4' : s >= 40 ? '#fffbeb' : '#fef2f2';
  const scoreBar  = (s) => s >= 70 ? '#22c55e' : s >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="db-root">

      {/* ── Top Header ─────────────────────────────── */}
      <div className="db-header">
        <div className="db-header-left">
          <p className="db-date">{todayStr}</p>
          <h1 className="db-title">Good Morning, Welcome Back 👋</h1>
          <p className="db-sub">Here's what's happening in your office today.</p>
        </div>
        <div className="db-header-right">
          <button className="db-btn-outline" onClick={fetchStats} disabled={loading}>
            <RefreshCw size={14} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button className="db-btn-primary" onClick={fetchWorkflow} disabled={workflowLoading}>
            <Sparkles size={14} />
            {workflowLoading ? 'Generating...' : workflow ? 'Regenerate Briefing' : 'AI Daily Briefing'}
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* ── KPI Cards ──────────────────────────────── */}
      <div className="db-kpi-grid">
        <div className="db-kpi-card">
          <div className="db-kpi-icon" style={{background:'#eff6ff',color:'#2563eb'}}><ListTodo size={20}/></div>
          <div className="db-kpi-body">
            <span className="db-kpi-label">Total Tasks</span>
            <span className="db-kpi-value">{loading ? '—' : stats.tasks}</span>
          </div>
          <Link to="/tasks" className="db-kpi-link"><ChevronRight size={16}/></Link>
        </div>
        <div className="db-kpi-card">
          <div className="db-kpi-icon" style={{background:'#fef2f2',color:'#dc2626'}}><AlertOctagon size={20}/></div>
          <div className="db-kpi-body">
            <span className="db-kpi-label">Urgent Tasks</span>
            <span className="db-kpi-value" style={{color:'#dc2626'}}>{loading ? '—' : stats.urgent}</span>
          </div>
          <Link to="/tasks" className="db-kpi-link"><ChevronRight size={16}/></Link>
        </div>
        <div className="db-kpi-card">
          <div className="db-kpi-icon" style={{background:'#fffbeb',color:'#d97706'}}><Clock size={20}/></div>
          <div className="db-kpi-body">
            <span className="db-kpi-label">Pending</span>
            <span className="db-kpi-value" style={{color:'#d97706'}}>{loading ? '—' : stats.pending}</span>
          </div>
          <Link to="/tasks" className="db-kpi-link"><ChevronRight size={16}/></Link>
        </div>
        <div className="db-kpi-card">
          <div className="db-kpi-icon" style={{background:'#f5f3ff',color:'#7c3aed'}}><Activity size={20}/></div>
          <div className="db-kpi-body">
            <span className="db-kpi-label">In Progress</span>
            <span className="db-kpi-value" style={{color:'#7c3aed'}}>{loading ? '—' : stats.inProgress}</span>
          </div>
          <Link to="/tasks" className="db-kpi-link"><ChevronRight size={16}/></Link>
        </div>
        <div className="db-kpi-card">
          <div className="db-kpi-icon" style={{background:'#f0fdf4',color:'#16a34a'}}><CheckCircle2 size={20}/></div>
          <div className="db-kpi-body">
            <span className="db-kpi-label">Completed</span>
            <span className="db-kpi-value" style={{color:'#16a34a'}}>{loading ? '—' : stats.completed}</span>
          </div>
          <Link to="/tasks" className="db-kpi-link"><ChevronRight size={16}/></Link>
        </div>
        <div className="db-kpi-card">
          <div className="db-kpi-icon" style={{background:'#f0f9ff',color:'#0284c7'}}><Users size={20}/></div>
          <div className="db-kpi-body">
            <span className="db-kpi-label">Total Clients</span>
            <span className="db-kpi-value">{loading ? '—' : stats.clients}</span>
          </div>
          <Link to="/clients" className="db-kpi-link"><ChevronRight size={16}/></Link>
        </div>
      </div>

      {/* ── AI Briefing Loading ─────────────────────── */}
      {workflowLoading && (
        <div className="db-briefing-loading">
          <div className="db-briefing-loading-inner">
            <div className="db-pulse-ring"></div>
            <Sparkles size={28} color="#6366f1" />
            <p>AI is analyzing your tasks, reminders &amp; emails...</p>
            <span>This may take a few seconds</span>
          </div>
        </div>
      )}

      {workflowError && <div className="error-banner">{workflowError}</div>}

      {/* ── AI Briefing Panel ───────────────────────── */}
      {workflow && !workflowLoading && (
        <div className="db-briefing">

          {/* Header */}
          <div className="db-briefing-header">
            <div className="db-briefing-title-row">
              <div className="db-briefing-icon"><Sparkles size={18}/></div>
              <div>
                <h2 className="db-briefing-title">AI Daily Briefing</h2>
                <span className="db-briefing-date">{workflow.date}</span>
              </div>
            </div>
            {workflow.productivity_score !== undefined && (
              <div className="db-score-pill" style={{background: scoreBg(workflow.productivity_score), color: scoreColor(workflow.productivity_score)}}>
                <TrendingUp size={13}/>
                Score: {workflow.productivity_score}/100
              </div>
            )}
          </div>

          {/* Summary text */}
          <p className="db-briefing-summary">{workflow.daily_summary}</p>

          {/* Productivity bar */}
          {workflow.productivity_score !== undefined && (
            <div className="db-score-bar-row">
              <span className="db-score-bar-label">Productivity</span>
              <div className="db-score-bar-track">
                <div className="db-score-bar-fill" style={{width:`${workflow.productivity_score}%`, background: scoreBar(workflow.productivity_score)}}></div>
              </div>
              <span className="db-score-bar-value">{workflow.productivity_score}%</span>
            </div>
          )}

          {/* Stats chips */}
          <div className="db-chip-row">
            <span className="db-chip red"><AlertOctagon size={12}/>{workflow.stats?.urgent_tasks||0} Urgent</span>
            <span className="db-chip amber"><AlertTriangle size={12}/>{workflow.stats?.overdue_tasks||0} Overdue</span>
            <span className="db-chip blue"><Clock size={12}/>{workflow.stats?.pending_tasks||0} Pending</span>
            <span className="db-chip purple"><RefreshCw size={12}/>{workflow.stats?.in_progress_tasks||0} In Progress</span>
            <span className="db-chip green"><CheckCircle2 size={12}/>{workflow.stats?.completed_tasks||0} Done</span>
            {workflow.stats?.unread_reminders > 0 && <span className="db-chip amber"><Clock size={12}/>{workflow.stats.unread_reminders} Reminders</span>}
            {workflow.stats?.total_emails_analyzed > 0 && <span className="db-chip blue"><Mail size={12}/>{workflow.stats.total_emails_analyzed} Emails</span>}
          </div>

          {/* 3-column grid */}
          <div className="db-briefing-grid">

            {/* Urgent Work */}
            {workflow.urgent_work?.length > 0 && (
              <div className="db-briefing-col">
                <div className="db-col-header red">
                  <AlertOctagon size={15}/>
                  <span>Urgent Work</span>
                </div>
                <div className="db-col-list">
                  {workflow.urgent_work.map((w, i) => (
                    <div key={i} className="db-col-item">
                      <div className="db-col-item-top">
                        <span className="db-type-badge">{w.type}</span>
                        <strong>{w.title}</strong>
                      </div>
                      {w.assigned_to && <span className="db-col-meta">{w.assigned_to}</span>}
                      {w.due_date && <span className="db-col-due">Due {w.due_date}</span>}
                      {w.reason && <p className="db-col-reason">{w.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks */}
            {workflow.risks?.length > 0 && (
              <div className="db-briefing-col">
                <div className="db-col-header amber">
                  <ShieldAlert size={15}/>
                  <span>Identified Risks</span>
                </div>
                <div className="db-col-list">
                  {workflow.risks.map((r, i) => (
                    <div key={i} className="db-col-item">
                      <div className="db-col-item-top">
                        <span className={`db-severity-badge ${r.severity}`}>{r.severity}</span>
                        <strong>{r.title}</strong>
                      </div>
                      <p className="db-col-reason">{r.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priority Suggestions */}
            {workflow.priority_suggestions?.length > 0 && (
              <div className="db-briefing-col">
                <div className="db-col-header purple">
                  <Target size={15}/>
                  <span>Priority Suggestions</span>
                </div>
                <div className="db-col-list">
                  {workflow.priority_suggestions.map((p, i) => (
                    <div key={i} className="db-col-item">
                      <div className="db-col-item-top">
                        <span className="db-rank-badge">#{p.rank}</span>
                        <strong>{p.task}</strong>
                        <span className={`db-effort-badge ${p.estimated_effort}`}>{p.estimated_effort}</span>
                      </div>
                      {p.reason && <p className="db-col-reason">{p.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Items + Executive Summary side by side */}
          <div className="db-briefing-bottom">
            {workflow.action_items?.length > 0 && (
              <div className="db-action-items">
                <div className="db-col-header green">
                  <Zap size={15}/>
                  <span>Today's Action Items</span>
                </div>
                <ul className="db-action-list">
                  {workflow.action_items.map((a, i) => (
                    <li key={i}><span className="db-action-dot"></span>{a}</li>
                  ))}
                </ul>
              </div>
            )}
            {workflow.professional_summary && (
              <div className="db-exec-summary">
                <div className="db-col-header indigo">
                  <Star size={15}/>
                  <span>Executive Summary</span>
                </div>
                <p>{workflow.professional_summary}</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── Quick Nav ──────────────────────────────── */}
      <div className="db-quicknav">
        <h2 className="db-section-title">Quick Navigation</h2>
        <div className="db-quicknav-grid">
          {[
            { to:'/tasks',     icon:<ListTodo size={22}/>,   label:'Tasks',      sub:'Manage all tasks',      color:'#2563eb', bg:'#eff6ff' },
            { to:'/clients',   icon:<Users size={22}/>,      label:'Clients',    sub:'View contacts',         color:'#0284c7', bg:'#f0f9ff' },
            { to:'/reminders', icon:<Clock size={22}/>,      label:'Reminders',  sub:'Upcoming reminders',    color:'#d97706', bg:'#fffbeb' },
            { to:'/activity',  icon:<Activity size={22}/>,   label:'Activity',   sub:'Recent system events',  color:'#7c3aed', bg:'#f5f3ff' },
            { to:'/team',      icon:<Briefcase size={22}/>,  label:'Team',       sub:'Manage team members',   color:'#16a34a', bg:'#f0fdf4' },
            { to:'/gmail',     icon:<Mail size={22}/>,       label:'Gmail',      sub:'Read & sync emails',    color:'#dc2626', bg:'#fef2f2' },
          ].map(({ to, icon, label, sub, color, bg }) => (
            <Link key={to} to={to} className="db-nav-card">
              <div className="db-nav-icon" style={{background: bg, color}}>{icon}</div>
              <div className="db-nav-body">
                <span className="db-nav-label">{label}</span>
                <span className="db-nav-sub">{sub}</span>
              </div>
              <ChevronRight size={16} className="db-nav-arrow"/>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
