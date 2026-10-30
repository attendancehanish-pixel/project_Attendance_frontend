import { get } from "../../../shared/api/client";

const toQuery = (params) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") q.append(key, value);
  });
  const s = q.toString();
  return s ? `?${s}` : "";
};

export const staffStudentsApi = {
  getFilterOptions: () =>
    get("/staff/students/filter-options").then((r) => r.data),

  // { search, standardId, status, page, pageSize, sortBy, sortDir }
  list: (filters = {}) =>
    get(`/staff/students${toQuery(filters)}`).then((r) => r.data),

  getById: (studentId) =>
    get(`/staff/students/${studentId}`).then((r) => r.data),

  // { from, to } as YYYY-MM-DD
  getAbsences: (studentId, filters = {}) =>
    get(`/staff/students/${studentId}/absences${toQuery(filters)}`).then((r) => r.data),
};
