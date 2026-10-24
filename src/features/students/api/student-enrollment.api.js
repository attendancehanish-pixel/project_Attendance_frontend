import { get, post, patch, del } from "../../../shared/api/client";

export const studentEnrollmentApi = {
  list: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") params.set(key, value);
    });
    const query = params.toString() ? `?${params.toString()}` : "";
    return get(`/student-enrollments${query}`);
  },
  getById: (id) => get(`/student-enrollments/${id}`),
  getSetup: (academicYearId, standardId) =>
    get(`/student-enrollments/academic-year/${academicYearId}/setup?standardId=${encodeURIComponent(standardId)}`),
  lookup: (academicYearId, q, limit = 8) =>
    get(`/student-enrollments/lookup?academicYearId=${encodeURIComponent(academicYearId)}&q=${encodeURIComponent(q)}&limit=${limit}`),
  nextRollNo: (academicYearId, standardId) =>
    get(`/student-enrollments/next-roll-no?academicYearId=${encodeURIComponent(academicYearId)}&standardId=${encodeURIComponent(standardId)}`),
  bulkEnroll: (data) => post("/student-enrollments/bulk", data),
  update: (id, data) => patch(`/student-enrollments/${id}`, data),
  remove: (id) => del(`/student-enrollments/${id}`),
};
