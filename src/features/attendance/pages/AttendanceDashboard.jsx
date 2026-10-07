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
  MARKED: "cursor-pointer border-[#abefc6] bg-[#ecfdf3] hover:border-[#75e0a7] hover:bg-[#d1fadf]",
  SUBMITTED: "cursor-pointer border-[#abefc6] bg-[#ecfdf3] hover:border-[#75e0a7] hover:bg-[#d1fadf]",
  PENDING: "cursor-pointer border-[#fecdca] bg-[#fef3f2] hover:border-[#fda29b] hover:bg-[#fee4e2]",
  CLOSED: "cursor-pointer border-[#e4e7ec] bg-[#f2f4f7] hover:border-[#d0d5dd] hover:bg-[#eaecf0]",
  CANCELLED: "cursor-pointer border-[#fecdca] bg-[#fef3f2] hover:border-[#fda29b] hover:bg-[#fee4e2]",
  STAFF_LEAVE: "cursor-pointer border-[#e9d7fe] bg-[#f4ebff] hover:border-[#d6bbfb] hover:bg-[#ebd7ff]",
  NOT_GENERATED: "border-[#e8ebf1] bg-[#f8fafc]",
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
    <div className="min-h-screen bg-[#f5f7fb] text-[#172033]">
      <div className="mx-auto px-4 py-6 md:px-6">
        <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#7a8497]">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">
              Attendance Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/attendance/generate"
              className="rounded-lg border border-[#d8dee8] bg-white px-4 py-2.5 text-[12px] font-medium text-[#344054] transition hover:bg-[#f8fafc]"
            >
              Generate sessions
            </Link>

            <button
              type="button"
              onClick={() => setDate(todayISO())}
              className="rounded-lg border border-[#d8dee8] bg-white px-4 py-2.5 text-[12px] font-medium text-[#344054] transition hover:bg-[#f8fafc]"
            >
              Today
            </button>

            <input
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-[#d8dee8] bg-white px-4 py-2.5 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
            />
          </div>
        </header>

        {/* Class × period attendance session matrix */}
        <section className="overflow-hidden rounded-xl border border-[#e8ebf1] bg-white">
          <div className="border-b border-[#eef1f5] px-5 py-4">
            <h2 className="text-[13px] font-semibold text-[#172033]">
              Daily attendance sessions
            </h2>
            <p className="mt-1 text-[11px] text-[#667085]">
              Click a generated attendance session to view student details.
            </p>
          </div>

          {reportLoading && (
            <div className="p-10 text-center text-[12px] text-[#98a2b3]">
              Loading attendance sessions…
            </div>
          )}

          {reportError && !reportLoading && (
            <div className="p-10 text-center text-[12px] text-[#b42318]">
              Couldn&apos;t load the daily report. {reportError.message}
              <button
                type="button"
                onClick={loadReport}
                className="ml-3 rounded-lg border border-[#d8dee8] bg-white px-3 py-1.5 text-[11px] font-medium text-[#344054] transition hover:bg-[#f8fafc]"
              >
                Retry
              </button>
            </div>
          )}

          {report && !reportLoading && !reportError && (
            report.periods.length === 0 ? (
              <div className="p-10 text-center text-[12px] text-[#98a2b3]">
                No attendance sessions were generated for this date.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[900px] w-full">
                  <thead>
                    <tr className="border-b border-[#eef1f5] bg-[#f8fafc]">
                      <th className="w-32 border-r border-[#eef1f5] px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-[#667085]">
                        Class
                      </th>

                      {report.periods.map((period) => (
                        <th
                          key={period.id}
                          className="border-r border-[#eef1f5] px-3 py-3 text-left text-[10px] font-bold uppercase tracking-[0.07em] text-[#667085]"
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
                        className="border-b border-[#eef1f5] last:border-0"
                      >
                        <td className="border-r border-[#eef1f5] px-4 py-4 text-[12px] font-medium text-[#172033]">
                          {row.standard.name}
                          <span className="mt-0.5 block text-[10px] font-normal text-[#98a2b3]">
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
                              className="border-r border-[#eef1f5] p-1.5"
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
                                    <p className="mt-2 truncate text-[11px] text-[#475467]">
                                      {cell.subject.name} · {cell.staff.name}
                                    </p>
                                    <p className="mt-1 text-[10px] text-[#667085]">
                                      {cellDescription(cell, status)}
                                    </p>
                                  </>
                                ) : (
                                  <p className="mt-2 text-[11px] text-[#98a2b3]">
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
            <div className="flex flex-wrap gap-6 border-t border-[#eef1f5] bg-[#f8fafc] px-5 py-3 text-[11px] text-[#667085]">
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
              <p className="py-3 text-[12px] text-[#98a2b3]">Loading…</p>
            )}

            {unmarkedError && !unmarkedLoading && (
              <p className="py-3 text-[12px] text-[#b42318]">
                Couldn&apos;t load unmarked sessions.
              </p>
            )}

            {unmarked && !unmarkedLoading && !unmarkedError && (
              unmarked.sessions.length === 0 ? (
                <p className="py-3 text-[12px] text-[#98a2b3]">
                  No unmarked sessions in the last 14 days.
                </p>
              ) : (
                <div className="divide-y divide-[#eef1f5]">
                  {unmarked.sessions.map((item) => (
                    <div
                      key={item.sessionId}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div>
                        <p className="text-[12px] text-[#172033]">
                          P{item.period.periodIndex} · {item.standard.name} · {item.subject.name}
                        </p>
                        <p className="mt-1 text-[10px] text-[#98a2b3]">
                          {dateOnly(item.attendanceDate)} · {item.staff.name}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedSessionId(item.sessionId)}
                        className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[11px] font-medium text-[#344054] transition hover:bg-[#f8fafc]"
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
                className="rounded-lg border border-[#e8ebf1] bg-white p-5 text-left transition hover:border-[#cfd6e1] hover:bg-[#fbfcfe]"
              >
                <b className="text-[12px] text-[#172033]">By student</b>
                <p className="mt-1 text-[11px] text-[#667085]">
                  Student attendance history
                </p>
              </a>

              <a
                href="/reports"
                className="rounded-lg border border-[#e8ebf1] bg-white p-5 text-left transition hover:border-[#cfd6e1] hover:bg-[#fbfcfe]"
              >
                <b className="text-[12px] text-[#172033]">By subject</b>
                <p className="mt-1 text-[11px] text-[#667085]">
                  Subject attendance history
                </p>
              </a>
            </div>
          </Card>

          <Card title="Staff leave">
            {staffLeaves.status === "loading" && (
              <p className="text-[12px] text-[#98a2b3]">Loading…</p>
            )}
            {staffLeaves.status === "unavailable" && (
              <p className="text-[12px] text-[#98a2b3]">
                Staff leave isn&apos;t available yet — this module is coming soon.
              </p>
            )}
            {staffLeaves.status === "ready" && staffLeaves.items.length === 0 && (
              <p className="text-[12px] text-[#98a2b3]">No staff leave requests.</p>
            )}
          </Card>

          <Card title="Period substitutions">
            {substitutions.status === "loading" && (
              <p className="text-[12px] text-[#98a2b3]">Loading…</p>
            )}
            {substitutions.status === "unavailable" && (
              <p className="text-[12px] text-[#98a2b3]">
                Substitutions aren&apos;t available yet — this module is coming soon.
              </p>
            )}
            {substitutions.status === "ready" && substitutions.items.length === 0 && (
              <p className="text-[12px] text-[#98a2b3]">No period substitutions.</p>
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
    <section className="rounded-xl border border-[#e8ebf1] bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-[#172033]">{title}</h2>

        {badge && (
          <span className="rounded-full border border-[#e4e7ec] bg-[#f2f4f7] px-2 py-1 text-[10px] font-bold text-[#475467]">
            {badge}
          </span>
        )}
      </div>

      <div className="mt-4">{children}</div>
    </section>
  );
}