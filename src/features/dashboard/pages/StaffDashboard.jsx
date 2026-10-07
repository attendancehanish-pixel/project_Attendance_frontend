
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  Info,
  MoreHorizontal,
  RefreshCw,
  UserCheck,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { get } from "../../../shared/api/client";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const statusConfig = {
  MARKED: {
    label: "Marked",
    icon: CheckCircle2,
    className:
      "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },

  UNMARKED: {
    label: "Unmarked",
    icon: AlertCircle,
    className:
      "text-amber-400 bg-amber-400/10 border-amber-400/20",
  },

  CURRENT: {
    label: "Current",
    icon: Clock3,
    className:
      "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },

  UPCOMING: {
    label: "Upcoming",
    icon: Clock3,
    className:
      "text-slate-400 bg-slate-400/10 border-slate-400/20",
  },
};

function StatusBadge({ status }) {
  const config = statusConfig[status];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <Icon size={13} />
      {config.label}
    </span>
  );
}

function formatTime(time) {
  if (!time) return "—";

  // Backend stores HH:mm.
  const [hours, minutes] = String(time).split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return time;
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(date) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(date) {
  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getSessionStatus(session, currentSessionIds = []) {
  const sessionId = session?.id;

  if (
    sessionId &&
    currentSessionIds.includes(sessionId)
  ) {
    return "CURRENT";
  }

  const status =
    session?.sessionStatus ||
    session?.status ||
    "PENDING";

  const normalized = String(status).toUpperCase();

  if (
    normalized === "MARKED" ||
    normalized === "COMPLETED" ||
    normalized === "SUBMITTED"
  ) {
    return "MARKED";
  }

  if (
    normalized === "PENDING" ||
    normalized === "UNMARKED"
  ) {
    return "UNMARKED";
  }

  if (
    normalized === "CLOSED" ||
    normalized === "CANCELLED"
  ) {
    return "MARKED";
  }

  return "UNMARKED";
}

function getSubjectName(session) {
  return (
    session?.subject?.name ||
    session?.subjectName ||
    session?.subject?.code ||
    "—"
  );
}

function getSubjectCode(session) {
  return (
    session?.subject?.code ||
    session?.subjectCode ||
    ""
  );
}

function getStandardName(session) {
  return (
    session?.standard?.name ||
    session?.standardName ||
    "—"
  );
}

function getPeriodIndex(session) {
  return (
    session?.period?.periodIndex ??
    session?.periodIndex ??
    "—"
  );
}

function getStartTime(session) {
  return (
    session?.period?.startTime ||
    session?.startTime ||
    null
  );
}

function getEndTime(session) {
  return (
    session?.period?.endTime ||
    session?.endTime ||
    null
  );
}

function getStudentCount(session) {
  if (Number.isFinite(session?.studentCount)) {
    return session.studentCount;
  }

  if (Array.isArray(session?.records)) {
    return session.records.length;
  }

  return null;
}

function getPresentCount(session) {
  if (Number.isFinite(session?.present)) {
    return session.present;
  }

  if (Array.isArray(session?.records)) {
    return session.records.filter(
      (record) =>
        String(record.status).toUpperCase() === "PRESENT"
    ).length;
  }

  return null;
}

function getAbsentCount(session) {
  if (Number.isFinite(session?.absent)) {
    return session.absent;
  }

  if (Array.isArray(session?.records)) {
    return session.records.filter(
      (record) =>
        String(record.status).toUpperCase() === "ABSENT"
    ).length;
  }

  return null;
}

function getMarkedAt(session) {
  if (session?.markedAt) {
    return session.markedAt;
  }

  if (Array.isArray(session?.records)) {
    const markedDates = session.records
      .map((record) => record.markedAt)
      .filter(Boolean)
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()));

    if (markedDates.length > 0) {
      markedDates.sort(
        (a, b) => b.getTime() - a.getTime()
      );

      return markedDates[0].toISOString();
    }
  }

  return null;
}

/*
|--------------------------------------------------------------------------
| SESSION MODAL
|--------------------------------------------------------------------------
*/

function SessionModal({
  session,
  onClose,
  onMarkAttendance,
}) {
  if (!session) return null;

  const isMarked = session.status === "MARKED";
  const isUnmarked = session.status === "UNMARKED";
  const isCurrent = session.status === "CURRENT";

  const present = getPresentCount(session);
  const absent = getAbsentCount(session);
  const markedAt = getMarkedAt(session);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl border border-slate-800 bg-slate-950 shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <p className="text-xs text-slate-500">
              Period {getPeriodIndex(session)}
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-100">
              {getSubjectName(session)}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={session.status} />

            <span className="text-sm text-slate-400">
              {formatTime(getStartTime(session))} –{" "}
              {formatTime(getEndTime(session))}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs text-slate-500">
                Class
              </p>

              <p className="mt-1 font-semibold text-slate-100">
                {getStandardName(session)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs text-slate-500">
                Students
              </p>

              <p className="mt-1 font-semibold text-slate-100">
                {getStudentCount(session) ?? "—"}
              </p>
            </div>
          </div>

          {isMarked &&
            (present !== null || absent !== null) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                  <p className="text-xs text-slate-500">
                    Present
                  </p>

                  <p className="mt-1 text-xl font-semibold text-emerald-400">
                    {present ?? "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
                  <p className="text-xs text-slate-500">
                    Absent
                  </p>

                  <p className="mt-1 text-xl font-semibold text-red-400">
                    {absent ?? "—"}
                  </p>
                </div>
              </div>
            )}

          {isMarked && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle2
                  size={16}
                  className="text-emerald-400"
                />

                {markedAt
                  ? `Marked at ${formatDateTime(markedAt)}`
                  : "Attendance has been marked"}
              </div>
            </div>
          )}

          {isCurrent && (
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex gap-3">
                <Info
                  className="mt-0.5 shrink-0 text-blue-400"
                  size={18}
                />

                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Attendance is currently open
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Mark attendance for this class before the
                    session closes.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isUnmarked && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex gap-3">
                <AlertCircle
                  className="mt-0.5 shrink-0 text-amber-400"
                  size={18}
                />

                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Attendance requires attention
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    This session has not been marked yet.
                  </p>
                </div>
              </div>
            </div>
          )}

          {(isCurrent || isUnmarked) && (
            <button
              type="button"
              onClick={() => onMarkAttendance(session)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white"
            >
              <UserCheck size={18} />
              Mark Attendance
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| SUMMARY CARD
|--------------------------------------------------------------------------
*/

function SummaryCard({
  title,
  value,
  icon: Icon,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-2xl border border-slate-800 bg-slate-900/50 p-4 text-left transition hover:border-slate-700 hover:bg-slate-900"
    >
      <div className="flex items-start justify-between">
        <div className="rounded-xl bg-slate-800 p-2.5 text-slate-300">
          <Icon size={18} />
        </div>

        <ChevronRight
          size={17}
          className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-slate-400"
        />
      </div>

      <p className="mt-4 text-2xl font-semibold text-slate-100">
        {value}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-300">
        {title}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </button>
  );
}

/*
|--------------------------------------------------------------------------
| MAIN DASHBOARD
|--------------------------------------------------------------------------
*/

export default function StaffDashboard() {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [selectedSession, setSelectedSession] =
    useState(null);

  const [showAllSessions, setShowAllSessions] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | LOAD DASHBOARD DATA
  |--------------------------------------------------------------------------
  */

  const loadDashboard = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const [
          currentResponse,
          sessionsResponse,
        ] = await Promise.all([
          get("/attendance/current"),
          get("/attendance/mine"),
        ]);

        setCurrent(currentResponse?.data || null);

        const sessionData = Array.isArray(
          sessionsResponse?.data
        )
          ? sessionsResponse.data
          : [];

        setSessions(sessionData);
      } catch (err) {
        console.error(
          "Failed to load staff dashboard:",
          err
        );

        setError(
          err?.message ||
            "Unable to load your attendance dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD + CURRENT SESSION REFRESH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadDashboard();

    // The current attendance assignment can change when
    // the server moves into another period.
    const timer = setInterval(() => {
      loadDashboard({ silent: true });
    }, 30000);

    return () => clearInterval(timer);
  }, [loadDashboard]);

  /*
  |--------------------------------------------------------------------------
  | CURRENT SESSION
  |--------------------------------------------------------------------------
  */

  const currentSessions = useMemo(() => {
    if (!current) return [];

    return Array.isArray(current.sessions)
      ? current.sessions
      : [];
  }, [current]);

  const currentSessionIds = useMemo(
    () =>
      currentSessions
        .map((item) => item?.session?.id || item?.id)
        .filter(Boolean),
    [currentSessions]
  );

  const currentSession = useMemo(() => {
    if (currentSessions.length === 0) {
      return null;
    }

    const item = currentSessions[0];

    return item?.session || item;
  }, [currentSessions]);

  /*
  |--------------------------------------------------------------------------
  | TODAY'S SESSIONS
  |--------------------------------------------------------------------------
  */

  const todaySessions = useMemo(() => {
    const today = new Date();

    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    return sessions.filter((session) => {
      const rawDate =
        session?.attendanceDate ||
        session?.sessionDate ||
        session?.date;

      if (!rawDate) {
        return true;
      }

      const date = new Date(rawDate);

      if (Number.isNaN(date.getTime())) {
        return true;
      }

      return (
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      );
    });
  }, [sessions]);

  /*
  |--------------------------------------------------------------------------
  | NORMALIZED TODAY'S SCHEDULE
  |--------------------------------------------------------------------------
  */

  const todaySchedule = useMemo(() => {
    const normalized = todaySessions.map(
      (session) => ({
        ...session,

        status: getSessionStatus(
          session,
          currentSessionIds
        ),

        period: getPeriodIndex(session),

        subject: getSubjectName(session),

        subjectCode: getSubjectCode(session),

        standard: getStandardName(session),

        startTime: getStartTime(session),

        endTime: getEndTime(session),

        studentCount: getStudentCount(session),

        present: getPresentCount(session),

        absent: getAbsentCount(session),

        markedAt: getMarkedAt(session),
      })
    );

    /*
     * Sort by period instead of API order.
     */
    normalized.sort((a, b) => {
      const periodA = Number(a.period);
      const periodB = Number(b.period);

      if (
        Number.isFinite(periodA) &&
        Number.isFinite(periodB)
      ) {
        return periodA - periodB;
      }

      return 0;
    });

    return normalized;
  }, [todaySessions, currentSessionIds]);

  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const summary = useMemo(() => {
    const total = todaySchedule.length;

    const marked = todaySchedule.filter(
      (session) => session.status === "MARKED"
    ).length;

    const unmarked = todaySchedule.filter(
      (session) => session.status === "UNMARKED"
    );

    const upcoming = todaySchedule.filter(
      (session) => {
        if (session.status === "CURRENT") {
          return false;
        }

        if (session.status === "MARKED") {
          return false;
        }

        const start = session.startTime;

        if (!start) {
          return false;
        }

        const [hours, minutes] = String(start)
          .split(":")
          .map(Number);

        if (
          !Number.isInteger(hours) ||
          !Number.isInteger(minutes)
        ) {
          return false;
        }

        const now = new Date();

        const startDate = new Date();

        startDate.setHours(
          hours,
          minutes,
          0,
          0
        );

        return startDate > now;
      }
    );

    return {
      total,
      marked,
      unmarked: unmarked.length,
      upcoming: upcoming.length,
      unmarkedSessions: unmarked,
      upcomingSessions: upcoming,
    };
  }, [todaySchedule]);

  /*
  |--------------------------------------------------------------------------
  | COMPLETION
  |--------------------------------------------------------------------------
  */

  const completion =
    summary.total > 0
      ? Math.round(
          (summary.marked / summary.total) * 100
        )
      : 0;

  /*
  |--------------------------------------------------------------------------
  | VISIBLE SCHEDULE
  |--------------------------------------------------------------------------
  */

  const visibleSchedule = showAllSessions
    ? todaySchedule
    : todaySchedule.slice(0, 6);

  /*
  |--------------------------------------------------------------------------
  | STAFF NAME
  |--------------------------------------------------------------------------
  */

  /*
   * /attendance/current is intentionally used for attendance
   * assignment information. It may not contain the user's
   * complete profile, so don't invent staff data here.
   *
   * Until a dedicated /me endpoint is connected, use the
   * authenticated client/user if it exposes one later.
   */
  const staffName =
    current?.staff?.name ||
    current?.user?.name ||
    current?.staffName ||
    "Staff";

  const firstName = staffName.split(" ")[0];

  /*
  |--------------------------------------------------------------------------
  | MARK ATTENDANCE
  |--------------------------------------------------------------------------
  */

  const handleMarkAttendance = (session) => {
    if (!session?.id) {
      return;
    }

    setSelectedSession(null);

    /*
     * Your existing staff attendance page already handles:
     *
     * GET /attendance/sessions/:id/students
     * GET /absence-types
     * POST /attendance/sessions/:id/mark
     *
     * So we navigate there rather than duplicating
     * attendance-marking logic inside the dashboard.
     */
    navigate(`/mark?session=${session.id}`);
  };

  /*
  |--------------------------------------------------------------------------
  | SESSION SELECTION
  |--------------------------------------------------------------------------
  */

  const openSession = (session) => {
    if (!session) return;

    setSelectedSession(session);
  };

  /*
  |--------------------------------------------------------------------------
  | CURRENT SESSION NORMALIZATION
  |--------------------------------------------------------------------------
  */

  const normalizedCurrentSession = currentSession
    ? {
        ...currentSession,

        status: "CURRENT",

        period: getPeriodIndex(currentSession),

        subject: getSubjectName(currentSession),

        subjectCode: getSubjectCode(currentSession),

        standard: getStandardName(currentSession),

        startTime: getStartTime(currentSession),

        endTime: getEndTime(currentSession),

        studentCount:
          getStudentCount(currentSession),
      }
    : null;

  /*
  |--------------------------------------------------------------------------
  | ERROR STATE
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="space-y-5 animate-pulse">
            <div className="h-4 w-40 rounded bg-slate-800" />

            <div className="h-10 w-72 rounded bg-slate-800" />

            <div className="h-28 rounded-2xl bg-slate-900" />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map(
                (_, index) => (
                  <div
                    key={index}
                    className="h-36 rounded-2xl bg-slate-900"
                  />
                )
              )}
            </div>

            <div className="h-72 rounded-2xl bg-slate-900" />
          </div>
        </main>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | MAIN
  |--------------------------------------------------------------------------
  */

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        {/* ============================================================
            HEADER
        ============================================================ */}

        <section className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {formatDate(
                current?.serverTime ||
                  new Date().toISOString()
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                loadDashboard({ silent: true })
              }
              disabled={refreshing}
              className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 transition hover:text-slate-100 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className={
                  refreshing ? "animate-spin" : ""
                }
              />
            </button>
          </div>

          <div className="mt-1 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Good morning, {firstName}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Here&apos;s your attendance overview for
                today.
              </p>
            </div>

            <button
              type="button"
              className="hidden rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-slate-400 hover:text-slate-100 sm:block"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        </section>

        {/* ============================================================
            ERROR
        ============================================================ */}

        {error && (
          <section className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
            <div className="flex gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-300">
                  Unable to load attendance data
                </p>

                <p className="mt-1 text-xs text-red-400/70">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => loadDashboard()}
                  className="mt-3 text-xs font-medium text-red-300 hover:text-red-200"
                >
                  Try again
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            CURRENT SESSION
        ============================================================ */}

        {normalizedCurrentSession && (
          <section className="mb-6">
            <div className="overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-900">
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />

                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-400" />
                      </span>

                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                        Current Session
                      </span>
                    </div>

                    <h2 className="mt-3 text-2xl font-bold">
                      {normalizedCurrentSession.subject}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
                      <span>
                        Period{" "}
                        {normalizedCurrentSession.period}
                      </span>

                      <span className="text-slate-700">
                        •
                      </span>

                      <span>
                        {normalizedCurrentSession.standard}
                      </span>

                      <span className="text-slate-700">
                        •
                      </span>

                      <span>
                        {formatTime(
                          normalizedCurrentSession.startTime
                        )}{" "}
                        –{" "}
                        {formatTime(
                          normalizedCurrentSession.endTime
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleMarkAttendance(
                        normalizedCurrentSession
                      )
                    }
                    className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white"
                  >
                    <UserCheck size={18} />
                    Mark Attendance
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            NO CURRENT SESSION
        ============================================================ */}

        {!normalizedCurrentSession && (
          <section className="mb-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="flex gap-3">
                <Clock3
                  size={20}
                  className="mt-0.5 shrink-0 text-slate-500"
                />

                <div>
                  <p className="text-sm font-medium text-slate-200">
                    No attendance to mark right now
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {getCurrentReason(
                      current?.reason
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            SUMMARY
        ============================================================ */}

        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">
              Today&apos;s Attendance
            </h2>

            <span className="text-xs text-slate-500">
              {summary.marked}/{summary.total} completed
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <SummaryCard
              title="Marked"
              value={summary.marked}
              icon={CheckCircle2}
              description="Completed sessions"
              onClick={() =>
                setShowAllSessions(true)
              }
            />

            <SummaryCard
              title="Unmarked"
              value={summary.unmarked}
              icon={AlertCircle}
              description="Requires attention"
              onClick={() => {
                const session =
                  summary.unmarkedSessions[0];

                if (session) {
                  openSession(session);
                }
              }}
            />

            <SummaryCard
              title="Upcoming"
              value={summary.upcoming}
              icon={Clock3}
              description="Remaining sessions"
              onClick={() =>
                setShowAllSessions(true)
              }
            />

            <SummaryCard
              title="Total Sessions"
              value={summary.total}
              icon={CalendarCheck}
              description="Required today"
              onClick={() =>
                setShowAllSessions(true)
              }
            />
          </div>
        </section>

        {/* ============================================================
            COMPLETION PROGRESS
        ============================================================ */}

        <section className="mb-7 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Attendance completion
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Keep your attendance marking up to date.
              </p>
            </div>

            <span className="text-lg font-bold text-slate-100">
              {completion}%
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-slate-200 transition-all"
              style={{
                width: `${completion}%`,
              }}
            />
          </div>
        </section>

        {/* ============================================================
            UNMARKED + UPCOMING
        ============================================================ */}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Unmarked */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">
                  Attendance requires attention
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Sessions that still need attendance.
                </p>
              </div>

              <span className="rounded-full bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-400">
                {summary.unmarked}
              </span>
            </div>

            {summary.unmarkedSessions.length ===
            0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
                <CheckCircle2
                  className="mx-auto text-emerald-400"
                  size={28}
                />

                <p className="mt-2 text-sm font-medium text-slate-200">
                  All caught up
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  No attendance sessions require attention.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.unmarkedSessions.map(
                  (session) => (
                    <button
                      type="button"
                      key={session.id}
                      onClick={() =>
                        openSession(session)
                      }
                      className="group flex w-full items-center justify-between rounded-2xl border border-amber-500/10 bg-slate-900/50 p-4 text-left transition hover:border-amber-500/20 hover:bg-slate-900"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-amber-400/10 p-2.5 text-amber-400">
                          <AlertCircle size={19} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-200">
                            {session.subject}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Period {session.period} •{" "}
                            {session.standard} •{" "}
                            {formatTime(
                              session.startTime
                            )}
                          </p>
                        </div>
                      </div>

                      <ChevronRight
                        size={18}
                        className="text-slate-600 group-hover:text-slate-300"
                      />
                    </button>
                  )
                )}
              </div>
            )}
          </section>

          {/* Upcoming */}
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-slate-200">
                Upcoming sessions
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Your next scheduled classes.
              </p>
            </div>

            {summary.upcomingSessions.length ===
            0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
                <Clock3
                  className="mx-auto text-slate-600"
                  size={28}
                />

                <p className="mt-2 text-sm font-medium text-slate-300">
                  No upcoming sessions
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {summary.upcomingSessions.map(
                  (session) => (
                    <button
                      type="button"
                      key={session.id}
                      onClick={() =>
                        openSession(session)
                      }
                      className="group flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-left transition hover:border-slate-700 hover:bg-slate-900"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-slate-800 p-2.5 text-slate-400">
                          <Clock3 size={19} />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-200">
                            {session.subject}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Period {session.period} •{" "}
                            {session.standard}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-300">
                          {formatTime(
                            session.startTime
                          )}
                        </p>

                        <ChevronRight
                          size={17}
                          className="ml-auto mt-1 text-slate-600 group-hover:text-slate-300"
                        />
                      </div>
                    </button>
                  )
                )}
              </div>
            )}
          </section>
        </div>

        {/* ============================================================
            TODAY'S SCHEDULE
        ============================================================ */}

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">
                Today&apos;s schedule
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Attendance status for each session.
              </p>
            </div>

            {todaySchedule.length > 6 && (
              <button
                type="button"
                onClick={() =>
                  setShowAllSessions(
                    (value) => !value
                  )
                }
                className="text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                {showAllSessions
                  ? "Show less"
                  : "View all"}
              </button>
            )}
          </div>

          {todaySchedule.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-8 text-center">
              <CalendarDays
                className="mx-auto text-slate-600"
                size={30}
              />

              <p className="mt-2 text-sm font-medium text-slate-300">
                No attendance sessions for today
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Your attendance schedule will appear here
                when sessions are available.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
              <div className="divide-y divide-slate-800">
                {visibleSchedule.map((session) => (
                  <button
                    type="button"
                    key={session.id}
                    onClick={() =>
                      openSession(session)
                    }
                    className="group flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-900/70 sm:gap-5"
                  >
                    <div className="w-10 shrink-0 text-center sm:w-12">
                      <p className="text-xs font-medium text-slate-500">
                        P{session.period}
                      </p>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-slate-200">
                          {session.subject}
                        </p>

                        {session.subjectCode && (
                          <span className="hidden rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500 sm:inline">
                            {session.subjectCode}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>
                          {session.standard}
                        </span>

                        <span>•</span>

                        <span>
                          {formatTime(
                            session.startTime
                          )}{" "}
                          –{" "}
                          {formatTime(
                            session.endTime
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <StatusBadge
                        status={session.status}
                      />
                    </div>

                    <ChevronRight
                      size={17}
                      className="shrink-0 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-slate-400"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ============================================================
            LEAVE STATUS
            ============================================================ */}

        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-200">
              Leave status
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-800 p-2.5 text-slate-400">
                <CalendarDays size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Leave management
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Staff leave APIs are not connected yet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================
            RECENT ACTIVITY
        ============================================================ */}

        <section className="mt-8">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-200">
              Recent activity
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Recently completed attendance sessions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40">
            {todaySchedule.filter(
              (session) => session.status === "MARKED"
            ).length === 0 ? (
              <div className="p-5 text-center">
                <p className="text-xs text-slate-500">
                  No attendance activity yet today.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {todaySchedule
                  .filter(
                    (session) =>
                      session.status === "MARKED"
                  )
                  .slice(0, 5)
                  .map((session) => (
                    <div
                      key={session.id}
                      className="flex gap-3 p-4"
                    >
                      <div className="mt-0.5 rounded-lg bg-emerald-400/10 p-1.5 text-emerald-400">
                        <CheckCircle2 size={14} />
                      </div>

                      <div>
                        <p className="text-xs text-slate-300">
                          Attendance marked for{" "}
                          {session.standard} —{" "}
                          {session.subject}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-600">
                          {getMarkedAt(session)
                            ? `Marked at ${formatDateTime(
                                getMarkedAt(
                                  session
                                )
                              )}`
                            : "Completed"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================
            REPORT PROBLEM
        ============================================================ */}

        <div className="mt-8 flex justify-center pb-6">
          <button
            type="button"
            onClick={() => {
              // Backend endpoint for this is not implemented yet.
              console.log(
                "Report a problem clicked"
              );
            }}
            className="flex items-center gap-2 text-xs text-slate-600 transition hover:text-slate-400"
          >
            <FileText size={14} />
            Report a problem
          </button>
        </div>
      </main>

      {/* ==============================================================
          SESSION MODAL
      ============================================================== */}

      <SessionModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onMarkAttendance={handleMarkAttendance}
      />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| CURRENT ATTENDANCE REASON
|--------------------------------------------------------------------------
*/

function getCurrentReason(reason) {
  switch (reason) {
    case "NO_CURRENT_PERIOD":
      return "There is no active attendance period at the moment.";

    case "NO_ATTENDANCE_ASSIGNMENT":
      return "You do not have an attendance assignment for the current period.";

    case "STAFF_ON_LEAVE":
      return "You are marked as unavailable for the current period.";

    case "NON_WORKING_DAY":
      return "Today is not a working day.";

    case "ATTENDANCE_NOT_REQUIRED":
      return "Attendance is not required for the current timetable slot.";

    case "NO_ACTIVE_ACADEMIC_YEAR":
      return "There is no active academic year configured.";

    default:
      return (
        "The system could not find an attendance session for you at this time."
      );
  }
}
