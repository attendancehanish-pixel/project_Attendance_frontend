import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  UsersRound,
  Filter,
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  UserRound,
  AlertTriangle,
  Clock3,
  CheckCircle2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*                              MOCK DATA                              */
/* ------------------------------------------------------------------ */

const MOCK_ACADEMIC_YEAR = { id: "ay-2026", name: "2026–27" };

const MOCK_STANDARDS = [
  { id: "10-a", code: "10A", name: "10 A", studentCount: 32 },
  { id: "10-b", code: "10B", name: "10 B", studentCount: 30 },
  { id: "9-a",  code: "9A",  name: "9 A",  studentCount: 34 },
  { id: "9-b",  code: "9B",  name: "9 B",  studentCount: 31 },
  { id: "8-a",  code: "8A",  name: "8 A",  studentCount: 28 },
];

const MOCK_STUDENTS = [
  { id: "s-001", admissionNo: "ADM-1001", name: "Aarav Menon",      email: "aarav.menon@example.com",   phone: "+91 98765 10001", status: "ACTIVE",   standardId: "10-a", standardName: "10 A", rollNo: "01", enrollmentStatus: "ACTIVE" },
  { id: "s-002", admissionNo: "ADM-1002", name: "Diya Krishnan",    email: "diya.k@example.com",        phone: "+91 98765 10002", status: "ACTIVE",   standardId: "10-a", standardName: "10 A", rollNo: "02", enrollmentStatus: "ACTIVE" },
  { id: "s-003", admissionNo: "ADM-1003", name: "Rohan Nair",       email: "rohan.nair@example.com",    phone: "+91 98765 10003", status: "ACTIVE",   standardId: "10-a", standardName: "10 A", rollNo: "03", enrollmentStatus: "ACTIVE" },
  { id: "s-004", admissionNo: "ADM-1004", name: "Ananya Pillai",    email: "ananya.p@example.com",      phone: "+91 98765 10004", status: "ACTIVE",   standardId: "10-b", standardName: "10 B", rollNo: "01", enrollmentStatus: "ACTIVE" },
  { id: "s-005", admissionNo: "ADM-1005", name: "Kabir Sharma",     email: "kabir.s@example.com",       phone: "+91 98765 10005", status: "ACTIVE",   standardId: "10-b", standardName: "10 B", rollNo: "02", enrollmentStatus: "ACTIVE" },
  { id: "s-006", admissionNo: "ADM-1006", name: "Ishita Ramesh",    email: "ishita.r@example.com",      phone: "+91 98765 10006", status: "ACTIVE",   standardId: "9-a",  standardName: "9 A",  rollNo: "01", enrollmentStatus: "ACTIVE" },
  { id: "s-007", admissionNo: "ADM-1007", name: "Vihaan Thomas",    email: "vihaan.t@example.com",      phone: "+91 98765 10007", status: "ACTIVE",   standardId: "9-a",  standardName: "9 A",  rollNo: "02", enrollmentStatus: "ACTIVE" },
  { id: "s-008", admissionNo: "ADM-1008", name: "Meera Suresh",     email: "meera.s@example.com",       phone: "+91 98765 10008", status: "ACTIVE",   standardId: "9-a",  standardName: "9 A",  rollNo: "03", enrollmentStatus: "ACTIVE" },
  { id: "s-009", admissionNo: "ADM-1009", name: "Aditya Varma",     email: "aditya.v@example.com",      phone: "+91 98765 10009", status: "ACTIVE",   standardId: "9-b",  standardName: "9 B",  rollNo: "01", enrollmentStatus: "ACTIVE" },
  { id: "s-010", admissionNo: "ADM-1010", name: "Sara Mathew",      email: "sara.m@example.com",        phone: "+91 98765 10010", status: "ACTIVE",   standardId: "9-b",  standardName: "9 B",  rollNo: "02", enrollmentStatus: "ACTIVE" },
  { id: "s-011", admissionNo: "ADM-1011", name: "Nikhil Raj",       email: "nikhil.r@example.com",      phone: "+91 98765 10011", status: "INACTIVE", standardId: "8-a",  standardName: "8 A",  rollNo: "01", enrollmentStatus: "INACTIVE" },
  { id: "s-012", admissionNo: "ADM-1012", name: "Tara Balakrishnan", email: "tara.b@example.com",       phone: "+91 98765 10012", status: "ACTIVE",   standardId: "8-a",  standardName: "8 A",  rollNo: "02", enrollmentStatus: "ACTIVE" },
  { id: "s-013", admissionNo: "ADM-1013", name: "Arjun Dev",        email: "arjun.d@example.com",       phone: "+91 98765 10013", status: "ACTIVE",   standardId: "10-a", standardName: "10 A", rollNo: "04", enrollmentStatus: "ACTIVE" },
  { id: "s-014", admissionNo: "ADM-1014", name: "Nithya Suresh",    email: "nithya.s@example.com",      phone: "+91 98765 10014", status: "ACTIVE",   standardId: "10-a", standardName: "10 A", rollNo: "05", enrollmentStatus: "ACTIVE" },
  { id: "s-015", admissionNo: "ADM-1015", name: "Hari Prasad",      email: "hari.p@example.com",        phone: "+91 98765 10015", status: "ACTIVE",   standardId: "10-b", standardName: "10 B", rollNo: "03", enrollmentStatus: "ACTIVE" },
  { id: "s-016", admissionNo: "ADM-1016", name: "Lakshmi Menon",    email: "lakshmi.m@example.com",     phone: "+91 98765 10016", status: "ACTIVE",   standardId: "9-a",  standardName: "9 A",  rollNo: "04", enrollmentStatus: "ACTIVE" },
  { id: "s-017", admissionNo: "ADM-1017", name: "Dev Anand",        email: "dev.a@example.com",         phone: "+91 98765 10017", status: "ACTIVE",   standardId: "9-b",  standardName: "9 B",  rollNo: "03", enrollmentStatus: "ACTIVE" },
  { id: "s-018", admissionNo: "ADM-1018", name: "Pooja Iyer",       email: "pooja.i@example.com",       phone: "+91 98765 10018", status: "ACTIVE",   standardId: "8-a",  standardName: "8 A",  rollNo: "03", enrollmentStatus: "ACTIVE" },
  { id: "s-019", admissionNo: "ADM-1019", name: "Rahul Krishnan",   email: "rahul.k@example.com",       phone: "+91 98765 10019", status: "ACTIVE",   standardId: "10-a", standardName: "10 A", rollNo: "06", enrollmentStatus: "ACTIVE" },
  { id: "s-020", admissionNo: "ADM-1020", name: "Sneha Nambiar",    email: "sneha.n@example.com",       phone: "+91 98765 10020", status: "ACTIVE",   standardId: "10-b", standardName: "10 B", rollNo: "04", enrollmentStatus: "ACTIVE" },
];

/**
 * Generates plausible absence sessions for a given student,
 * deterministically (so it doesn't reshuffle on every render).
 */
function generateMockAbsences(studentId) {
  // Simple hash so the same student always gets the same sessions.
  let seed = 0;
  for (let i = 0; i < studentId.length; i++) {
    seed = (seed * 31 + studentId.charCodeAt(i)) >>> 0;
  }
  const rand = (n) => (seed = (seed * 1103515245 + 12345) >>> 0) % n;

  const subjects = [
    "Mathematics",
    "English",
    "Physics",
    "Chemistry",
    "Malayalam",
    "History",
    "Computer Science",
  ];
  const teachers = [
    "Rahul Mathew",
    "Anita Joseph",
    "Suresh Kumar",
    "Meera Nair",
    "Fathima Ali",
    "Arun Das",
  ];
  const statuses = ["ABSENT", "ABSENT", "ABSENT", "LATE", "EXCUSED"];
  const absenceTypes = ["Sick Leave", "Family Emergency", "Unexcused", "Medical", null];
  const remarksPool = [
    "Informed by parent",
    "No prior intimation",
    "Doctor's note submitted",
    "Pending explanation",
    null,
  ];

  const count = 4 + rand(9); // 4–12 sessions
  const sessions = [];

  // Anchor dates in the past 60 days
  const today = new Date("2026-09-19T00:00:00Z").getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const daysAgo = 2 + rand(58);
    const date = new Date(today - daysAgo * dayMs);
    const periodIndex = 1 + rand(7);
    const startHour = 9 + Math.floor((periodIndex - 1) / 2);
    const startMin = periodIndex % 2 === 0 ? 45 : 0;
    const endHour = periodIndex % 2 === 0 ? startHour + 1 : startHour;
    const endMin = periodIndex % 2 === 0 ? 30 : 45;

    const pad = (n) => String(n).padStart(2, "0");
    const status = statuses[rand(statuses.length)];

    sessions.push({
      id: `${studentId}-abs-${i + 1}`,
      date: date.toISOString().slice(0, 10),
      periodIndex,
      startTime: `${pad(startHour)}:${pad(startMin)}`,
      endTime: `${pad(endHour)}:${pad(endMin)}`,
      subject: subjects[rand(subjects.length)],
      standardName: "—",
      teacherName: teachers[rand(teachers.length)],
      status,
      absenceType: status === "ABSENT" ? absenceTypes[rand(absenceTypes.length)] : null,
      remarks: remarksPool[rand(remarksPool.length)],
      markedBy: "Admin",
      markedAt: date.toISOString(),
    });
  }

  // Sort most recent first
  sessions.sort((a, b) => (a.date < b.date ? 1 : -1));

  const summary = {
    total: sessions.length,
    absent: sessions.filter((s) => s.status === "ABSENT").length,
    late: sessions.filter((s) => s.status === "LATE").length,
    excused: sessions.filter((s) => s.status === "EXCUSED").length,
  };

  return { studentId, summary, sessions };
}

/* ------------------------------------------------------------------ */
/*                            MOCK API LAYER                           */
/* ------------------------------------------------------------------ */

const mockStaffStudentsApi = {
  getFilterOptions: async () => {
    await delay(150);
    return { academicYear: MOCK_ACADEMIC_YEAR, standards: MOCK_STANDARDS };
  },

  list: async ({ search = "", standardId = "", status = "", page = 1, pageSize = 15 }) => {
    await delay(250);

    const searchTrim = search.trim().toLowerCase();

    const filtered = MOCK_STUDENTS.filter((s) => {
      if (standardId && s.standardId !== standardId) return false;
      if (status && s.status !== status) return false;
      if (searchTrim) {
        const hay = `${s.admissionNo} ${s.name} ${s.email || ""}`.toLowerCase();
        if (!hay.includes(searchTrim)) return false;
      }
      return true;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const students = filtered.slice(start, start + pageSize);

    return {
      academicYear: MOCK_ACADEMIC_YEAR,
      staff: { id: "staff-001" },
      pagination: { page: safePage, pageSize, total, totalPages },
      students,
    };
  },

  getById: async (studentId) => {
    await delay(120);
    const student = MOCK_STUDENTS.find((s) => s.id === studentId);
    if (!student) throw new Error("Student not found");
    return student;
  },

  getAbsences: async (studentId, { from, to, limit = 100 } = {}) => {
    await delay(300);
    const all = generateMockAbsences(studentId);
    let sessions = all.sessions;
    if (from) sessions = sessions.filter((s) => s.date >= from);
    if (to) sessions = sessions.filter((s) => s.date <= to);
    sessions = sessions.slice(0, limit);

    const summary = {
      total: sessions.length,
      absent: sessions.filter((s) => s.status === "ABSENT").length,
      late: sessions.filter((s) => s.status === "LATE").length,
      excused: sessions.filter((s) => s.status === "EXCUSED").length,
    };

    return { studentId, summary, sessions };
  },
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/* ------------------------------------------------------------------ */
/*                              API SWAP                               */
/* ------------------------------------------------------------------ */

// Point the page at the mock layer for now. When the backend is ready,
// uncomment the real import and delete `mockStaffStudentsApi`.
//
// import { staffStudentsApi } from "../api/staff-student.api";
const staffStudentsApi = mockStaffStudentsApi; // TODO: replace with API

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

const StatusPill = ({ status }) => {
  const styles = {
    ACTIVE: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    INACTIVE: "bg-slate-500/10 text-slate-300 border-slate-500/30",
    ABSENT: "bg-red-500/10 text-red-300 border-red-500/30",
    LATE: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    EXCUSED: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${
        styles[status] || styles.INACTIVE
      }`}
    >
      {status}
    </span>
  );
};

const Skeleton = () => (
  <div className="animate-pulse space-y-2 p-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="h-12 rounded-lg bg-slate-800/60" />
    ))}
  </div>
);

const ErrorBox = ({ message, onRetry }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
    <span>{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="rounded-md border border-red-400/40 px-3 py-1 text-xs hover:bg-red-500/20"
      >
        Retry
      </button>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/* Absence modal                                                       */
/* ------------------------------------------------------------------ */

const AbsenceModal = ({ student, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await staffStudentsApi.getAbsences(student.id, {
        from,
        to,
        limit: 200,
      });
      setData(res);
    } catch (err) {
      setError(err?.message || "Failed to load absence sessions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <UserRound size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                {student.name}
              </h2>
              <p className="text-xs text-slate-400">
                Adm No {student.admissionNo}
                {student.standardName ? ` · ${student.standardName}` : ""}
                {student.rollNo ? ` · Roll ${student.rollNo}` : ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Date filters */}
        <div className="flex flex-wrap items-end gap-3 border-b border-slate-800 px-5 py-3">
          <div>
            <label className="mb-1 block text-[11px] text-slate-500">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] text-slate-500">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={load}
            className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover"
          >
            Apply
          </button>
          {(from || to) && (
            <button
              onClick={() => {
                setFrom("");
                setTo("");
              }}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>

        {/* Summary */}
        {data?.summary && (
          <div className="grid grid-cols-4 gap-3 border-b border-slate-800 px-5 py-4">
            {[
              { label: "Total", value: data.summary.total },
              { label: "Absent", value: data.summary.absent },
              { label: "Late", value: data.summary.late },
              { label: "Excused", value: data.summary.excused },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-slate-800 bg-slate-950/50 p-3"
              >
                <p className="text-[11px] text-slate-500">{s.label}</p>
                <p className="mt-0.5 text-lg font-semibold text-slate-100">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading && <Skeleton />}
          {error && !loading && <ErrorBox message={error} onRetry={load} />}

          {!loading && !error && data?.sessions?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={22} />
              </div>
              <p className="text-sm text-slate-300">
                No absence sessions in this range.
              </p>
            </div>
          )}

          {!loading && !error && data?.sessions?.length > 0 && (
            <div className="space-y-2">
              {data.sessions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-100">
                          {s.subject}{" "}
                          <span className="text-xs text-slate-400">
                            · Period {s.periodIndex}
                          </span>
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock3 size={12} />
                          {s.startTime}–{s.endTime}
                          {s.teacherName ? ` · ${s.teacherName}` : ""}
                        </p>
                        {s.remarks && (
                          <p className="mt-2 text-xs text-slate-500">
                            {s.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusPill status={s.status} />
                      <span className="text-[11px] text-slate-500">
                        {s.date}
                      </span>
                      {s.absenceType && (
                        <span className="text-[11px] text-slate-500">
                          {s.absenceType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

const StaffStudentsPage = () => {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [standardId, setStandardId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);

  const [standards, setStandards] = useState([]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    (async () => {
      try {
        const opts = await staffStudentsApi.getFilterOptions();
        setStandards(opts.standards || []);
      } catch (err) {
        console.error("Failed to load filter options:", err);
      }
    })();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await staffStudentsApi.list({
        search: debouncedSearch,
        standardId,
        status,
        page,
        pageSize,
      });
      setData(res);
    } catch (err) {
      setError(err?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, standardId, status, page, pageSize]);

  const hasFilters = search || standardId || status;

  const clearFilters = () => {
    setSearch("");
    setStandardId("");
    setStatus("");
    setPage(1);
  };

  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <UsersRound size={16} />
            <span>Academic Year {data?.academicYear?.name || "—"}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Students
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Search and filter students, and view their absence history.
          </p>
        </div>

        {/* Filters bar */}
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_180px_auto]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by admission no, name or email…"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-slate-200 outline-none transition focus:border-blue-500"
            />
          </div>

          <select
            value={standardId}
            onChange={(e) => {
              setStandardId(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
          >
            <option value="">All classes</option>
            {standards.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.studentCount != null ? ` (${s.studentCount})` : ""}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500"
          >
            <option value="">Any status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800"
            >
              <Filter size={14} />
              Clear
            </button>
          )}
        </div>

        {/* Result count */}
        {pagination && (
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              {pagination.total} student{pagination.total === 1 ? "" : "s"}{" "}
              found
            </span>
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>
        )}

        {loading && <Skeleton />}
        {error && !loading && <ErrorBox message={error} onRetry={load} />}

        {/* Table */}
        {!loading && !error && data && (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Adm No</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Class</th>
                    <th className="px-4 py-3 font-medium">Roll</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        No students match your filters.
                      </td>
                    </tr>
                  )}
                  {data.students.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className="cursor-pointer border-b border-slate-800/60 transition last:border-b-0 hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">
                        {s.admissionNo}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-100">{s.name}</p>
                        {s.email && (
                          <p className="text-xs text-slate-500">{s.email}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {s.standardName || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {s.rollNo || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {s.phone || s.email || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={s.enrollmentStatus || s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>
                <span className="text-xs text-slate-500">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(pagination.totalPages, p + 1))
                  }
                  className="flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {selected && (
          <AbsenceModal student={selected} onClose={() => setSelected(null)} />
        )}
      </div>
    </div>
  );
};

export default StaffStudentsPage;