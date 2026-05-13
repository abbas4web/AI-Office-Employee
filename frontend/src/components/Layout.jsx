import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CheckSquare, Users, Bell, Activity,
  Mail, UserCog, LogOut, PanelLeftClose, PanelLeftOpen, Bot, Building2, ChevronRight
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
  const [collapsed, setCollapsed] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = getRoleFromToken() || user.role || 'employee';
  const isPrivileged = role === 'admin' || role === 'manager';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", label: "Dashboard",  Icon: LayoutDashboard },
    { to: "/tasks",     label: "Tasks",       Icon: CheckSquare     },
    { to: "/clients",   label: "Clients",     Icon: Building2       },
    { to: "/reminders", label: "Reminders",   Icon: Bell            },
    { to: "/activity",  label: "Activity",    Icon: Activity        },
    ...(isPrivileged ? [{ to: "/gmail", label: "Gmail", Icon: Mail }] : []),
    { to: "/team",      label: "Team",        Icon: UserCog         },
  ];

  const roleLabel = { admin: 'Administrator', manager: 'Manager', employee: 'Employee' }[role] || role;
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>

        {/* Logo row */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Bot size={20} /></div>
          {!collapsed && (
            <div className="sidebar-logo-text">
              <span className="sidebar-app-name">AI Office</span>
              <span className="sidebar-app-sub">Employee Portal</span>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="sidebar-nav">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
            >
              <Icon size={19} className="sidebar-icon" />
              {!collapsed && <span className="sidebar-label">{label}</span>}
              {!collapsed && <ChevronRight size={13} className="sidebar-chevron" />}
            </NavLink>
          ))}
        </nav>

        {/* Footer: avatar + logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user" title={collapsed ? user.name : undefined}>
            <div className="sidebar-avatar">{initials}</div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.name || 'User'}</span>
                <span className="sidebar-user-role">{roleLabel}</span>
              </div>
            )}
          </div>
          {!collapsed && (
            <button className="sidebar-logout" onClick={handleLogout} title="Logout">
              <LogOut size={17} />
            </button>
          )}
          {collapsed && (
            <button className="sidebar-logout" onClick={handleLogout} title="Logout" style={{margin:'0 auto'}}>
              <LogOut size={17} />
            </button>
          )}
        </div>
      </aside>

      {/* ── Floating toggle button — always visible ── */}
      <button
        className="sidebar-float-toggle"
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{ left: collapsed ? '58px' : '246px' }}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>

      {/* ── Main ── */}
      <div className={`main-wrapper${collapsed ? ' main-wrapper--collapsed' : ''}`}>
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <AiChat />
    </div>
  );
}
