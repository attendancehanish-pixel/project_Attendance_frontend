// src/features/attendance/api/attendance-leave.js
import { get, post } from "../../../shared/api/client";

export const attendanceLeaveApi = {
  /**
   * Explicitly mark a single attendance session as STAFF_LEAVE.
   * Typically called by the assigned staff member when they realize
   * they can't mark attendance (or by an admin).
   *
   * @param {Object} payload
   * @param {string} payload.sessionId   - AttendanceSession.id
   * @param {string} [payload.leaveId]   - Optional StaffLeave.id (if pre-approved)
   * @param {string} [payload.reason]    - Optional free-text reason
   */
  markSessionAsLeave: ({ sessionId, leaveId, reason }) =>
    post("/attendance/leave/mark-session", {
      sessionId,
      leaveId,
      reason,
    }),

  /**
   * Mark attendance on a session that is already in STAFF_LEAVE state.
   * Only ADMIN or the assigned substitute staff may do this.
   *
   * @param {string} sessionId
   * @param {Array<{ studentId: string, status: "PRESENT"|"ABSENT",
   *                 absenceTypeId?: string|null, remarks?: string|null }>} records
   */
  markLeaveSessionAttendance: (sessionId, records) =>
    post(`/attendance/leave/sessions/${sessionId}/mark`, { records }),

  /**
   * List all sessions currently in STAFF_LEAVE state.
   * Used by admin dashboard to pick up unmarked leave sessions.
   *
   * @param {Object} [filters]
   * @param {string} [filters.from]            - ISO date (YYYY-MM-DD)
   * @param {string} [filters.to]              - ISO date (YYYY-MM-DD)
   * @param {string} [filters.standardId]
   * @param {string} [filters.staffId]
   * @param {string} [filters.academicYearId]
   */
  listLeaveSessions: (filters = {}) => {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v != null && v !== "")
    ).toString();
    return get(`/attendance/leave/sessions${qs ? `?${qs}` : ""}`);
  },

  /**
   * Bulk-mark all PENDING sessions for a staff member between two dates
   * as STAFF_LEAVE. Intended to be called from the StaffLeave approval flow.
   *
   * @param {Object} payload
   * @param {string} payload.staffId
   * @param {string} payload.from             - ISO date (YYYY-MM-DD)
   * @param {string} payload.to               - ISO date (YYYY-MM-DD)
   * @param {string} payload.academicYearId
   * @param {string} [payload.leaveId]
   * @param {string} [payload.reason]
   */
  bulkMarkLeaveSessions: (payload) =>
    post("/attendance/leave/bulk-mark", payload),

  /**
   * Convenience: bulk-mark sessions for a specific StaffLeave record.
   * Wraps bulkMarkLeaveSessions with the leave's own dates.
   *
   * @param {Object} leave - StaffLeave object (must have id, staffId,
   *                         academicYearId, startDate, endDate)
   * @param {string} [reason]
   */
  bulkMarkForLeave: (leave, reason) =>
    post("/attendance/leave/bulk-mark", {
      staffId: leave.staffId,
      from: leave.startDate,
      to: leave.endDate,
      academicYearId: leave.academicYearId,
      leaveId: leave.id,
      reason,
    }),
};

export default attendanceLeaveApi;