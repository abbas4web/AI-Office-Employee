import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Layout() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const handleLogout = () => {
    setIsLoggedIn(false);
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
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
