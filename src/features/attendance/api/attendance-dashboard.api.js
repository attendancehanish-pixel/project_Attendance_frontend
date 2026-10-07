import { get } from "../../../shared/api/client";

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const attendanceDashboardApi = {
  // Daily grid: standards x periods for a given date.
  getDaily: (date, academicYearId) =>
    get(`/reports/attendance/daily${qs({ date, academicYearId })}`),

  // Detail behind one grid cell: every student in that session with status.
  getSession: (sessionId) => get(`/attendance/sessions/${sessionId}/students`),

  // Sessions still pending within a date range, for the "unmarked" panel.
  getUnmarked: ({ academicYearId, from, to, standardId, staffId, page, pageSize } = {}) =>
    get(
      `/reports/attendance/unmarked${qs({
        academicYearId,
        from,
        to,
        standardId,
        staffId,
        page,
        pageSize,
      })}`
    ),
};
