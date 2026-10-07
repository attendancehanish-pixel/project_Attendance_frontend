import { get,  } from "../../../shared/api/client";

export const staffStudentsApi = {
  getFilterOptions: () =>
    get("/staff/students/filter-options").then((r) => r.data),

  list: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append("search", filters.search);
    if (filters.standardId) params.append("standardId", filters.standardId);
    if (filters.status) params.append("status", filters.status);
    if (filters.page) params.append("page", filters.page);
    if (filters.pageSize) params.append("pageSize", filters.pageSize);
    if (filters.sortBy) params.append("sortBy", filters.sortBy);
    if (filters.sortDir) params.append("sortDir", filters.sortDir);

    const q = params.toString() ? `?${params.toString()}` : "";
    return get(`/staff/students${q}`).then((r) => r.data);
  },

  getById: (studentId) =>
    get(`/staff/students/${studentId}`).then((r) => r.data),

  getAbsences: (studentId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.from) params.append("from", filters.from);
    if (filters.to) params.append("to", filters.to);
    if (filters.limit) params.append("limit", filters.limit);

    const q = params.toString() ? `?${params.toString()}` : "";
    return get(`/staff/students/${studentId}/absences${q}`).then((r) => r.data);
  },
};