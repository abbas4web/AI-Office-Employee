import { Outlet, Link, useNavigate } from "react-router-dom";
import AiChat from "./AiChat";

// Decode JWT payload without a library (base64 decode middle part)
function getRoleFromToken() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || null;
  } catch { return null; }
}

export default function Layout() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Always read role from JWT token — more reliable than localStorage user object
  const role         = getRoleFromToken() || user.role || 'employee';
  const isPrivileged = role === 'admin' || role === 'manager';
  const isAdmin      = role === 'admin';

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

          {/* Gmail — admin & manager only */}
          {isPrivileged && <Link to="/gmail">📧 Gmail</Link>}

          {/* Team — admin & manager only */}
          {isPrivileged && <Link to="/team">👥 Team</Link>}

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
