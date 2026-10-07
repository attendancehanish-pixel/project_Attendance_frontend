const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://project-attendance-backend-uny2.onrender.com/api";

let accessToken = localStorage.getItem("accessToken");

export function setAccessToken(token) {
  accessToken = token || null;
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
}

export function getAccessToken() {
  return accessToken;
}

async function parseResponse(response) {
  const text = await response.text();
  let body = {};
  try { body = text ? JSON.parse(text) : {}; } catch { body = { message: text }; }
  if (!response.ok) {
    const error = new Error(body.message || body.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.body = body;
    throw error;
  }
  return body;
}

export async function api(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  if (response.status === 401 && retry && path !== "/auth/refresh" && path !== "/auth/login") {
    try {
      const refreshed = await api("/auth/refresh", { method: "POST" }, false);
      setAccessToken(refreshed.accessToken);
      return api(path, options, false);
    } catch {
      setAccessToken(null);
    }
  }

  return parseResponse(response);
}

export const get = (path) => api(path);
export const post = (path, body) => api(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
export const patch = (path, body) => api(path, { method: "PATCH", body: JSON.stringify(body) });
export const del = (path) => api(path, { method: "DELETE" });
export const put = (path, body) => api(path, { method: "PUT", body: JSON.stringify(body) });

export const assignmentApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.academicYearId) params.append('academicYearId', filters.academicYearId);
    if (filters.standardId) params.append('standardId', filters.standardId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.staffId) params.append('staffId', filters.staffId);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return get(`/assignments${query}`);
  },

  getById: (id) => get(`/assignments/${id}`),

  create: (data) => post('/assignments', data),

  bulkCreate: (assignments) => post('/assignments/bulk', { assignments }),

  update: (id, data) => patch(`/assignments/${id}`, data),

  delete: (id) => del(`/assignments/${id}`),

  getStaffAssignments: (staffId, academicYearId) => {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return get(`/assignments/staff/${staffId}/assignments${query}`);
  },

  getSubjectAssignments: (standardId, subjectId, academicYearId) => {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return get(`/assignments/standard/${standardId}/subject/${subjectId}/assignments${query}`);
  },

  getAvailableStaff: (academicYearId) => {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return get(`/assignments/available-staff${query}`);
  }
  ,
    getMatrix: (academicYearId) => {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return get(`/assignments${query}`);
  },
};

// api/client.js (add these to your existing client)

export const staffApi = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    if (filters.department) params.append('department', filters.department);
    if (filters.designation) params.append('designation', filters.designation);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return get(`/staff${query}`);
  },

  getById: (id) => get(`/staff/${id}`),

  getByUserId: (userId) => get(`/staff/user/${userId}`),

  create: (data) => post('/staff', data),

  update: (id, data) => patch(`/staff/${id}`, data),

  delete: (id) => del(`/staff/${id}`),
  
  // Get staff with their assignments
  getStaffWithAssignments: (id) => get(`/staff/${id}?include=assignments`),
  
  // Get staff availability
  getAvailableStaff: (academicYearId) => {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return get(`/staff/available${query}`);
  }
};

export const subjectAllocationApi = {
  // Get all allocations with filters
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.academicYearId) params.append('academicYearId', filters.academicYearId);
    if (filters.standardId) params.append('standardId', filters.standardId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return get(`/subject-allocations${query}`);
  },

  // Get allocations for a specific standard
  getByStandard: (standardId, academicYearId) => {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return get(`/subject-allocations/standard/${standardId}${query}`);
  },

  // Get available subjects for a standard
  getAvailableSubjects: (standardId, academicYearId) => {
    return get(`/subject-allocations/standard/${standardId}/available?academicYearId=${academicYearId}`);
  },
  getSubjectsWithStatus: (standardId, academicYearId) => {
    return get(`/subject-allocations/standard/${standardId}/subjects?academicYearId=${academicYearId}`);
  },

  // NEW: Toggle single subject
  toggleAllocation: (standardId, subjectId, academicYearId, assign) => {
    return patch(`/subject-allocations/standard/${standardId}/subject/${subjectId}/toggle`, {
      academicYearId,
      assign
    });
  },

  // NEW: Bulk update allocations
  bulkUpdate: (standardId, academicYearId, subjectIds, action) => {
    return patch(`/subject-allocations/standard/${standardId}/bulk`, {
      academicYearId,
      subjectIds,
      action
    });
  },
  // Get single allocation by ID
  getById: (id) => get(`/subject-allocations/${id}`),

  // Create new allocation
  create: (data) => post('/subject-allocations', data),

  // Bulk create allocations
  bulkCreate: (allocations) => post('/subject-allocations/bulk', { allocations }),

  // Delete allocation
  delete: (id) => del(`/subject-allocations/${id}`),

  // Bulk delete allocations for a standard
  bulkDelete: (standardId, academicYearId) => 
    del(`/subject-allocations/standard/${standardId}/bulk`, { academicYearId })

  
};