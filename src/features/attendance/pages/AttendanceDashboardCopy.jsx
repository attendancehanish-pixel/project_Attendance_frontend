import { useEffect, useState } from "react";
import { get, post } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import DataTable from "../../../shared/components/DataTable";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";
import { dateOnly, humanStatus, statusClass } from "../../../shared/utils/format";

const WEEKDAY_LABEL = new Intl.DateTimeFormat("en-IN", { weekday: "short" });

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

export default function AttendanceDashboard() {
  const [date, setDate] = useState(todayISO());
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  const [generating, setGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState(null);

  const [unmarkedFrom, setUnmarkedFrom] = useState(addDaysISO(todayISO(), -7));
  const [unmarkedTo, setUnmarkedTo] = useState(todayISO());
  const [unmarked, setUnmarked] = useState(null);
  const [unmarkedError, setUnmarkedError] = useState(null);
  const [unmarkedLoading, setUnmarkedLoading] = useState(false);

  async function load() {
    try {
      setError(null);
      setReport(null);
      const response = await get(`/reports/attendance/daily?date=${date}`);
      setReport(response.data);
    } catch (e) {
      setError(e);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function openCell(cell) {
    if (!cell.hasSession) return;
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const response = await get(`/reports/attendance/sessions/${cell.sessionId}`);
      setDetail(response.data);
    } catch (e) {
      setDetailError(e);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetail(null);
    setDetailError(null);
  }

  async function loadUnmarked() {
    if (!report?.academicYear?.id) return;
    try {
      setUnmarkedError(null);
      setUnmarkedLoading(true);
      const response = await get(
        `/reports/attendance/unmarked?academicYearId=${report.academicYear.id}&from=${unmarkedFrom}&to=${unmarkedTo}`
      );
      setUnmarked(response.data);
    } catch (e) {
      setUnmarkedError(e);
    } finally {
      setUnmarkedLoading(false);
    }
  }

  useEffect(() => {
    if (report?.academicYear?.id) loadUnmarked();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report?.academicYear?.id]);

  async function generateNextWeek() {
    if (!report?.academicYear?.id) return;
    setGenerating(true);
    setGenerateMessage(null);
    try {
      const response = await post(
        `/attendance-sessions/academic-year/${report.academicYear.id}/generate-range`,
        { days: 7 }
      );
      const totals = response.data?.totals;
      setGenerateMessage(
        totals
          ? `Generated ${totals.created} new session(s) for the next 7 days (${totals.skipped} already existed or had no staff assigned).`
          : "Sessions generated for the next 7 days."
      );
      await load();
      await loadUnmarked();
    } catch (e) {
      setGenerateMessage(`Failed: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  }

  if (!report && !error) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  const weekdayLabel = WEEKDAY_LABEL.format(new Date(`${date}T00:00:00`));
  const { summary, periods, standards } = report;

  return (
    <>
      <PageHeader
        title="Attendance Dashboard"
        description="Daily attendance across every class and period. Click a cell to see student-level detail."
      />

      <div className="daily-report-toolbar">
        <div className="daily-report-date">
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={(e) => setDate(e.target.value)}
          />
          <span className="daily-report-weekday">{weekdayLabel}</span>
        </div>
        <button className="button" onClick={() => setDate(todayISO())}>Today</button>
        <button className="button primary" disabled={generating} onClick={generateNextWeek}>
          {generating ? "Generating…" : "Generate next week's sessions"}
        </button>
      </div>

      {generateMessage && <div className="callout">{generateMessage}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <span>Sessions today</span>
          <strong>{summary.totalSessions}</strong>
          <small>Across all classes and periods</small>
        </div>
        <div className="stat-card">
          <span>Marked</span>
          <strong>{summary.markedSessions}</strong>
          <small>Attendance submitted</small>
        </div>
        <div className="stat-card">
          <span>Pending</span>
          <strong>{summary.pendingSessions}</strong>
          <small>Not yet marked by staff</small>
        </div>
        <div className="stat-card">
          <span>Absent (marked sessions)</span>
          <strong>{summary.totalAbsent}</strong>
          <small>{summary.totalPresent} present so far</small>
        </div>
      </div>

      {periods.length === 0 ? (
        <Empty>No attendance sessions were generated for this date.</Empty>
      ) : (
        <div className="daily-grid-wrap">
          <table className="daily-grid">
            <thead>
              <tr>
                <th>Class</th>
                {periods.map((p) => (
                  <th key={p.id}>
                    P{p.periodIndex}
                    {p.startTime && <span className="daily-report-weekday" style={{ display: "block", marginTop: 3 }}>{p.startTime}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standards.map((row) => (
                <tr key={row.standard.id}>
                  <td className="standard-cell">
                    {row.standard.name}
                    <span>{row.totalStudents} students</span>
                  </td>
                  {row.cells.map((cell) => (
                    <td key={cell.periodId} className="daily-cell">
                      {!cell.hasSession ? (
                        <span className="daily-cell-empty">—</span>
                      ) : (
                        <button
                          type="button"
                          className="daily-cell-btn"
                          onClick={() => openCell(cell)}
                        >
                          <div className="daily-cell-subject">{cell.subject.name}</div>
                          <div className="daily-cell-staff">{cell.staff.name}</div>
                          <div className="daily-cell-stats">
                            <span className="daily-cell-count">{cell.totalStudents} total</span>
                            {cell.sessionStatus === "PENDING" ? (
                              <span className="daily-cell-count pending">Pending</span>
                            ) : (
                              <span className="daily-cell-count absent">{cell.absentCount} absent</span>
                            )}
                          </div>
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section>
        <div className="table-headline">
          <div>
            <span className="eyebrow">Unmarked sessions</span>
            <h3>Find gaps across a date range</h3>
          </div>
          <div className="row-actions">
            <input type="date" value={unmarkedFrom} max={unmarkedTo} onChange={(e) => setUnmarkedFrom(e.target.value)} />
            <span className="muted">to</span>
            <input type="date" value={unmarkedTo} min={unmarkedFrom} onChange={(e) => setUnmarkedTo(e.target.value)} />
            <button className="button" disabled={unmarkedLoading} onClick={loadUnmarked}>
              {unmarkedLoading ? "Loading…" : "Search"}
            </button>
          </div>
        </div>

        {unmarkedError ? (
          <ErrorState error={unmarkedError} onRetry={loadUnmarked} />
        ) : (
          <DataTable
            empty="No unmarked sessions in this range — everything's been marked."
            columns={[
              { key: "date", label: "Date", render: (r) => dateOnly(r.attendanceDate) },
              { key: "standard", label: "Class", render: (r) => r.standard.name },
              { key: "period", label: "Period", render: (r) => `P${r.period.periodIndex}` },
              { key: "subject", label: "Subject", render: (r) => r.subject.name },
              { key: "staff", label: "Staff", render: (r) => r.staff.name },
            ]}
            rows={unmarked?.sessions || []}
          />
        )}
        {unmarked && unmarked.meta.total > (unmarked.sessions || []).length && (
          <p className="muted" style={{ marginTop: 8 }}>
            Showing {unmarked.sessions.length} of {unmarked.meta.total} unmarked sessions.
          </p>
        )}
      </section>

      {(detailLoading || detail || detailError) && (
        <div className="drawer-backdrop" onClick={closeDetail}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="eyebrow">Attendance report</span>
                <h3>{detail ? `${detail.session.standard.name} · Period ${detail.session.period.periodIndex}` : "Loading…"}</h3>
              </div>
              <button className="icon-button" onClick={closeDetail}>×</button>
            </div>

            {detailLoading && <Loading />}
            {detailError && <ErrorState error={detailError} />}

            {detail && (
              <>
                <div className="session-meta">
                  <span>{detail.session.subject.name}</span>
                  <span>Staff: {detail.session.staff.name}</span>
                  {detail.session.period.startTime && (
                    <span>{detail.session.period.startTime} – {detail.session.period.endTime}</span>
                  )}
                  <span className={`status-badge ${statusClass(detail.session.sessionStatus)}`}>
                    {humanStatus(detail.session.sessionStatus)}
                  </span>
                </div>

                <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3,1fr)", marginBottom: 6 }}>
                  <div className="stat-card">
                    <span>Present</span>
                    <strong>{detail.totals.presentCount}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Absent</span>
                    <strong>{detail.totals.absentCount}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Unmarked</span>
                    <strong>{detail.totals.unmarkedCount}</strong>
                  </div>
                </div>

                <div className="student-list">
                  {detail.students.map((s) => (
                    <div className="student-row" key={s.studentId}>
                      <div className="student-info">
                        <strong>{s.rollNo}. {s.name}</strong>
                        <span>{s.admissionNo}</span>
                      </div>
                      <div className="row-actions">
                        <span className={`status-badge ${statusClass(s.status)}`}>
                          {humanStatus(s.status)}
                        </span>
                        {s.status === "ABSENT" && (
                          <span
                            className="reason-icon"
                            title={[s.absenceType, s.remarks].filter(Boolean).join(" — ") || "No reason provided"}
                          >
                            i
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
