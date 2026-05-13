import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, Users, Bell, Activity,
  Mail, UserCog, LogOut, Menu, X, Bot, ChevronRight, Building2
} from "lucide-react";
import AiChat from "./AiChat";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = getRoleFromToken() || user.role || 'employee';
  const isPrivileged = role === 'admin' || role === 'manager';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard",  Icon: LayoutDashboard, show: true },
    { to: "/tasks",     label: "Tasks",       Icon: CheckSquare,     show: true },
    { to: "/clients",   label: "Clients",     Icon: Building2,       show: true },
    { to: "/reminders", label: "Reminders",   Icon: Bell,            show: true },
    { to: "/activity",  label: "Activity",    Icon: Activity,        show: true },
    { to: "/gmail",     label: "Gmail",       Icon: Mail,            show: isPrivileged },
    { to: "/team",      label: "Team",        Icon: UserCog,         show: true },
  ];

  const roleLabel = { admin: 'Administrator', manager: 'Manager', employee: 'Employee' }[role] || role;
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Bot size={22} />
          </div>
          {sidebarOpen && (
            <div className="sidebar-logo-text">
              <span className="sidebar-app-name">AI Office</span>
              <span className="sidebar-app-sub">Employee Portal</span>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navItems.filter(i => i.show).map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} className="sidebar-icon" />
              {sidebarOpen && <span className="sidebar-label">{label}</span>}
              {sidebarOpen && <ChevronRight size={14} className="sidebar-chevron" />}
            </NavLink>
          ))}
        </nav>

        {/* User profile at bottom */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            {sidebarOpen && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.name || 'User'}</span>
                <span className="sidebar-user-role">{roleLabel}</span>
              </div>
            )}
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────── */}
      <div className="main-wrapper">
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <AiChat />
    </div>
  );
}
