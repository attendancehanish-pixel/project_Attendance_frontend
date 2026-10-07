import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { get, post } from "../../../shared/api/client";
import { attendanceLeaveApi } from "../api/attendance-leave.api";
import AttendanceDrawer from "../components/AttendanceDrawer";
import StatusBadge from "../components/StatusBadge";


import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Users,
  X,
  UserCheck,
  CalendarDays,
  ChevronRight,
  Search,
  RefreshCw,
  CheckCheck,
} from "lucide-react";

import {
  Loading,
  ErrorState,
  Empty,
} from "../../../shared/components/State";

import {
  dateOnly,
} from "../../../shared/utils/format";


/*
|--------------------------------------------------------------------------
| TOASTS (replaces alert())
|--------------------------------------------------------------------------
*/

function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null;

  return (
    <div
      className="fixed inset-x-0 top-4 z-[60] mx-auto flex w-full max-w-sm flex-col gap-2 px-4 sm:left-auto sm:right-4 sm:mx-0"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur ${toast.type === "error"
            ? "border-red-500/30 bg-red-950/90 text-red-200"
            : "border-emerald-500/30 bg-emerald-950/90 text-emerald-200"
            }`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          )}
          <p className="flex-1 leading-5">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 text-current opacity-60 transition hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "success") => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  return { toasts, push, dismiss };
}

/*
|--------------------------------------------------------------------------
| STATUS BADGE
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| SESSION INFO
|--------------------------------------------------------------------------
*/

function getSessionInfo(item) {
  const session = item?.session || item || {};

  return {
    session,

    className:
      item?.standard?.name ||
      session?.standard?.name ||
      item?.standardName ||
      session?.standardName ||
      "—",

    subjectName:
      item?.subject?.name ||
      session?.subject?.name ||
      item?.subjectName ||
      session?.subjectName ||
      "—",

    periodIndex:
      item?.period?.periodIndex ??
      session?.period?.periodIndex ??
      item?.periodIndex ??
      session?.periodIndex ??
      "—",

    startTime:
      item?.period?.startTime ||
      session?.period?.startTime ||
      item?.startTime ||
      session?.startTime ||
      null,

    endTime:
      item?.period?.endTime ||
      session?.period?.endTime ||
      item?.endTime ||
      session?.endTime ||
      null,

    status:
      session?.sessionStatus ||
      item?.sessionStatus ||
      session?.status ||
      "PENDING",

    attendanceDate:
      session?.attendanceDate ||
      item?.attendanceDate ||
      session?.sessionDate ||
      item?.sessionDate ||
      session?.date ||
      item?.date ||
      null,

    studentCount:
      session?.studentCount ??
      item?.studentCount ??
      null,
  };
}

/*
|--------------------------------------------------------------------------
| SESSION CARD
|--------------------------------------------------------------------------
*/

function SessionCard({ item, onOpen, openingId }) {
  const {
    session,
    className,
    subjectName,
    periodIndex,
    startTime,
    endTime,
    status,
    studentCount,
    attendanceDate,
  } = getSessionInfo(item);

  const normalizedStatus = String(status || "PENDING").toUpperCase();
  const isPending = normalizedStatus === "PENDING";
  const isOpening = openingId === session.id;

  return (
    <button
      type="button"
      onClick={() => onOpen(session.id)}
      disabled={Boolean(openingId)}
      className="group w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-left transition hover:border-slate-700 hover:bg-slate-900 disabled:cursor-wait disabled:opacity-60"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">
          P{periodIndex}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-200">
                {subjectName}
              </h3>
              <p className="mt-1 text-xs text-slate-500">{className}</p>
            </div>

            <StatusBadge status={status} />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            {attendanceDate && <span>{dateOnly(attendanceDate)}</span>}

            {startTime && endTime && (
              <span className="flex items-center gap-1.5">
                <Clock3 size={13} />
                {startTime} – {endTime}
              </span>
            )}

            {studentCount !== null && studentCount !== undefined && (
              <span className="flex items-center gap-1.5">
                <Users size={13} />
                {studentCount} students
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          size={17}
          className="mt-1 shrink-0 text-slate-700 transition group-hover:translate-x-0.5 group-hover:text-slate-400"
        />
      </div>

      {isPending && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
          <span className="text-xs text-amber-400">Attendance required</span>
          <span className="text-xs font-medium text-slate-300">
            {isOpening ? "Opening…" : "Open →"}
          </span>
        </div>
      )}
    </button>
  );
}





/*
|--------------------------------------------------------------------------
| MAIN PAGE
|--------------------------------------------------------------------------
*/

export default function Attendance() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [sessions, setSessions] = useState(null); // { data, nextCursor, hasMore }
  const [current, setCurrent] = useState(null);
  const [error, setError] = useState(null);

  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveBusy, setLeaveBusy] = useState(false);

  const [detail, setDetail] = useState(null);

  // Split "busy" into per-action states so unrelated UI (e.g. the Refresh
  // button) doesn't react to actions it has nothing to do with.
  const [openingId, setOpeningId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [absenceTypes, setAbsenceTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);

  const { toasts, push: pushToast, dismiss: dismissToast } = useToasts();

  // Drawer open + search focused both pause background polling so a
  // mid-edit refresh can't reset scroll position or flicker the list.
  const pollingPausedRef = useRef(false);
  pollingPausedRef.current = Boolean(detail) || searchFocused || leaveConfirmOpen || confirmOpen;

  function requestLeave() {
    if (!detail) return;
    setLeaveReason("");
    setLeaveConfirmOpen(true);
  }

  async function confirmLeave() {
    if (!detail) return;

    setLeaveBusy(true);
    try {
      await attendanceLeaveApi.markSessionAsLeave({
        sessionId: detail.id,
        reason: leaveReason.trim() || undefined,
      });

      setLeaveConfirmOpen(false);
      setLeaveReason("");
      setDetail(null);
      await load();
      pushToast("Session marked as staff leave.", "success");
    } catch (e) {
      console.error("Failed to mark staff leave:", e);
      pushToast(e?.message || "Unable to mark staff leave.", "error");
    } finally {
      setLeaveBusy(false);
    }
  }
  /*
  |--------------------------------------------------------------------------
  | LOAD PAGE DATA
  |--------------------------------------------------------------------------
  */

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      setError(null);
      if (!silent) setRefreshing(true);

      const [
        currentResponse,
        sessionsResponse,
        absenceTypesResponse,
      ] = await Promise.all([
        get("/attendance/current"),
        get("/attendance/mine"),
        get("/absence-types"),
      ]);

      setCurrent(currentResponse?.data || null);

      // Normalize: backend now returns { data, nextCursor, hasMore }
      setSessions(
        sessionsResponse &&
          typeof sessionsResponse === "object" &&
          "data" in sessionsResponse
          ? sessionsResponse
          : {
            data: Array.isArray(sessionsResponse) ? sessionsResponse : [],
            nextCursor: null,
            hasMore: false,
          }
      );

      setAbsenceTypes(
        Array.isArray(absenceTypesResponse?.data)
          ? absenceTypesResponse.data
          : []
      );
    } catch (e) {
      console.error("Failed to load attendance page:", e);
      setError(e);
    } finally {
      if (!silent) setRefreshing(false);
    }
  }, []);

  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD + LIVE REFRESH (paused while drawer open or search focused)
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    load();

    const timer = setInterval(() => {
      if (pollingPausedRef.current) return;
      load({ silent: true });
    }, 30000);

    return () => clearInterval(timer);
  }, [load]);

  /*
  |--------------------------------------------------------------------------
  | LOAD MORE (older sessions)
  |--------------------------------------------------------------------------
  */

  const loadMore = useCallback(async () => {
    if (!sessions?.hasMore || !sessions?.nextCursor) return;

    try {
      setLoadingMore(true);

      const res = await get(
        `/attendance/mine?cursor=${encodeURIComponent(
          sessions.nextCursor
        )}&limit=5`
      );

      const pageData = Array.isArray(res?.data) ? res.data : [];

      setSessions((prev) => {
        if (!prev) return prev;

        const seen = new Set(prev.data.map((s) => s.id || s.session?.id));

        const merged = [
          ...prev.data,
          ...pageData.filter((s) => !seen.has(s.id || s.session?.id)),
        ];

        return {
          data: merged,
          nextCursor: res?.nextCursor ?? null,
          hasMore: Boolean(res?.hasMore),
        };
      });
    } catch (e) {
      console.error("Failed to load more sessions:", e);
      pushToast(e?.message || "Unable to load more sessions.", "error");
    } finally {
      setLoadingMore(false);
    }
  }, [sessions, pushToast]);

  /*
  |--------------------------------------------------------------------------
  | OPEN SESSION
  |--------------------------------------------------------------------------
  */

  const open = useCallback(
    async (id) => {
      if (!id) return;

      try {
        setOpeningId(id);
        setError(null);

        const response = await get(`/attendance/sessions/${id}/students`);

        const data = response?.data || {};
        const session = data.session || {};
        const students = Array.isArray(data.students) ? data.students : [];

        const attendanceRecords = Array.isArray(data.attendanceRecords)
          ? data.attendanceRecords
          : Array.isArray(data.records)
            ? data.records
            : [];

        const recordMap = new Map(
          attendanceRecords.map((record) => [record.enrollmentId, record])
        );

        setDetail({
          ...session,
          students: students.map((student) => {
            const existing = recordMap.get(student.enrollmentId);
            return {
              ...student,
              status: existing?.status || student.status || "PRESENT",
              absenceTypeId: existing?.absenceTypeId ?? student.absenceTypeId ?? null,
            };
          }),
        });

        if (searchParams.get("session") === id) {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete("session");
          setSearchParams(nextParams, { replace: true });
        }
      } catch (e) {
        console.error("Failed to open attendance session:", e);
        pushToast(e?.message || "Unable to load this attendance session.", "error");
      } finally {
        setOpeningId(null);
      }
    },
    [searchParams, setSearchParams, pushToast]
  );

  /*
  |--------------------------------------------------------------------------
  | OPEN SESSION FROM DASHBOARD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const sessionId = searchParams.get("session");
    if (!sessionId) return;
    if (detail?.id === sessionId) return;
    open(sessionId);
  }, [searchParams, open, detail?.id]);

  /*
  |--------------------------------------------------------------------------
  | UPDATE STUDENT
  |--------------------------------------------------------------------------
  */

  function updateStudent(id, patch) {
    setDetail((currentDetail) => {
      if (!currentDetail) return currentDetail;

      return {
        ...currentDetail,
        students: currentDetail.students.map((student) =>
          student.id === id ? { ...student, ...patch } : student
        ),
      };
    });
  }

  /*
  |--------------------------------------------------------------------------
  | MARK ALL PRESENT (bulk action)
  |--------------------------------------------------------------------------
  */

  function markAllPresent() {
    setDetail((currentDetail) => {
      if (!currentDetail) return currentDetail;

      return {
        ...currentDetail,
        students: currentDetail.students.map((student) => ({
          ...student,
          status: "PRESENT",
          absenceTypeId: null,
          remarks: "",
        })),
      };
    });
  }

  /*
  |--------------------------------------------------------------------------
  | VALIDATION (shared by the submit request + confirm step)
  |--------------------------------------------------------------------------
  */

  function validate(students) {
    if (students.length === 0) {
      return "No students found for this class.";
    }

    // const invalidAbsent = students.find((student) => {
    //   const status = String(student.status || "PRESENT").toUpperCase();
    //   return (
    //     status === "ABSENT" &&
    //     (!student.absenceTypeId || !String(student.remarks || "").trim())
    //   );
    // });

    // if (invalidAbsent) {
    //   return "For every absent student, both absence type and description are required.";
    // }

    const invalidStatus = students.find((student) => {
      const status = String(student.status || "PRESENT").toUpperCase();
      return !["PRESENT", "ABSENT"].includes(status);
    });

    if (invalidStatus) {
      return "Every student must be marked Present or Absent.";
    }

    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | REQUEST SUBMIT -> opens confirmation dialog after validating
  |--------------------------------------------------------------------------
  */

  function requestSubmit() {
    if (!detail) return;

    const validationError = validate(detail.students || []);
    if (validationError) {
      pushToast(validationError, "error");
      return;
    }

    setConfirmOpen(true);
  }

  /*
  |--------------------------------------------------------------------------
  | CONFIRM + MARK ATTENDANCE
  |--------------------------------------------------------------------------
  */

  async function confirmSubmit() {
    if (!detail) return;

    const students = detail.students || [];

    const validationError = validate(students);
    if (validationError) {
      setConfirmOpen(false);
      pushToast(validationError, "error");
      return;
    }

    setSubmitting(true);

    try {
      const records = students.map((student) => {
        const status = String(student.status || "PRESENT").toUpperCase();

        const record = {
          studentId: student.id,
          status,
        };

        if (status === "ABSENT") {
          record.absenceTypeId = student.absenceTypeId;
          record.remarks = String(student.remarks || "").trim();
        }

        return record;
      });

      await post(`/attendance/sessions/${detail.id}/mark`, { records });

      setConfirmOpen(false);
      setDetail(null);
      await load();

      pushToast("Attendance submitted successfully.", "success");
    } catch (e) {
      console.error("Failed to submit attendance:", e);
      pushToast(e?.message || "Unable to submit attendance.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FILTER SESSIONS
  |--------------------------------------------------------------------------
  */

  const filteredSessions = useMemo(() => {
    const list = sessions?.data || [];

    if (!search.trim()) return list;

    const query = search.toLowerCase();

    return list.filter((item) => {
      const { className, subjectName, periodIndex } = getSessionInfo(item);

      return (
        String(subjectName).toLowerCase().includes(query) ||
        String(className).toLowerCase().includes(query) ||
        String(periodIndex).toLowerCase().includes(query)
      );
    });
  }, [sessions, search]);

  /*
  |--------------------------------------------------------------------------
  | LOADING / ERROR
  |--------------------------------------------------------------------------
  */

  if (!sessions) {
    return <Loading />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={load} />;
  }

  const currentSessions = current?.sessions || [];

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-8">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {/* PAGE HEADER */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-600">
          Staff attendance
        </p>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
              Attendance
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Mark attendance for sessions assigned to you.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {current?.serverTime && (
              <div className="hidden items-center gap-2 text-xs text-slate-600 sm:flex">
                <Clock3 size={14} />
                Server time:
                <span className="text-slate-400">
                  {new Date(current.serverTime).toLocaleTimeString("en-IN")}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={() => load()}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-400 transition hover:text-slate-100 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* CURRENT ATTENDANCE */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              Current attendance
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Attendance sessions currently assigned to you.
            </p>
          </div>

          <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-500">
            Live
          </span>
        </div>

        {currentSessions.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-slate-800 p-3 text-slate-500">
                <CalendarDays size={20} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-200">
                  No attendance to mark right now
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {getCurrentReason(current?.reason)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {currentSessions.map((item) => {
              const info = getSessionInfo(item);
              const isOpening = openingId === info.session.id;

              return (
                <div
                  key={info.session.id}
                  className="overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-slate-900 to-slate-900"
                >
                  <div className="p-5">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-400" />
                          </span>

                          <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">
                            Current session
                          </span>
                        </div>

                        <h3 className="mt-3 text-xl font-bold text-slate-100">
                          {info.subjectName}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>Period {info.periodIndex}</span>
                          <span>•</span>
                          <span>{info.className}</span>
                          {info.startTime && info.endTime && (
                            <>
                              <span>•</span>
                              <span>
                                {info.startTime} – {info.endTime}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => open(info.session.id)}
                        disabled={Boolean(openingId)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <UserCheck size={18} />
                        {isOpening ? "Opening..." : "Mark Attendance"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MY SESSIONS */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">
              My attendance sessions
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Showing your latest attendance sessions (today or earlier).
              {sessions?.hasMore ? " Load more to see older ones." : ""}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search subject or class..."
              aria-label="Search attendance sessions"
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-8 text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-slate-600"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <Empty>
            {search
              ? "No attendance sessions match your search."
              : "No attendance sessions assigned to you."}
          </Empty>
        ) : (
          <>
            {/* MOBILE */}
            <div className="space-y-3 md:hidden">
              {filteredSessions.map((session) => (
                <SessionCard
                  key={session.id || session.session?.id}
                  item={session}
                  onOpen={open}
                  openingId={openingId}
                />
              ))}
            </div>

            {/* DESKTOP */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30 md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50">
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Date
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Subject
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Class
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Period
                      </th>
                      <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
                        Status
                      </th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800">
                    {filteredSessions.map((row) => {
                      const info = getSessionInfo(row);

                      return (
                        <tr
                          key={row.id || row.session?.id}
                          onClick={() => open(info.session.id)}
                          className="cursor-pointer transition hover:bg-slate-900/60"
                        >
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                            {dateOnly(info.attendanceDate)}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-slate-300">
                              {info.subjectName}
                            </p>
                            {info.startTime && info.endTime && (
                              <p className="mt-1 text-[11px] text-slate-600">
                                {info.startTime} – {info.endTime}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500">
                            {info.className}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500">
                            P{info.periodIndex}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={info.status} />
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                open(info.session.id);
                              }}
                              disabled={Boolean(openingId)}
                              className="text-xs font-medium text-slate-400 transition hover:text-slate-100 disabled:opacity-50"
                            >
                              {openingId === info.session.id ? "Opening…" : "Open"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LOAD MORE */}
            {sessions?.hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "Load more (older sessions)"}
                </button>
              </div>
            )}

            {/* END OF LIST */}
            {sessions && !sessions.hasMore && sessions.data.length > 0 && (
              <p className="mt-4 text-center text-[10px] text-slate-600">
                — End of sessions —
              </p>
            )}
          </>
        )}
      </section>

      {/* DRAWER */}
      <AttendanceDrawer
        detail={detail}
        absenceTypes={absenceTypes}
        busy={submitting}
        confirmOpen={confirmOpen}
        onClose={() => {
          if (submitting || leaveBusy) return;
          setConfirmOpen(false);
          setLeaveConfirmOpen(false);
          setLeaveReason("");
          setDetail(null);
          if (searchParams.has("session")) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete("session");
            setSearchParams(nextParams, { replace: true });
          }
        }}
        onUpdateStudent={updateStudent}
        onMarkAllPresent={markAllPresent}
        onRequestSubmit={requestSubmit}
        onCancelConfirm={() => setConfirmOpen(false)}
        onConfirmSubmit={confirmSubmit}
        leaveConfirmOpen={leaveConfirmOpen}
        leaveBusy={leaveBusy}
        leaveReason={leaveReason}
        onRequestLeave={requestLeave}
        onCancelLeaveConfirm={() => {
          if (leaveBusy) return;
          setLeaveConfirmOpen(false);
          setLeaveReason("");
        }}
        onConfirmLeave={confirmLeave}
        onLeaveReasonChange={setLeaveReason}
      />
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| CURRENT SESSION REASON
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
      return "The system could not find an attendance session for you at this time.";
  }
}