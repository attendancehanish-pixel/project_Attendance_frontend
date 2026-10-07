import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../shared/context/AuthContext";
import {
  Home,
  ClipboardCheck,
  CalendarDays,
  Users,
  BarChart3,
  LogOut,
  AlertCircle,
} from "lucide-react";

const primaryItems = [
  {
    to: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    to: "/mark",
    label: "Attendance",
    icon: ClipboardCheck,
    permission: "attendance.view",
  },
  {
    to: "/timetable",
    label: "Timetable",
    icon: CalendarDays,
    permission: "timetable.view",
  },
  {
    to: "/students",
    label: "Students",
    icon: Users,
  },
  {
    to: "/reports",
    label: "Reports",
    icon: BarChart3,
  },
];

/*
|--------------------------------------------------------------------------
| INITIALS (was duplicated inline in two places)
|--------------------------------------------------------------------------
*/

function getInitials(name) {
  if (!name) return "ST";

  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/*
|--------------------------------------------------------------------------
| LOGOUT CONFIRMATION DIALOG
|--------------------------------------------------------------------------
*/

function LogoutConfirmDialog({ busy, error, onCancel, onConfirm }) {
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    // Default focus goes to Cancel, not Confirm — logging out is easy to
    // reverse, but an accidental Enter-key confirm is still an annoyance
    // worth guarding against.
    cancelRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !busy) onCancel();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [busy, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="logout-confirm-title"
      aria-describedby="logout-confirm-desc"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
            <LogOut size={17} />
          </div>
          <div className="min-w-0">
            <h2 id="logout-confirm-title" className="text-sm font-semibold text-slate-100">
              Sign out?
            </h2>
            <p id="logout-confirm-desc" className="mt-1.5 text-xs leading-5 text-slate-500">
              You'll need to sign in again to access the staff portal.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/40 px-3 py-2.5 text-xs text-red-300">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-500/90 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogOut size={16} />
            {busy ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| MAIN LAYOUT
|--------------------------------------------------------------------------
*/

export default function StaffLayout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);

  const canSee = (item) =>
    !item.permission || hasPermission(item.permission);

  const visiblePrimary = primaryItems.filter(canSee);
  const initials = getInitials(user?.name);

  function requestLogout() {
    setLogoutError(null);
    setConfirmOpen(true);
  }

  async function handleLogout() {
    setLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (e) {
      console.error("Failed to sign out:", e);
      setLogoutError(
        e?.message || "Something went wrong while signing out. Please try again."
      );
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Skip link for keyboard/screen-reader users */}
      <a
        href="#staff-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-lg focus:bg-slate-100 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-950"
      >
        Skip to content
      </a>

      <main className="min-h-screen">
        {/* ============================================================
            TOP BAR
        ============================================================ */}

        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-950">
                CA
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight text-slate-100">
                  College Attendance
                </p>

                <p className="mt-0.5 text-[11px] text-slate-500">
                  Staff Portal
                </p>
              </div>
            </div>

            {/* User */}
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-200">
                  {user?.name || "Staff"}
                </p>

                <p className="text-[11px] text-slate-500">
                  Staff
                </p>
              </div>

              {/* Avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-300">
                {initials}
              </div>

              {/* Logout */}
              <button
                type="button"
                aria-label="Sign out"
                title="Sign out"
                onClick={requestLogout}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500 transition hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
              >
                <LogOut size={17} />
              </button>
            </div>
          </div>
        </header>

        {/* ============================================================
            CONTENT
            NOTE: lg:pl-56 reserves space for the fixed desktop sidebar
            below — without it the sidebar overlaps this column on large
            screens.
        ============================================================ */}

        <div
          id="staff-main-content"
          className="mx-auto max-w-7xl px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-8 lg:pl-56"
        >
          <Outlet />
        </div>

        {/* ============================================================
            MOBILE BOTTOM NAVIGATION
        ============================================================ */}

        <nav
          aria-label="Staff navigation"
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto flex max-w-xl items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
            {visiblePrimary.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-slate-500 ${
                      isActive
                        ? "text-slate-100"
                        : "text-slate-600 hover:text-slate-400"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute top-0 h-0.5 w-8 rounded-full bg-slate-100" />
                      )}

                      <Icon
                        size={19}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />

                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* ============================================================
            DESKTOP NAVIGATION
        ============================================================ */}

        <aside className="fixed bottom-0 left-0 top-16 hidden w-56 border-r border-slate-800/80 bg-slate-950 lg:block">
          <div className="flex h-full flex-col px-3 py-5">
            <div className="mb-4 px-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                Navigation
              </p>
            </div>

            <nav className="space-y-1">
              {visiblePrimary.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 ${
                        isActive
                          ? "bg-slate-800 text-slate-100"
                          : "text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={18}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />

                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Bottom identity */}
            <div className="mt-auto">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-slate-200">
                      {user?.name || "Staff"}
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-600">
                      Staff Portal
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={requestLogout}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-800 py-2 text-xs text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {confirmOpen && (
        <LogoutConfirmDialog
          busy={loggingOut}
          error={logoutError}
          onCancel={() => {
            if (loggingOut) return;
            setConfirmOpen(false);
            setLogoutError(null);
          }}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}