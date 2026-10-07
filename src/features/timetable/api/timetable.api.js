import { get } from "../../../shared/api/client";

export const timetableApi = {
  getMyTimetable: () =>
    get("/staff/timetable/me").then((r) => r.data),

  getMyToday: () =>
    get("/staff/timetable/me/today").then((r) => r.data),

  getClasses: () =>
    get("/staff/timetable/classes").then((r) => r.data),

  getClassTimetable: (standardId) =>
    get(`/staff/timetable/classes/${standardId}`).then((r) => r.data),

  getChanges: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.standardId) params.append("standardId", filters.standardId);
    if (filters.from) params.append("from", filters.from);
    if (filters.to) params.append("to", filters.to);

    const query = params.toString() ? `?${params.toString()}` : "";
    return get(`/staff/timetable/changes${query}`).then((r) => r.data);
  },
};