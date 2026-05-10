import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_URL, authHeader } from "../api";

export default function Dashboard() {
  const [stats, setStats] = useState({
    tasks: 0,
    clients: 0,
    pending: 0,
    completed: 0,
    urgent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    } catch (err) {
      setError('Cannot reach server. Please check your connection.');
    } finally {
      setLoading(false);
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
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
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
            <h3>Completed Tasks</h3>
            <p className="stat-number">{stats.completed}</p>
          </div>
          <div className="stat-card">
            <h3>Total Clients</h3>
            <p className="stat-number">{stats.clients}</p>
          </div>
        </div>
      )}

      <div className="recent-activity">
        <h2>Quick Links</h2>
        <div className="quick-links">
          {/* Fix 8: Use React Router <Link> instead of <a> to avoid full page reload */}
          <Link to="/tasks" className="quick-link">View All Tasks</Link>
          <Link to="/clients" className="quick-link">View All Clients</Link>
          <Link to="/reminders" className="quick-link">View Reminders</Link>
        </div>
      </div>
    </div>
  );
}
