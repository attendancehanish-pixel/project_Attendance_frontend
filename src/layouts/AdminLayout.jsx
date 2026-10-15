import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../shared/context/AuthContext";
import { visibleNav } from "../shared/access/navigation";

function Navigation({ hasAny }) {
  const sections = visibleNav(hasAny);
  return (
    <nav className="layout-nav">
      {sections.map((section) => {
        const visibleItems = section.items;

        return (
          <div className="nav-section" key={section.label}>
            <div className="nav-label">{section.label}</div>
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, logout, hasAny } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CA</div>
          <div>
            <strong>College Attendance</strong>
            <span>Administration Portal</span>
          </div>
        </div>

        <Navigation hasAny={hasAny} />

        <div className="sidebar-footer">
          {/* Always visible (the nav above scrolls on short screens) */}
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span className="nav-icon">⚙</span>
            <span>Settings</span>
          </NavLink>
          <div className="user-mini">
            <div className="avatar">{user?.name?.slice(0, 1)?.toUpperCase()}</div>
            <div>
              <strong>{user?.name}</strong>
              <span>{user?.roles?.length ? user.roles.join(", ") : "Custom access"}</span>
            </div>
          </div>
          <button className="ghost-button full" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">College Management System</span>
            <h1>Attendance administration</h1>
          </div>
          <div className="topbar-user">{user?.email}</div>
        </header>
        <div className="content"><Outlet /></div>
      </main>
    </div>
  );
}
