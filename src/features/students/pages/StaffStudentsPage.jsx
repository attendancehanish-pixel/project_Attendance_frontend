import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  UsersRound,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { staffStudentsApi } from "../api/staff-student.api";
import StudentAbsenceDrawer from "../components/StudentAbsenceDrawer";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";

const PAGE_SIZES = [10, 15, 25, 50];
const SEARCH_DEBOUNCE_MS = 400;

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

const StatusPill = ({ status }) => {
  const styles = {
    ACTIVE: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    INACTIVE: "bg-slate-500/10 text-slate-300 border-slate-500/30",
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
  <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
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

// 1 … 4 5 [6] 7 8 … 20
function pageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const items = new Set([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => items.add(n));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((n) => items.add(n));
  const sorted = [...items].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push("…");
    out.push(n);
  });
  return out;
}

const selectClass =
  "rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-blue-500";

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

const StaffStudentsPage = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS);
  const [standardId, setStandardId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [standards, setStandards] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  // Ignore responses that arrive after a newer request was started.
  const requestId = useRef(0);

  useEffect(() => {
    staffStudentsApi
      .getFilterOptions()
      .then((opts) => setStandards(opts.standards || []))
      .catch((err) => console.error("Failed to load filter options:", err));
  }, []);

  // A new search term always starts from page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const load = useCallback(async () => {
    const id = ++requestId.current;
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
      if (id !== requestId.current) return;
      setData(res);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err?.message || "Failed to load students");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [debouncedSearch, standardId, status, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const pagination = data?.pagination;

  // Last page vanished (e.g. filter narrowed) -> jump back to the last valid one.
  useEffect(() => {
    if (pagination && page > pagination.totalPages) setPage(pagination.totalPages);
  }, [pagination, page]);

  const hasFilters = search || standardId || status;
  const typing = search.trim() !== debouncedSearch;

  const clearFilters = () => {
    setSearch("");
    setStandardId("");
    setStatus("");
    setPage(1);
  };

  const firstRow = pagination && pagination.total ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
  const lastRow = pagination ? Math.min(pagination.total, pagination.page * pagination.pageSize) : 0;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <UsersRound size={16} />
            <span>Academic Year {data?.academicYear?.name || "—"}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Students</h1>
          <p className="mt-1 text-sm text-slate-400">
            Search and filter students, and view their absence history.
          </p>
        </div>

        {/* Filters bar */}
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_200px_160px_auto]">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or admission number…"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-9 text-sm text-slate-200 outline-none transition focus:border-blue-500"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {typing || (loading && debouncedSearch) ? (
                <Loader2 size={15} className="animate-spin text-slate-500" />
              ) : search ? (
                <button
                  onClick={() => setSearch("")}
                  className="rounded p-0.5 text-slate-500 hover:text-slate-200"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              ) : null}
            </div>
          </div>

          <select
            value={standardId}
            onChange={(e) => {
              setStandardId(e.target.value);
              setPage(1);
            }}
            className={selectClass}
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
            className={selectClass}
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

        {error && <ErrorBox message={error} onRetry={load} />}

        {/* Result count */}
        {pagination && !error && (
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>
              {pagination.total === 0
                ? "No students found"
                : `Showing ${firstRow}–${lastRow} of ${pagination.total} student${pagination.total === 1 ? "" : "s"}`}
            </span>
            <label className="flex items-center gap-2">
              Rows
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-300 outline-none focus:border-blue-500"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {/* First load only: skeleton. Later loads keep the table and dim it. */}
        {loading && !data && !error && <Skeleton />}

        {data && (
          <div
            className={`overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition-opacity ${
              loading ? "opacity-60" : "opacity-100"
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
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
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        {hasFilters ? "No students match your search or filters." : "No students enrolled yet."}
                      </td>
                    </tr>
                  )}
                  {data.students.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => setSelected(s)}
                      className="cursor-pointer border-b border-slate-800/60 transition last:border-b-0 hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-300">{s.admissionNo}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-100">{s.name}</p>
                        {s.email && <p className="text-xs text-slate-500">{s.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{s.standardName || "—"}</td>
                      <td className="px-4 py-3 text-slate-400">{s.rollNo || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{s.phone || s.email || "—"}</td>
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
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {pageItems(pagination.page, pagination.totalPages).map((item, i) =>
                    item === "…" ? (
                      <span key={`gap-${i}`} className="px-1 text-xs text-slate-600">
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item)}
                        className={`min-w-[30px] rounded-md border px-2 py-1.5 text-xs transition ${
                          item === pagination.page
                            ? "border-blue-500/60 bg-blue-500/15 text-blue-200"
                            : "border-slate-700 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
                </div>

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  className="flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {selected && <StudentAbsenceDrawer student={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  );
};

export default StaffStudentsPage;
