import { useEffect, useMemo, useState } from "react";
import {
  X,
  UserRound,
  CalendarX2,
  Clock3,
  CheckCircle2,
  BookOpen,
  BadgeCheck,
  Hourglass,
  Phone,
  GraduationCap,
} from "lucide-react";
import { staffStudentsApi } from "../api/staff-student.api";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const pad = (n) => String(n).padStart(2, "0");
const toYmd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const PRESETS = [
  { key: "all", label: "Whole year" },
  { key: "7", label: "Last 7 days" },
  { key: "30", label: "Last 30 days" },
  { key: "month", label: "This month" },
];

function presetRange(key) {
  const today = new Date();
  if (key === "7" || key === "30") {
    const from = new Date(today);
    from.setDate(today.getDate() - (Number(key) - 1));
    return { from: toYmd(from), to: toYmd(today) };
  }
  if (key === "month") {
    return { from: toYmd(new Date(today.getFullYear(), today.getMonth(), 1)), to: toYmd(today) };
  }
  return { from: "", to: "" };
}

const prettyDate = (ymd) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const prettyWeekday = (w) => (w ? w.charAt(0) + w.slice(1).toLowerCase() : "");

const prettyDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

const STATUS_STYLES = {
  ABSENT: "bg-red-500/10 text-red-300 border-red-500/30",
  LATE: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  EXCUSED: "bg-blue-500/10 text-blue-300 border-blue-500/30",
};

const StatusPill = ({ status }) => (
  <span
    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
      STATUS_STYLES[status] || "bg-slate-500/10 text-slate-300 border-slate-500/30"
    }`}
  >
    {status}
  </span>
);

const Tag = ({ icon: Icon, children, tone = "slate" }) => {
  const tones = {
    slate: "border-slate-700 text-slate-400",
    green: "border-emerald-500/30 text-emerald-300",
    amber: "border-amber-500/30 text-amber-300",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${tones[tone]}`}
    >
      {Icon && <Icon size={10} />}
      {children}
    </span>
  );
};

const Bar = ({ percent, tone = "bg-red-500/70" }) => (
  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
    <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(100, percent)}%` }} />
  </div>
);

const Skeleton = () => (
  <div className="animate-pulse space-y-3 p-5">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-16 rounded-xl bg-slate-800/60" />
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

const DAYS_PER_PAGE = 10;

export default function StudentAbsenceDrawer({ student, onClose }) {
  const [details, setDetails] = useState(student);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [preset, setPreset] = useState("all");
  const [range, setRange] = useState({ from: "", to: "" });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [tab, setTab] = useState("days");
  const [visibleDays, setVisibleDays] = useState(DAYS_PER_PAGE);

  // Full profile (class teacher, phone ...) - the list row only has basics.
  useEffect(() => {
    let cancelled = false;
    staffStudentsApi
      .getById(student.id)
      .then((d) => !cancelled && setDetails((prev) => ({ ...prev, ...d })))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [student.id]);

  // Absences reload whenever the date range changes.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    staffStudentsApi
      .getAbsences(student.id, range)
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setVisibleDays(DAYS_PER_PAGE);
        }
      })
      .catch((err) => !cancelled && setError(err?.message || "Failed to load absence details"))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [student.id, range.from, range.to]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const choosePreset = (key) => {
    setPreset(key);
    setRange(presetRange(key));
  };

  const setCustom = (field, value) => {
    setPreset("custom");
    setRange((r) => ({ ...r, [field]: value }));
  };

  // Day-wise list after applying the status chips.
  const days = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "ALL") return data.days;
    return data.days
      .map((d) => ({ ...d, periods: d.periods.filter((p) => p.status === statusFilter) }))
      .filter((d) => d.periods.length > 0);
  }, [data, statusFilter]);

  const s = data?.summary;
  const pct = s?.attendancePercent;
  const pctTone =
    pct == null ? "text-slate-400" : pct >= 90 ? "text-emerald-300" : pct >= 75 ? "text-amber-300" : "text-red-300";
  const pctBar = pct == null ? "bg-slate-600" : pct >= 90 ? "bg-emerald-500/70" : pct >= 75 ? "bg-amber-500/70" : "bg-red-500/70";

  const maxPeriodMissed = Math.max(1, ...(data?.byPeriod || []).map((p) => p.missed));

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-slate-800 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <UserRound size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">{details.name}</h2>
              <p className="text-xs text-slate-400">
                Adm No {details.admissionNo}
                {details.standardName ? ` · ${details.standardName}` : ""}
                {details.rollNo ? ` · Roll ${details.rollNo}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                {details.classTeacher && (
                  <span className="inline-flex items-center gap-1">
                    <GraduationCap size={12} /> Class teacher: {details.classTeacher}
                  </span>
                )}
                {details.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone size={12} /> {details.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Range */}
        <div className="flex flex-wrap items-end gap-2 border-b border-slate-800 px-5 py-3">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => choosePreset(p.key)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                preset === p.key
                  ? "border-blue-500/60 bg-blue-500/15 text-blue-200"
                  : "border-slate-700 text-slate-400 hover:bg-slate-800"
              }`}
            >
              {p.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <input
              type="date"
              value={range.from}
              max={range.to || undefined}
              onChange={(e) => setCustom("from", e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-500">to</span>
            <input
              type="date"
              value={range.to}
              min={range.from || undefined}
              onChange={(e) => setCustom("to", e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-200 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && !data && <Skeleton />}

          {error && (
            <div className="m-5 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              <span>{error}</span>
              <button
                onClick={() => setRange((r) => ({ ...r }))}
                className="rounded-md border border-red-400/40 px-3 py-1 text-xs hover:bg-red-500/20"
              >
                Retry
              </button>
            </div>
          )}

          {data && !error && (
            <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-950/50 p-3 sm:col-span-1">
                  <p className="text-[11px] text-slate-500">Attendance</p>
                  <p className={`mt-0.5 text-2xl font-semibold ${pctTone}`}>
                    {pct == null ? "—" : `${pct}%`}
                  </p>
                  <div className="mt-2">
                    <Bar percent={pct || 0} tone={pctBar} />
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-500">{s.periodsMarked} periods marked</p>
                </div>
                {[
                  { label: "Periods absent", value: s.absent, tone: "text-red-300" },
                  { label: "Days affected", value: s.daysWithAbsence, sub: `${s.fullDayAbsences} full-day` },
                  { label: "Late / Excused", value: `${s.late} / ${s.excused}`, tone: "text-amber-300" },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                    <p className="text-[11px] text-slate-500">{c.label}</p>
                    <p className={`mt-0.5 text-2xl font-semibold ${c.tone || "text-slate-100"}`}>{c.value}</p>
                    {c.sub && <p className="mt-1.5 text-[10px] text-slate-500">{c.sub}</p>}
                  </div>
                ))}
              </div>

              {/* Tabs + status chips */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-y border-slate-800 px-5 py-2">
                <div className="flex gap-1">
                  {[
                    ["days", "Day-wise"],
                    ["patterns", "Patterns"],
                  ].map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                        tab === key ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {tab === "days" && (
                  <div className="flex gap-1">
                    {["ALL", "ABSENT", "LATE", "EXCUSED"].map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setStatusFilter(st);
                          setVisibleDays(DAYS_PER_PAGE);
                        }}
                        className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                          statusFilter === st
                            ? "border-blue-500/60 bg-blue-500/15 text-blue-200"
                            : "border-slate-700 text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        {st === "ALL" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Day-wise */}
              {tab === "days" && (
                <div className="space-y-3 p-5">
                  {days.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                        <CheckCircle2 size={22} />
                      </div>
                      <p className="text-sm text-slate-300">No missed periods in this range.</p>
                    </div>
                  )}

                  {days.slice(0, visibleDays).map((d) => (
                    <section key={d.date} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
                      <header className="flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/60 px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <CalendarX2 size={15} className="text-red-400" />
                          <span className="text-sm font-medium text-slate-100">{prettyDate(d.date)}</span>
                          <span className="text-xs text-slate-500">{prettyWeekday(d.weekday)}</span>
                        </div>
                        {d.fullDayAbsent ? (
                          <span className="rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[11px] font-medium text-red-200">
                            Full day absent
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {d.absentCount} of {d.periodsMarked} periods absent
                          </span>
                        )}
                      </header>

                      <ul className="divide-y divide-slate-800/70">
                        {d.periods.map((p) => (
                          <li key={p.id} className="flex items-start gap-3 px-4 py-3">
                            <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-slate-800 text-slate-200">
                              <span className="text-[9px] leading-none text-slate-400">P</span>
                              <span className="text-sm font-semibold leading-none">{p.periodIndex}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-100">{p.subject}</p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 size={11} />
                                  {p.startTime}–{p.endTime}
                                </span>
                                {p.teacherName && <span>· {p.teacherName}</span>}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {p.absenceType && <Tag>{p.absenceType}</Tag>}
                                {p.corrected && (
                                  <Tag icon={BadgeCheck} tone="green">
                                    Corrected
                                  </Tag>
                                )}
                                {p.correctionPending && (
                                  <Tag icon={Hourglass} tone="amber">
                                    Correction pending
                                  </Tag>
                                )}
                                {p.source === "DATE_SPECIFIC_TIMETABLE" && <Tag>Special timetable</Tag>}
                              </div>
                              {p.markedBy && (
                                <p className="mt-1.5 text-[10px] text-slate-500">
                                  Marked by {p.markedBy}
                                  {p.markedAt ? ` · ${prettyDateTime(p.markedAt)}` : ""}
                                </p>
                              )}
                            </div>
                            <StatusPill status={p.status} />
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}

                  {days.length > visibleDays && (
                    <button
                      onClick={() => setVisibleDays((n) => n + DAYS_PER_PAGE)}
                      className="w-full rounded-lg border border-slate-700 py-2 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      Show more days ({days.length - visibleDays} remaining)
                    </button>
                  )}
                </div>
              )}

              {/* Patterns */}
              {tab === "patterns" && (
                <div className="space-y-6 p-5">
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                      <BookOpen size={15} className="text-slate-400" /> Missed by subject
                    </h3>
                    {data.bySubject.length === 0 ? (
                      <p className="text-xs text-slate-500">Nothing missed in this range.</p>
                    ) : (
                      <div className="space-y-3">
                        {data.bySubject.map((sub) => (
                          <div key={sub.subjectId}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="text-slate-200">{sub.subject}</span>
                              <span className="text-slate-400">
                                {sub.absent} absent
                                {sub.late ? ` · ${sub.late} late` : ""}
                                {sub.excused ? ` · ${sub.excused} excused` : ""} of {sub.markedPeriods} ({sub.missedPercent}%)
                              </span>
                            </div>
                            <Bar percent={sub.missedPercent} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-200">
                      <Clock3 size={15} className="text-slate-400" /> Missed by period of the day
                    </h3>
                    {data.byPeriod.length === 0 ? (
                      <p className="text-xs text-slate-500">Nothing missed in this range.</p>
                    ) : (
                      <div className="flex items-end gap-2">
                        {data.byPeriod.map((p) => (
                          <div key={p.periodIndex} className="flex flex-1 flex-col items-center gap-1">
                            <span className="text-[11px] text-slate-300">{p.missed}</span>
                            <div className="flex h-24 w-full items-end rounded bg-slate-800/60">
                              <div
                                className="w-full rounded bg-red-500/70"
                                style={{ height: `${(p.missed / maxPeriodMissed) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-500">P{p.periodIndex}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
