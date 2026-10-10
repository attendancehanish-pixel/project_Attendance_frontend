import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { attendanceDashboardApi } from "../api/attendance-dashboard.api";
import { get } from "../../../shared/api/client";
import { dateOnly } from "../../../shared/utils/format";
import AttendanceSessionModal from "../components/AttendanceSessionModal";
import StatusBadge from "../components/StatusBadge";

function todayISO() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function addDaysISO(iso, days) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

// Return the real backend status so StatusBadge can render it correctly.
// NOT_GENERATED is a front-end sentinel for cells that have no session at all.
function cellStatus(cell) {
  if (!cell.hasSession) return "NOT_GENERATED";
  return cell.sessionStatus; // PENDING | MARKED | SUBMITTED | CLOSED | CANCELLED | STAFF_LEAVE
}

// Visual treatment per status, kept consistent with StatusBadge colors.
const cellStyles = {
  MARKED: "cursor-pointer border-ui-ok-line bg-ui-ok-bg hover:border-ui-ok-line-hover hover:bg-ui-ok-bg-hover",
  SUBMITTED: "cursor-pointer border-ui-ok-line bg-ui-ok-bg hover:border-ui-ok-line-hover hover:bg-ui-ok-bg-hover",
  PENDING: "cursor-pointer border-ui-err-line bg-ui-err-bg hover:border-ui-err-line-hover hover:bg-ui-err-bg-hover",
  CLOSED: "cursor-pointer border-ui-line-2 bg-ui-chip hover:border-ui-line-strong hover:bg-ui-line-2",
  CANCELLED: "cursor-pointer border-ui-err-line bg-ui-err-bg hover:border-ui-err-line-hover hover:bg-ui-err-bg-hover",
  STAFF_LEAVE: "cursor-pointer border-ui-info-line bg-ui-info-bg hover:border-ui-info-line hover:bg-ui-info-line",
  NOT_GENERATED: "border-ui-line bg-ui-surface-2",
};

function cellDescription(cell, status) {
  if (status === "MARKED" || status === "SUBMITTED") {
    return `${cell.presentCount} present · ${cell.absentCount} absent`;
  }
  if (status === "STAFF_LEAVE") return "Staff on leave · no attendance";
  if (status === "CANCELLED") return "Session cancelled";
  if (status === "CLOSED") return `${cell.totalStudents} students · closed`;
  return `${cell.totalStudents} students · not marked`;
}

export default function AttendanceDashboard() {
  const [date, setDate] = useState(todayISO());
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState(null);

  const [selectedSessionId, setSelectedSessionId] = useState(null);

  const [unmarked, setUnmarked] = useState(null);
  const [unmarkedLoading, setUnmarkedLoading] = useState(false);
  const [unmarkedError, setUnmarkedError] = useState(null);

  const [staffLeaves, setStaffLeaves] = useState({ status: "loading", items: [] });
  const [substitutions, setSubstitutions] = useState({ status: "loading", items: [] });

  async function loadReport() {
    setReportLoading(true);
    setReportError(null);
    try {
      const response = await attendanceDashboardApi.getDaily(date);
      setReport(response.data);
    } catch (e) {
      setReportError(e);
    } finally {
      setReportLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function loadUnmarked(academicYearId) {
    setUnmarkedLoading(true);
    setUnmarkedError(null);
    try {
      const response = await attendanceDashboardApi.getUnmarked({
        academicYearId,
        from: addDaysISO(date, -14),
        to: date,
        pageSize: 5,
      });
      setUnmarked(response.data);
    } catch (e) {
      setUnmarkedError(e);
    } finally {
      setUnmarkedLoading(false);
    }
  }

  useEffect(() => {
    if (report?.academicYear?.id) loadUnmarked(report.academicYear.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.academicYear?.id, date]);

  // Staff leave / substitutions modules aren't implemented on the backend
  // yet (placeholder routes), so we probe them and fall back gracefully
  // instead of showing stale mock names.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await get("/staff-leaves");
        if (!cancelled) setStaffLeaves({ status: "ready", items: response.data || [] });
      } catch {
        if (!cancelled) setStaffLeaves({ status: "unavailable", items: [] });
      }
    })();
    (async () => {
      try {
        const response = await get("/substitutions");
        if (!cancelled) setSubstitutions({ status: "ready", items: response.data || [] });
      } catch {
        if (!cancelled) setSubstitutions({ status: "unavailable", items: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-ui-page text-ui-ink">
      <div className="mx-auto px-4 py-6 md:px-6">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-ui-muted-2">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-ui-ink">
              Attendance Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/attendance/generate"
              className="rounded-lg border border-ui-line-strong bg-ui-surface px-4 py-2.5 text-[12px] font-medium text-ui-ink-2 transition hover:bg-ui-surface-2"
            >
              Generate sessions
            </Link>

            <button
              type="button"
              onClick={() => setDate(todayISO())}
              className="rounded-lg border border-ui-line-strong bg-ui-surface px-4 py-2.5 text-[12px] font-medium text-ui-ink-2 transition hover:bg-ui-surface-2"
            >
              Today
            </button>

            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-ui-line-strong bg-ui-surface px-4 py-2.5 text-[12px] text-ui-ink outline-none transition focus:border-ui-muted focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
            />
          </div>
        </header>

        {/* Class × period attendance session matrix */}
        <section className="overflow-hidden rounded-xl border border-ui-line bg-ui-surface">
          <div className="border-b border-ui-line-soft px-5 py-4">
            <h2 className="text-[13px] font-semibold text-ui-ink">
              Daily attendance sessions
            </h2>
            <p className="mt-1 text-[11px] text-ui-muted">
              Click a generated attendance session to view student details.
            </p>
          </div>

          {reportLoading && (
            <div className="p-10 text-center text-[12px] text-ui-faint">
              Loading attendance sessions…
            </div>
          )}

          {reportError && !reportLoading && (
            <div className="p-10 text-center text-[12px] text-ui-err-text">
              Couldn&apos;t load the daily report. {reportError.message}
              <button
                type="button"
                onClick={loadReport}
                className="ml-3 rounded-lg border border-ui-line-strong bg-ui-surface px-3 py-1.5 text-[11px] font-medium text-ui-ink-2 transition hover:bg-ui-surface-2"
              >
                Retry
              </button>
            </div>
          )}

          {report && !reportLoading && !reportError && (
            report.periods.length === 0 ? (
              <div className="p-10 text-center text-[12px] text-ui-faint">
                No attendance sessions were generated for this date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full">
                  <thead>
                    <tr className="border-b border-ui-line-soft bg-ui-surface-2">
                      <th className="w-32 border-r border-ui-line-soft px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-ui-muted">
                        Class
                      </th>

                      {report.periods.map((period) => (
                        <th
                          key={period.id}
                          className="border-r border-ui-line-soft px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-ui-muted"
                        >
                          P{period.periodIndex}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {report.standards.map((row) => (
                      <tr
                        key={row.standard.id}
                        className="border-b border-ui-line-soft last:border-0"
                      >
                        <td className="border-r border-ui-line-soft px-4 py-4 text-[12px] font-medium text-ui-ink">
                          {row.standard.name}
                          <span className="mt-0.5 block text-[10px] font-normal text-ui-faint">
                            {row.totalStudents} students
                          </span>
                        </td>

                        {row.cells.map((cell) => {
                          const status = cellStatus(cell);
                          const clickable = cell.hasSession;
                          const cellClass =
                            cellStyles[status] || cellStyles.NOT_GENERATED;

                          return (
                            <td
                              key={cell.periodId}
                              className="border-r border-ui-line-soft p-1.5"
                            >
                              <button
                                type="button"
                                disabled={!clickable}
                                onClick={() =>
                                  clickable && setSelectedSessionId(cell.sessionId)
                                }
                                className={`min-h-24 w-full rounded-lg border p-3 text-left transition ${cellClass}`}
                              >
                                <StatusBadge status={status} />

                                {clickable ? (
                                  <>
                                    <p className="mt-2 truncate text-[11px] text-ui-ink-3">
                                      {cell.subject.name} · {cell.staff.name}
                                    </p>
                                    <p className="mt-1 text-[10px] text-ui-muted">
                                      {cellDescription(cell, status)}
                                    </p>
                                  </>
                                ) : (
                                  <p className="mt-2 text-[11px] text-ui-faint">
                                    No attendance action
                                  </p>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {report && !reportLoading && !reportError && (
            <div className="flex flex-wrap gap-6 border-t border-ui-line-soft bg-ui-surface-2 px-5 py-3 text-[11px] text-ui-muted">
              <span>{report.summary.totalSessions} sessions today</span>
              <span>{report.summary.markedSessions} marked</span>
              <span>{report.summary.pendingSessions} pending</span>
              <span>
                {report.summary.totalPresent} present · {report.summary.totalAbsent} absent
              </span>
            </div>
          )}
        </section>

        {/* Lower dashboard sections */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card title="Unmarked sessions">
            {unmarkedLoading && (
              <p className="py-3 text-[12px] text-ui-faint">Loading…</p>
            )}

            {unmarkedError && !unmarkedLoading && (
              <p className="py-3 text-[12px] text-ui-err-text">
                Couldn&apos;t load unmarked sessions.
              </p>
            )}

            {unmarked && !unmarkedLoading && !unmarkedError && (
              unmarked.sessions.length === 0 ? (
                <p className="py-3 text-[12px] text-ui-faint">
                  No unmarked sessions in the last 14 days.
                </p>
              ) : (
                <div className="divide-y divide-ui-line-soft">
                  {unmarked.sessions.map((item) => (
                    <div
                      key={item.sessionId}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div>
                        <p className="text-[12px] text-ui-ink">
                          P{item.period.periodIndex} · {item.standard.name} · {item.subject.name}
                        </p>
                        <p className="mt-1 text-[10px] text-ui-faint">
                          {dateOnly(item.attendanceDate)} · {item.staff.name}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedSessionId(item.sessionId)}
                        className="rounded-lg border border-ui-line-strong bg-ui-surface px-3 py-2 text-[11px] font-medium text-ui-ink-2 transition hover:bg-ui-surface-2"
                      >
                        Mark
                      </button>
                    </div>
                  ))}
                </div>
              )
            )}
          </Card>

          <Card title="Reports">
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href="/reports"
                className="rounded-lg border border-ui-line bg-ui-surface p-5 text-left transition hover:border-ui-line-hover hover:bg-ui-surface-3"
              >
                <b className="text-[12px] text-ui-ink">By student</b>
                <p className="mt-1 text-[11px] text-ui-muted">
                  Student attendance history
                </p>
              </a>

              <a
                href="/reports"
                className="rounded-lg border border-ui-line bg-ui-surface p-5 text-left transition hover:border-ui-line-hover hover:bg-ui-surface-3"
              >
                <b className="text-[12px] text-ui-ink">By subject</b>
                <p className="mt-1 text-[11px] text-ui-muted">
                  Subject attendance history
                </p>
              </a>
            </div>
          </Card>

          <Card title="Staff leave">
            {staffLeaves.status === "loading" && (
              <p className="text-[12px] text-ui-faint">Loading…</p>
            )}
            {staffLeaves.status === "unavailable" && (
              <p className="text-[12px] text-ui-faint">
                Staff leave isn&apos;t available yet — this module is coming soon.
              </p>
            )}
            {staffLeaves.status === "ready" && staffLeaves.items.length === 0 && (
              <p className="text-[12px] text-ui-faint">No staff leave requests.</p>
            )}
          </Card>

          <Card title="Period substitutions">
            {substitutions.status === "loading" && (
              <p className="text-[12px] text-ui-faint">Loading…</p>
            )}
            {substitutions.status === "unavailable" && (
              <p className="text-[12px] text-ui-faint">
                Substitutions aren&apos;t available yet — this module is coming soon.
              </p>
            )}
            {substitutions.status === "ready" && substitutions.items.length === 0 && (
              <p className="text-[12px] text-ui-faint">No period substitutions.</p>
            )}
          </Card>
        </div>
      </div>

      {selectedSessionId && (
        <AttendanceSessionModal
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
          onMarked={() => {
            // Optimistic flip so the cell updates instantly.
            setReport((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                standards: prev.standards.map((row) => ({
                  ...row,
                  cells: row.cells.map((cell) =>
                    cell.sessionId === selectedSessionId
                      ? { ...cell, sessionStatus: "MARKED" }
                      : cell
                  ),
                })),
              };
            });

            // Then reconcile with the server in the background.
            loadReport();
            if (report?.academicYear?.id) loadUnmarked(report.academicYear.id);
          }}
        />
      )}
    </div>
  );
}

function Card({ title, badge, children }) {
  return (
    <section className="rounded-xl border border-ui-line bg-ui-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-ui-ink">{title}</h2>

        {badge && (
          <span className="rounded-full border border-ui-line-2 bg-ui-chip px-2 py-1 text-[10px] font-bold text-ui-ink-3">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}