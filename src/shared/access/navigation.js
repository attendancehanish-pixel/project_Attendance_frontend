import P from "./permissions";

// Single source for the management-portal menu. Each item is shown only when
// the signed-in user holds at least one of the permissions in `any`.
export const adminNav = [
  {
    label: "Overview",
    items: [{ to: "/dashboard", label: "Dashboard", icon: "⌂" }],
  },
  {
    label: "Attendance",
    items: [
      { to: "/attendance", label: "Attendance Dashboard", icon: "▣", any: [P.REPORTS_ATTENDANCE_VIEW] },
      { to: "/attendance/generate", label: "Generate Sessions", icon: "⚡", any: [P.ATTENDANCE_SESSION_GENERATE] },
      { to: "/attendance/sessions", label: "Sessions", icon: "▤", any: [P.ATTENDANCE_SESSION_GENERATE] },
      { to: "/mark", label: "Mark Attendance", icon: "✓", any: [P.ATTENDANCE_MARK] },
      { to: "/attendance/corrections", label: "Corrections", icon: "↺", any: [P.ATTENDANCE_CORRECT, P.ATTENDANCE_APPROVE_CORRECTION] },
    ],
  },
  {
    label: "Academic",
    items: [
      { to: "/academic-years", label: "Academic Years", icon: "▣", any: [P.ACADEMIC_YEAR_VIEW] },
      { to: "/configuration", label: "Periods", icon: "⚙", any: [P.PERIOD_VIEW] },
      { to: "/calendar", label: "Calendar", icon: "◷", any: [P.CALENDAR_VIEW] },
      { to: "/standards", label: "Standards", icon: "▤", any: [P.STANDARDS_VIEW] },
      { to: "/subjects", label: "Subjects", icon: "◈", any: [P.SUBJECTS_VIEW] },
    ],
  },
  {
    label: "Timetable & staffing",
    items: [
      { to: "/timetable", label: "Timetable", icon: "▦", any: [P.TIMETABLE_VIEW] },
      { to: "/timetable/settings", label: "Timetable Settings", icon: "⚙", any: [P.TIMETABLE_SETTINGS] },
      { to: "/staff", label: "Staff", icon: "♟", any: [P.STAFF_VIEW] },
      { to: "/assignments", label: "Staff Assignments", icon: "⇄", any: [P.STAFF_ASSIGNMENT_VIEW] },
    ],
  },
  {
    label: "Students",
    items: [
      { to: "/students", label: "Students", icon: "♙", any: [P.STUDENTS_VIEW] },
      { to: "/student-enrollments", label: "Enrolment Report", icon: "▥", any: [P.STUDENTS_ENROLL] },
      { to: "/student-enrollments/bulk-create", label: "Bulk Enrolment", icon: "＋", any: [P.STUDENTS_ENROLL] },
      { to: "/absence-types", label: "Absence Types", icon: "!", any: [P.ABSENCE_TYPE_VIEW] },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/users", label: "Users", icon: "☺", any: [P.USERS_VIEW] },
      { to: "/roles", label: "Roles & Permissions", icon: "⚿", any: [P.ROLES_VIEW] },
    ],
  },
  {
    label: "Reports",
    items: [
      { to: "/reports", label: "Reports", icon: "▥", any: [P.REPORTS_ATTENDANCE_VIEW, P.REPORTS_AUDIT_VIEW] },
      { to: "/notifications", label: "Notifications", icon: "◉", any: [P.NOTIFICATIONS_VIEW] },
    ],
  },
];

/** Menu sections filtered to what `hasAny` allows; empty sections are dropped. */
export function visibleNav(hasAny) {
  return adminNav
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.any || hasAny(item.any)),
    }))
    .filter((section) => section.items.length > 0);
}
