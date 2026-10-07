import { get, post } from "../../../shared/api/client";

export const academicYearApi = {
  list: () => get("/academic-years"),
};

export const attendanceSessionApi = {
  // Generate PENDING sessions for a single date.
  generateForDate: (academicYearId, date) =>
    post(`/attendance-sessions/academic-year/${academicYearId}/generate`, { date }),

  // Generate PENDING sessions for an explicit [from, to] range (inclusive).
  generateForRange: (academicYearId, from, to) =>
    post(`/attendance-sessions/academic-year/${academicYearId}/generate-range`, { from, to }),

  // Generate PENDING sessions for the next N days starting today.
  generateForNextDays: (academicYearId, days) =>
    post(`/attendance-sessions/academic-year/${academicYearId}/generate-range`, { days }),
   list: (academicYearId, params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v != null && v !== "")
    ).toString();
    return get(
      `/attendance-sessions/academic-year/${academicYearId}/sessions${qs ? `?${qs}` : ""}`
    );
  },
};
