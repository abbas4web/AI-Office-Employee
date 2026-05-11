import { Outlet, Link, useNavigate } from "react-router-dom";
import AiChat from "./AiChat";

export default function Layout() {
  const navigate = useNavigate();

  // Get logged-in user name from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate("/login");
  };

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>AI Office Employee</h1>
        </div>
        <div className="nav-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/tasks">Tasks</Link>
          <Link to="/clients">Clients</Link>
          <Link to="/reminders">Reminders</Link>
          <Link to="/activity">Activity</Link>
          {user.name && <span className="nav-user">👤 {user.name}</span>}
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
      <AiChat />
    </div>
  );
}
