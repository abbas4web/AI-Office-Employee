import { useEffect, useState } from "react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    tasks: 0,
    clients: 0,
    pending: 0,
    completed: 0,
  });

  useEffect(() => {
    // Fetch stats from API
    const fetchStats = async () => {
      try {
        const tasksRes = await fetch(
          "https://ai-office-employee-api.vercel.app/api/tasks"
        );
        const tasksData = await tasksRes.json();

        const clientsRes = await fetch(
          "https://ai-office-employee-api.vercel.app/api/clients"
        );
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
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <button className="btn btn-secondary" onClick={fetchStats}>
          Refresh
        </button>
      </div>
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
      </div>
      <div className="recent-activity">
        <h2>Quick Links</h2>
        <div className="quick-links">
          <a href="/tasks" className="quick-link">
            View All Tasks
          </a>
          <a href="/clients" className="quick-link">
            View All Clients
          </a>
        </div>
      </div>
    </div>
  );
}
