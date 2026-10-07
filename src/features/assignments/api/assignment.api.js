import { get, post, patch, del } from '../../../shared/api/client';

export const assignmentApi = {
  // Get all assignments with filters
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.academicYearId) params.append('academicYearId', filters.academicYearId);
    if (filters.standardId) params.append('standardId', filters.standardId);
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.staffId) params.append('staffId', filters.staffId);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return get(`/assignments${query}`);
  },

  // Get single assignment
  getById: (id) => get(`/assignments/${id}`),

  // Create assignment
  create: (data) => post('/assignments', data),

  // Bulk create assignments
  bulkCreate: (assignments) => post('/assignments/bulk', { assignments }),

  // Update assignment
  update: (id, data) => patch(`/assignments/${id}`, data),

  // Delete assignment
  delete: (id) => del(`/assignments/${id}`),

  // Get staff assignments
  getStaffAssignments: (staffId, academicYearId) => {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return get(`/assignments/staff/${staffId}/assignments${query}`);
  },

  // Get subject assignments
  getSubjectAssignments: (standardId, subjectId, academicYearId) => {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return get(`/assignments/standard/${standardId}/subject/${subjectId}/assignments${query}`);
  },

  // Get available staff
  getAvailableStaff: (academicYearId) => {
    const query = academicYearId ? `?academicYearId=${academicYearId}` : '';
    return get(`/assignments/available-staff${query}`);
  }
};