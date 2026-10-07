import { get, post, put, patch, del } from "../../../shared/api/client";

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const periodConfigurationApi = {
  get: (academicYearId) => get(`/period-configuration/${academicYearId}`),
  getSetup: (academicYearId) => get(`/period-configuration/${academicYearId}/setup`),
  upsert: (academicYearId, data) => put(`/period-configuration/${academicYearId}`, data),
};

export const periodApi = {
  list: (academicYearId, weekday) => get(`/periods/academic-year/${academicYearId}${qs({ weekday })}`),
  get: (id) => get(`/periods/${id}`),
  create: (academicYearId, data) => post(`/periods/academic-year/${academicYearId}`, data),
  update: (id, data) => patch(`/periods/${id}`, data),
  delete: (id) => del(`/periods/${id}`),
  generate: (academicYearId, data) => post(`/period-configuration/academic-year/${academicYearId}/generate`, data),
};

export const calendarApi = {
  getYear: (academicYearId) => get(`/calendar/academic-year/${academicYearId}`),
  getMonth: (academicYearId, year, month) =>
    get(`/calendar/academic-year/${academicYearId}/month${qs({ year, month })}`),
  createOverride: (academicYearId, data) => post(`/calendar/academic-year/${academicYearId}/overrides`, data),
  updateOverride: (id, data) => patch(`/calendar/overrides/${id}`, data),
  deleteOverride: (id) => del(`/calendar/overrides/${id}`),
  listCategories: () => get("/calendar/exception-categories"),
  createCategory: (data) => post("/calendar/exception-categories", data),
  updateCategory: (id, data) => patch(`/calendar/exception-categories/${id}`, data),
  deleteCategory: (id) => del(`/calendar/exception-categories/${id}`),
  listExceptions: (academicYearId) => get(`/calendar/academic-year/${academicYearId}/exceptions`),
  createException: (academicYearId, data) => post(`/calendar/academic-year/${academicYearId}/exceptions`, data),
  updateException: (id, data) => patch(`/calendar/exceptions/${id}`, data),
  deleteException: (id) => del(`/calendar/exceptions/${id}`),
};

export const timetableApi = {
  list: (academicYearId, standardId) =>
    get(`/timetable/academic-year/${academicYearId}${qs({ standardId })}`),
  create: (data) => post("/timetable", data),
  update: (id, data) => patch(`/timetable/${id}`, data),
  delete: (id) => del(`/timetable/${id}`),
  validate: (academicYearId) => post(`/timetable/academic-year/${academicYearId}/validate`),
  publish: (academicYearId) => post(`/timetable/academic-year/${academicYearId}/publish`),
  listDateSpecific: (academicYearId, date, standardId) =>
    get(`/timetable/date-specific/academic-year/${academicYearId}${qs({ date, standardId })}`),
  createDateSpecific: (academicYearId, data) =>
    post(`/timetable/date-specific/academic-year/${academicYearId}`, data),
  updateDateSpecific: (id, data) => patch(`/timetable/date-specific/${id}`, data),
  deleteDateSpecific: (id) => del(`/timetable/date-specific/${id}`),
};
