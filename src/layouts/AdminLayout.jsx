import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../shared/context/AuthContext";

const sections = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: "⌂" }],
  },
   {
    label: "Attendance Dashboard",
    items: [
      { to: "/admin/attendance", label: "Attendance Dashboard", icon: "▣" },
      { to: "/attendance/generate", label: "Generate Sessions", icon: "⚡" },
       { to: "/attendance/sessions", label: "Sessions", icon: "▤" },
      // { to: "/configuration", label: "Configuration", icon: "⚙" },
      // { to: "/calendar", label: "Calendar", icon: "◷" },
      // { to: "/standards", label: "Standards", icon: "▤" },
      // { to: "/subjects", label: "Subjects", icon: "◈" },
    ],
  },
  {
    label: "Academic",
    items: [
      { to: "/academic-years", label: "Academic Years", icon: "▣" },
      { to: "/configuration", label: "Configuration", icon: "⚙" },
      { to: "/calendar", label: "Calendar", icon: "◷" },
      { to: "/standards", label: "Standards", icon: "▤" },
      { to: "/subjects", label: "Subjects", icon: "◈" },
    ],
  },
  {
    label: "Students",
    items: [
      { to: "/students", label: "Students", icon: "♙" },
      { to: "/student-enrollments", label: "Enrolment Report", icon: "▥" },
      { to: "/student-enrollments/bulk-create", label: "Bulk Enrolment", icon: "＋" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/absence-types", label: "Absence Types", icon: "!" },
      { to: "/timetable", label: "Timetable", icon: "▦", permission: "timetable.view" },
      { to: "/attendance", label: "Attendance", icon: "✓", permission: "attendance.view" },
      { to: "/attendance/corrections", label: "Corrections", icon: "↺", permission: "attendance.correct" },
      { to: "/staff", label: "Staff", icon: "♟" },
      { to: "/assignments", label: "Assignments", icon: "⇄" },
    ],
  },
  {
    label: "Reports",
    items: [
      { to: "/reports", label: "Reports", icon: "▥" },
      { to: "/notifications", label: "Notifications", icon: "◉" },
    ],
  },
];

function Navigation({ canSee }) {
  return (
    <nav className="layout-nav">
      {sections.map((section) => {
        const visibleItems = section.items.filter(canSee);
        if (!visibleItems.length) return null;

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
  const { user, logout, hasPermission, isAdmin } = useAuth();
  const navigate = useNavigate();

  const canSee = (item) => isAdmin || !item.permission || hasPermission(item.permission);

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

        <Navigation canSee={canSee} />

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
              <span>{user?.roles?.join(", ")}</span>
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
