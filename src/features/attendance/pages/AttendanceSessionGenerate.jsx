import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { academicYearApi, attendanceSessionApi } from "../api/attendance-session.api";
import { dateOnly } from "../../../shared/utils/format";

const MAX_RANGE_DAYS = 31;

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

function currentMonthValue() {
  return todayISO().slice(0, 7); // YYYY-MM
}

// "YYYY-MM" -> { from: "YYYY-MM-01", to: "YYYY-MM-<lastDay>" }
function monthToRange(monthValue) {
  const [year, month] = monthValue.split("-").map(Number);
  const from = `${monthValue}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${monthValue}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

function dayCount(from, to) {
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  return Math.round((end - start) / 86400000) + 1;
}

const MODES = [
  { id: "day", label: "Single day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "range", label: "Custom range" },
];

export default function AttendanceSessionGenerate() {
  const [years, setYears] = useState(null);
  const [yearsError, setYearsError] = useState(null);
  const [academicYearId, setAcademicYearId] = useState("");

  const [mode, setMode] = useState("week");
  const [singleDate, setSingleDate] = useState(todayISO());
  const [weekStart, setWeekStart] = useState(todayISO());
  const [monthValue, setMonthValue] = useState(currentMonthValue());
  const [rangeFrom, setRangeFrom] = useState(todayISO());
  const [rangeTo, setRangeTo] = useState(addDaysISO(todayISO(), 6));

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [showDayBreakdown, setShowDayBreakdown] = useState(false);

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

  // Resolve the current form into a { from, to } range (or a single date),
  // and validate it against the backend's 31-day cap before submitting.
  const plan = useMemo(() => {
    if (mode === "day") {
      return { kind: "day", date: singleDate };
    }
    if (mode === "week") {
      return { kind: "range", from: weekStart, to: addDaysISO(weekStart, 6) };
    }
    if (mode === "month") {
      const { from, to } = monthToRange(monthValue);
      return { kind: "range", from, to };
    }
    return { kind: "range", from: rangeFrom, to: rangeTo };
  }, [mode, singleDate, weekStart, monthValue, rangeFrom, rangeTo]);

  const planError = useMemo(() => {
    if (plan.kind === "day") return null;
    if (!plan.from || !plan.to) return "Pick both a start and end date.";
    if (plan.to < plan.from) return '"To" must be on or after "from".';
    const count = dayCount(plan.from, plan.to);
    if (count > MAX_RANGE_DAYS) {
      return `That's ${count} days — generate at most ${MAX_RANGE_DAYS} days at a time.`;
    }
    return null;
  }, [plan]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!academicYearId || planError) return;

    setSubmitting(true);
    setSubmitError(null);
    setResult(null);
    setShowDayBreakdown(false);

    try {
      const response =
        plan.kind === "day"
          ? await attendanceSessionApi.generateForDate(academicYearId, plan.date)
          : await attendanceSessionApi.generateForRange(academicYearId, plan.from, plan.to);
      setResult(response.data);
    } catch (e) {
      setSubmitError(e);
    } finally {
      setSubmitting(false);
    }
  }

  const rangeDays = plan.kind === "range" && plan.from && plan.to && !planError
    ? dayCount(plan.from, plan.to)
    : null;

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-[#172033]">
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#7a8497]">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-[#172033]">
              Generate Attendance Sessions
            </h1>
            <p className="mt-2 max-w-xl text-[13px] text-[#667085]">
              Creates pending attendance sessions from the timetable ahead of time, so staff can
              mark them and they show up on the dashboard. Running this again for the same dates
              is safe — existing sessions are left untouched.
            </p>
          </div>

          <Link
            to="/attendance"
            className="shrink-0 rounded-lg border border-[#d8dee8] bg-white px-4 py-2 text-[12px] font-medium text-[#344054] transition hover:bg-[#f8fafc]"
          >
            ← Back to dashboard
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-[#e8ebf1] bg-white p-6"
        >
          {/* Academic year */}
          <div>
            <label className="mb-2 block text-[11px] font-medium text-[#475467]">
              Academic year
            </label>
            {yearsError && (
              <p className="text-[12px] text-[#b42318]">Couldn&apos;t load academic years.</p>
            )}
            {!yearsError && (
              <select
                value={academicYearId}
                onChange={(e) => setAcademicYearId(e.target.value)}
                className="w-full rounded-lg border border-[#d8dee8] bg-white px-4 py-3 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
              >
                {!years && <option value="">Loading…</option>}
                {years?.length === 0 && <option value="">No academic years found</option>}
                {years?.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.status === "ACTIVE" ? "(active)" : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Mode */}
          <div>
            <label className="mb-2 block text-[11px] font-medium text-[#475467]">
              Generate for
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MODES.map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`rounded-lg border px-4 py-3 text-[12px] font-medium transition ${mode === m.id
                      ? "border-[#172033] bg-[#172033] text-white"
                      : "border-[#d8dee8] bg-white text-[#344054] hover:bg-[#f8fafc]"
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date inputs, depending on mode */}
          {mode === "day" && (
            <div>
              <label className="mb-2 block text-[11px] font-medium text-[#475467]">Date</label>
              <input
                type="date"
                value={singleDate}
                onChange={(e) => setSingleDate(e.target.value)}
                className="rounded-lg border border-[#d8dee8] bg-white px-4 py-3 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
              />
            </div>
          )}

          {mode === "week" && (
            <div>
              <label className="mb-2 block text-[11px] font-medium text-[#475467]">
                Week starting
              </label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="rounded-lg border border-[#d8dee8] bg-white px-4 py-3 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
              />
              <p className="mt-2 text-[10px] text-[#98a2b3]">
                Generates 7 days, {dateOnly(weekStart)} → {dateOnly(addDaysISO(weekStart, 6))}.
              </p>
            </div>
          )}

          {mode === "month" && (
            <div>
              <label className="mb-2 block text-[11px] font-medium text-[#475467]">Month</label>
              <input
                type="month"
                value={monthValue}
                onChange={(e) => setMonthValue(e.target.value)}
                className="rounded-lg border border-[#d8dee8] bg-white px-4 py-3 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
              />
              <p className="mt-2 text-[10px] text-[#98a2b3]">
                Generates {dateOnly(monthToRange(monthValue).from)} →{" "}
                {dateOnly(monthToRange(monthValue).to)}.
              </p>
            </div>
          )}

          {mode === "range" && (
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="mb-2 block text-[11px] font-medium text-[#475467]">From</label>
                <input
                  type="date"
                  value={rangeFrom}
                  max={rangeTo}
                  onChange={(e) => setRangeFrom(e.target.value)}
                  className="rounded-lg border border-[#d8dee8] bg-white px-4 py-3 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-[11px] font-medium text-[#475467]">To</label>
                <input
                  type="date"
                  value={rangeTo}
                  min={rangeFrom}
                  onChange={(e) => setRangeTo(e.target.value)}
                  className="rounded-lg border border-[#d8dee8] bg-white px-4 py-3 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] focus:shadow-[0_0_0_3px_rgba(16,24,40,0.06)]"
                />
              </div>
              {rangeDays && (
                <p className="pb-3 text-[10px] text-[#98a2b3]">{rangeDays} day(s)</p>
              )}
            </div>
          )}

          {planError && (
            <div className="rounded-lg border border-[#fedf89] bg-[#fffbeb] px-4 py-3 text-[12px] text-[#b54708]">
              {planError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !academicYearId || !!planError}
              className="rounded-lg border border-[#172033] bg-[#172033] px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-[#273247] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {submitting ? "Generating…" : "Generate sessions"}
            </button>
          </div>
        </form>

        {submitError && (
          <div className="mt-6 rounded-xl border border-[#fecdca] bg-[#fef3f2] px-6 py-4 text-[12px] text-[#b42318]">
            Couldn&apos;t generate sessions. {submitError.message}
          </div>
        )}

        {result && (
          <div className="mt-6 rounded-xl border border-[#abefc6] bg-[#ecfdf3] p-6">
            <h2 className="text-[12px] font-semibold text-[#027a48]">Sessions generated</h2>

            {"totals" in result ? (
              <>
                <p className="mt-1 text-[11px] text-[#667085]">
                  {dateOnly(result.from)} → {dateOnly(result.to)}
                </p>
                <SummaryGrid totals={result.totals} />

                <button
                  type="button"
                  onClick={() => setShowDayBreakdown((s) => !s)}
                  className="mt-4 text-[11px] font-medium text-[#344054] underline hover:text-[#111827]"
                >
                  {showDayBreakdown ? "Hide" : "Show"} day-by-day breakdown
                </button>

                {showDayBreakdown && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-[#e8ebf1] bg-white">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#f8fafc] text-[#667085]">
                        <tr>
                          <th className="px-3 py-2 font-bold uppercase tracking-[0.07em] text-[10px]">
                            Date
                          </th>
                          <th className="px-3 py-2 font-bold uppercase tracking-[0.07em] text-[10px]">
                            Created
                          </th>
                          <th className="px-3 py-2 font-bold uppercase tracking-[0.07em] text-[10px]">
                            Skipped
                          </th>
                          <th className="px-3 py-2 font-bold uppercase tracking-[0.07em] text-[10px]">
                            Staff leave
                          </th>
                          <th className="px-3 py-2 font-bold uppercase tracking-[0.07em] text-[10px]">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#eef1f5]">
                        {result.days.map((day) => (
                          <tr key={day.date} className="transition hover:bg-[#fbfcfe]">
                            <td className="px-3 py-2 text-[#344054]">{dateOnly(day.date)}</td>
                            <td className="px-3 py-2 text-[#344054]">{day.created}</td>
                            <td className="px-3 py-2 text-[#344054]">{day.skipped}</td>
                            <td className="px-3 py-2 text-[#344054]">{day.staffLeave || 0}</td>
                            <td className="px-3 py-2 text-[#98a2b3]">
                              {day.reason ? day.reason.replaceAll("_", " ").toLowerCase() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="mt-1 text-[11px] text-[#667085]">{dateOnly(result.date)}</p>
                <SummaryGrid totals={result} />
                {result.reason && (
                  <p className="mt-3 text-[10px] text-[#98a2b3]">
                    Reason: {result.reason.replaceAll("_", " ").toLowerCase()}
                  </p>
                )}
              </>
            )}

            <div className="mt-5">
              <Link
                to="/attendance"
                className="text-[12px] font-medium text-[#027a48] hover:text-[#05603a]"
              >
                View on the attendance dashboard →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function SummaryGrid({ totals }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Stat label="Created" value={totals.created} />
      <Stat label="Skipped" value={totals.skipped} />
      <Stat label="Staff leave" value={totals.staffLeave || 0} />
      <Stat label="Exception skipped" value={totals.exceptionSkipped || 0} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e8ebf1] bg-white p-3">
      <p className="text-[10px] font-medium text-[#667085]">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#172033]">
        {value ?? 0}
      </p>
    </div>
  );
}