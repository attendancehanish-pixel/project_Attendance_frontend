import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { academicYearApi, attendanceSessionApi } from "../api/attendance-session.api";
import { dateOnly } from "../../../shared/utils/format";

const RANGE_PRESETS = [
  { id: "today", label: "Today", days: 0 },
  { id: "week", label: "Next 7 days", days: 6 },
  { id: "fortnight", label: "Next 14 days", days: 13 },
  { id: "month", label: "Next 30 days", days: 29 },
];

const STATUS_OPTIONS = [
  { id: "", label: "All statuses" },
  { id: "PENDING", label: "Pending" },
  { id: "MARKED", label: "Marked" },
  { id: "STAFF_LEAVE", label: "Staff leave" },
];

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

export default function AttendanceSessionList() {
  const [years, setYears] = useState(null);
  const [yearsError, setYearsError] = useState(null);
  const [academicYearId, setAcademicYearId] = useState("");

  const [preset, setPreset] = useState("week");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(addDaysISO(todayISO(), 6));
  const [status, setStatus] = useState("");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [openDate, setOpenDate] = useState(null); // date string or null
  const [dayFilter, setDayFilter] = useState(""); // client-side class filter inside modal

  // Load academic years once.
  useEffect(() => {
    (async () => {
      try {
        const response = await academicYearApi.list();
        const list = response.data || [];
        setYears(list);
        const active = list.find((y) => y.status === "ACTIVE") || list[0];
        if (active) setAcademicYearId(active.id);
      } catch (e) {
        setYearsError(e);
      }
    })();
  }, []);

  // When a preset changes, recompute from/to.
  useEffect(() => {
    const found = RANGE_PRESETS.find((p) => p.id === preset);
    if (!found) return;
    const start = todayISO();
    setFrom(start);
    setTo(addDaysISO(start, found.days));
  }, [preset]);

  const rangeError = useMemo(() => {
    if (!from || !to) return "Pick both a start and end date.";
    if (to < from) return '"To" must be on or after "from".';
    const count =
      Math.round(
        (new Date(`${to}T00:00:00`) - new Date(`${from}T00:00:00`)) / 86400000
      ) + 1;
    if (count > 92) return `That's ${count} days — list at most 92 at a time.`;
    return null;
  }, [from, to]);

  async function fetchSessions() {
    if (!academicYearId || rangeError) return;
    setLoading(true);
    setError(null);
    try {
      const response = await attendanceSessionApi.list(academicYearId, {
        from,
        to,
        status: status || undefined,
      });
      setData(response.data);
    } catch (e) {
      setError(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (academicYearId && !rangeError) fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYearId]);

  const openDay = useMemo(() => {
    if (!openDate || !data) return null;
    return data.days.find((d) => d.date === openDate) || null;
  }, [openDate, data]);

  return (
  <div className="min-h-screen bg-[#f5f7fb] text-[#172033]">
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#7a8497]">
            Admin
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">
            Generated Attendance Sessions
          </h1>
          <p className="mt-2 max-w-2xl text-[13px] text-[#667085]">
            Browse the pending and marked sessions that have been generated from the
            timetable. Click a date to see the classes and periods for that day.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/attendance/generate"
            className="rounded-lg border border-[#172033] bg-[#172033] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#273247]"
          >
            <p className="text-[12px] font-semibold text-white">Generate sessions</p>
          </Link>
          <Link
            to="/attendance"
            className="rounded-lg border border-[#d8dee8] bg-white px-4 py-2 text-[12px] font-medium text-[#344054] transition hover:bg-[#f8fafc]"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4 rounded-xl border border-[#e8ebf1] bg-white p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-[11px] font-medium text-[#475467]">
              Academic year
            </label>
            {yearsError && (
              <p className="text-[12px] text-[#b42318]">Couldn't load academic years.</p>
            )}
            {!yearsError && (
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                className="w-full rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
              >
                {!years && <option value="">Loading…</option>}
                {years?.length === 0 && <option value="">No academic years</option>}
                {years?.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.status === "ACTIVE" ? "(active)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-medium text-[#475467]">
              Range
            </label>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="w-full rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
            >
              {RANGE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-medium text-[#475467]">From</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => {
                setPreset("custom");
                setFrom(e.target.value);
              }}
              className="w-full rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-medium text-[#475467]">To</label>
            <input
              type="date"
              value={to}
              min={from}
              onChange={(e) => {
                setPreset("custom");
                setTo(e.target.value);
              }}
              className="w-full rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[200px]">
            <label className="mb-2 block text-[11px] font-medium text-[#475467]">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            {data && (
              <p className="text-[11px] text-[#667085]">
                {data.totals.sessions} session(s) · {data.totals.pending} pending ·{" "}
                {data.totals.marked} marked · {data.totals.staffLeave} on leave
              </p>
            )}
            <button
              type="button"
              onClick={fetchSessions}
              disabled={loading || !academicYearId || !!rangeError}
              className="rounded-lg border border-[#172033] bg-[#172033] px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-[#273247] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {loading ? "Loading…" : "Apply"}
            </button>
          </div>
        </div>

        {rangeError && (
          <div className="rounded-lg border border-[#fedf89] bg-[#fffbeb] px-4 py-3 text-[12px] text-[#b54708]">
            {rangeError}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-[#fecdca] bg-[#fef3f2] px-6 py-4 text-[12px] text-[#b42318]">
          Couldn't load sessions. {error.message}
        </div>
      )}

      {/* List */}
      {!error && data && data.days.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#d8dee8] bg-white px-6 py-10 text-center text-[12px] text-[#98a2b3]">
          No sessions found for this range. Try generating some from the{" "}
          <Link to="/attendance/sessions/generate" className="text-[#344054] underline">
            generate page
          </Link>
          .
        </div>
      )}

      {!error && data && data.days.length > 0 && (
        <div className="space-y-3">
          {data.days.map((day) => (
            <DateRow key={day.date} day={day} onOpen={() => setOpenDate(day.date)} />
          ))}
        </div>
      )}
    </div>

    {/* Modal */}
    {openDay && (
      <DayModal
        day={openDay}
        classFilter={dayFilter}
        onClassFilter={setDayFilter}
        onClose={() => {
          setOpenDate(null);
          setDayFilter("");
        }}
      />
    )}
  </div>
);
}
function DateRow({ day, onOpen }) {
  const weekday = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
  });

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center justify-between rounded-xl border border-[#e8ebf1] bg-white px-5 py-4 text-left transition hover:border-[#cfd6e1] hover:bg-[#fbfcfe]"
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8497]">
          {weekday}
        </p>
        <p className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[#172033]">
          {dateOnly(day.date)}
        </p>
        <p className="mt-1 text-[11px] text-[#98a2b3]">
          {day.classes.length} class(es)
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Badge tone="slate" label={`${day.totals.sessions} total`} />
        <Badge tone="amber" label={`${day.totals.pending} pending`} />
        <Badge tone="emerald" label={`${day.totals.marked} marked`} />
        {day.totals.staffLeave > 0 && (
          <Badge tone="rose" label={`${day.totals.staffLeave} on leave`} />
        )}
        <span className="ml-2 text-[#98a2b3] transition group-hover:translate-x-0.5 group-hover:text-[#344054]">
          →
        </span>
      </div>
    </button>
  );
}

function DayModal({ day, classFilter, onClassFilter, onClose }) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const classes = useMemo(() => {
    if (!classFilter) return day.classes;
    return day.classes.filter((c) => c.standardId === classFilter);
  }, [day.classes, classFilter]);

  const weekday = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
  });

  return (
    <div
      className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[rgba(15,23,42,0.4)] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mt-8 w-full max-w-4xl rounded-xl border border-[#e8ebf1] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#eef1f5] px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7a8497]">
              {weekday}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#172033]">
              {dateOnly(day.date)}
            </h2>
            <p className="mt-1 text-[11px] text-[#667085]">
              {day.totals.sessions} session(s) · {day.totals.pending} pending ·{" "}
              {day.totals.marked} marked
              {day.totals.staffLeave > 0 && ` · ${day.totals.staffLeave} on leave`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={classFilter}
              onChange={(e) => onClassFilter(e.target.value)}
              className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[11px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
            >
              <option value="">All classes</option>
              {day.classes.map((c) => (
                <option key={c.standardId} value={c.standardId}>
                  {c.standardCode} — {c.standardName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[12px] font-medium text-[#344054] transition hover:bg-[#f8fafc]"
            >
              Close
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          {classes.length === 0 && (
            <p className="py-8 text-center text-[12px] text-[#98a2b3]">
              No classes match this filter.
            </p>
          )}

          {classes.map((cls) => (
            <ClassBlock key={cls.standardId} cls={cls} />
          ))}
        </div>
      </div>
    </div>
  );
}

const TONE_CLASSES = {
  slate: "border-[#e4e7ec] bg-[#f2f4f7] text-[#475467]",
  amber: "border-[#fedf89] bg-[#fffaeb] text-[#b54708]",
  emerald: "border-[#abefc6] bg-[#ecfdf3] text-[#027a48]",
  rose: "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
};

function Badge({ tone = "slate", label }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}

function ClassBlock({ cls }) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#e8ebf1] bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f5] bg-[#f8fafc] px-4 py-3">
        <div>
          <p className="text-[12px] font-semibold text-[#172033]">
            {cls.standardCode} <span className="text-[#98a2b3]">·</span>{" "}
            {cls.standardName}
          </p>
          <p className="mt-0.5 text-[10px] text-[#98a2b3]">
            {cls.periods.length} period(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="slate" label={`${cls.totals.sessions} total`} />
          <Badge tone="amber" label={`${cls.totals.pending} pending`} />
          <Badge tone="emerald" label={`${cls.totals.marked} marked`} />
          {cls.totals.staffLeave > 0 && (
            <Badge tone="rose" label={`${cls.totals.staffLeave} on leave`} />
          )}
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left text-[12px]">
          <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-[0.07em] text-[#667085]">
            <tr>
              <th className="px-4 py-2 font-bold">Period</th>
              <th className="px-4 py-2 font-bold">Time</th>
              <th className="px-4 py-2 font-bold">Subject</th>
              <th className="px-4 py-2 font-bold">Staff</th>
              <th className="px-4 py-2 font-bold">Source</th>
              <th className="px-4 py-2 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eef1f5]">
            {cls.periods.map((p) => (
              <tr key={p.sessionId} className="transition hover:bg-[#fbfcfe]">
                <td className="px-4 py-2 font-medium text-[#475467]">P{p.periodIndex}</td>
                <td className="px-4 py-2 text-[#667085]">
                  {p.startTime}–{p.endTime}
                </td>
                <td className="px-4 py-2">
                  <p className="text-[#172033]">{p.subjectName}</p>
                  <p className="text-[10px] text-[#98a2b3]">{p.subjectCode}</p>
                </td>
                <td className="px-4 py-2">
                  <p className="text-[#172033]">{p.staffName || "—"}</p>
                  <p className="text-[10px] text-[#98a2b3]">{p.employeeCode}</p>
                </td>
                <td className="px-4 py-2 text-[10px] text-[#667085]">
                  {p.source === "DATE_SPECIFIC_TIMETABLE" ? "Date-specific" : "Timetable"}
                </td>
                <td className="px-4 py-2">
                  <SessionStatusBadge status={p.sessionStatus} markedCount={p.markedCount} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SessionStatusBadge({ status, markedCount }) {
  if (status === "MARKED" || markedCount > 0) {
    return <Badge tone="emerald" label={`Marked (${markedCount})`} />;
  }
  if (status === "STAFF_LEAVE") return <Badge tone="rose" label="Staff leave" />;
  if (status === "PENDING") return <Badge tone="amber" label="Pending" />;
  return <Badge tone="slate" label={status} />;
}