import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./shared/components/ProtectedRoute";
import RequirePermission from "./shared/components/RequirePermission";
import P from "./shared/access/permissions";
import AdminLayout from "./layouts/AdminLayout";
import StaffLayout from "./layouts/StaffLayout";
import { useAuth } from "./shared/context/AuthContext";

import Login from "./features/auth/pages/Login";
import Dashboard from "./features/dashboard/pages/Dashboard";
import StaffDashboard from "./features/dashboard/pages/StaffDashboard";

import AcademicYears from "./features/academic/pages/AcademicYears";
import Configuration from "./features/academic/pages/Configuration";
import Calendar from "./features/academic/pages/Calendar";
import Standards from "./features/academic/pages/Standards";
import Subjects from "./features/academic/pages/Subjects";

import Students from "./features/students/pages/Students";
import StudentBulkCreate from "./features/students/pages/StudentBulkCreate";
import StudentEnrollmentReport from "./features/students/pages/StudentEnrollmentReport";
import StudentEnrollmentBulkCreate from "./features/students/pages/StudentEnrollmentBulkCreate";
import StudentEnrollmentEdit from "./features/students/pages/StudentEnrollmentEdit";

import AbsenceTypes from "./features/attendance/pages/AbsenceTypes";
import Attendance from "./features/attendance/pages/Attendance";
import Corrections from "./features/attendance/pages/Corrections";
import AttendanceDashboard from "./features/attendance/pages/AttendanceDashboard";
import AttendanceSessionGenerate from "./features/attendance/pages/AttendanceSessionGenerate";
import AttendanceCorrection from "./features/attendance/pages/AttendanceCorrection";
import AttendanceAdjustment from "./features/attendance/pages/AttendanceAdjustment";

import Timetable from "./features/timetable/pages/Timetable";
import TimetableSettings from "./features/timetable/pages/TimetableSettings";
import StaffTimetable from "./features/timetable/pages/StaffTimetable";

import Staff from "./features/staff/pages/Staff";
import Assignments from "./features/assignments/pages/Assignments";
import Reports from "./features/reports/pages/Reports";
import Settings from "./features/settings/pages/Settings";
import Users from "./features/users/pages/Users";
import Roles from "./features/users/pages/Roles";
import Placeholder from "./shared/components/Placeholder";

// import AttendanceDashboard from "./attendance/pages/AttendanceDashboard";
// import AttendanceCorrection from "./attendance/pages/AttendanceCorrection";
// import AttendanceAdjustment from "./attendance/pages/AttendanceAdjustment";
import AttendanceSessionList from "./features/attendance/pages/AttendanceSessionList";

import StaffStudentsPage from "./features/students/pages/StaffStudentsPage";


function ApplicationLayout() {
  const { portal } = useAuth();
  return portal === "admin" ? <AdminLayout /> : <StaffLayout />;
}

// Wraps a group of <Route>s in a permission check.
const Guard = ({ any, all, portal, children }) => (
  <Route element={<RequirePermission any={any} all={all} portal={portal} />}>{children}</Route>
);

export default function App() {
  const { portal } = useAuth();
  const isManager = portal === "admin";
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<ApplicationLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={isManager ? <Dashboard /> : <StaffDashboard />} />

          {/* Attendance administration */}
          {Guard({
            any: [P.REPORTS_ATTENDANCE_VIEW], portal: "admin",
            children: <Route path="/attendance" element={<AttendanceDashboard />} />,
          })}
          {Guard({
            any: [P.ATTENDANCE_SESSION_GENERATE], portal: "admin",
            children: [
              <Route key="s" path="/attendance/sessions" element={<AttendanceSessionList />} />,
              <Route key="g" path="/attendance/generate" element={<AttendanceSessionGenerate />} />,
            ],
          })}
          {Guard({
            any: [P.ATTENDANCE_CORRECT, P.ATTENDANCE_APPROVE_CORRECTION],
            children: [
              <Route key="c" path="/attendance/corrections" element={<Corrections />} />,
              <Route key="cd" path="/attendance/correction/:attendanceRecordId" element={<AttendanceCorrection />} />,
            ],
          })}
          {Guard({
            any: [P.ATTENDANCE_ADJUST],
            children: <Route path="/attendance/adjustment/:attendanceRecordId" element={<AttendanceAdjustment />} />,
          })}
          {Guard({
            any: [P.ATTENDANCE_MARK],
            children: <Route path="/mark" element={<Attendance />} />,
          })}

          {/* Academic */}
          {Guard({ any: [P.ACADEMIC_YEAR_VIEW], children: <Route path="/academic-years" element={<AcademicYears />} /> })}
          {Guard({ any: [P.PERIOD_VIEW], children: <Route path="/configuration" element={<Configuration />} /> })}
          {Guard({ any: [P.CALENDAR_VIEW], children: <Route path="/calendar" element={<Calendar />} /> })}
          {Guard({ any: [P.STANDARDS_VIEW], children: <Route path="/standards" element={<Standards />} /> })}
          {Guard({ any: [P.SUBJECTS_VIEW], children: <Route path="/subjects" element={<Subjects />} /> })}

          {/* Students */}
          {Guard({
            any: [P.STUDENTS_VIEW],
            children: <Route path="/students" element={isManager ? <Students /> : <StaffStudentsPage />} />,
          })}
          {Guard({
            any: [P.STUDENTS_CREATE], portal: "admin",
            children: <Route path="/students/bulk-create" element={<StudentBulkCreate />} />,
          })}
          {Guard({
            any: [P.STUDENTS_ENROLL], portal: "admin",
            children: [
              <Route key="r" path="/student-enrollments" element={<StudentEnrollmentReport />} />,
              <Route key="b" path="/student-enrollments/bulk-create" element={<StudentEnrollmentBulkCreate />} />,
              <Route key="e" path="/student-enrollments/:id/edit" element={<StudentEnrollmentEdit />} />,
            ],
          })}
          {Guard({ any: [P.ABSENCE_TYPE_VIEW], portal: "admin", children: <Route path="/absence-types" element={<AbsenceTypes />} /> })}

          {/* Timetable */}
          {Guard({
            any: [P.TIMETABLE_VIEW],
            children: <Route path="/timetable" element={isManager ? <Timetable /> : <StaffTimetable />} />,
          })}
          {Guard({
            any: [P.TIMETABLE_SETTINGS], portal: "admin",
            children: <Route path="/timetable/settings" element={<TimetableSettings />} />,
          })}

          {/* Staff & assignments */}
          {Guard({ any: [P.STAFF_VIEW], portal: "admin", children: <Route path="/staff" element={<Staff />} /> })}
          {Guard({ any: [P.STAFF_ASSIGNMENT_VIEW], portal: "admin", children: <Route path="/assignments" element={<Assignments />} /> })}

          {/* Users, roles & permissions */}
          {Guard({ any: [P.USERS_VIEW], portal: "admin", children: <Route path="/users" element={<Users />} /> })}
          {Guard({ any: [P.ROLES_VIEW], portal: "admin", children: <Route path="/roles" element={<Roles />} /> })}

          {/* Future modules (backend still scaffolds these) */}
          {Guard({
            any: ["staff_leave.view"],
            children: <Route path="/staff-leaves" element={<Placeholder title="Staff Leaves" endpoint="/staff-leaves" />} />,
          })}
          {Guard({
            any: ["student_leave.view"],
            children: <Route path="/student-leaves" element={<Placeholder title="Student Leaves" endpoint="/student-leaves" />} />,
          })}
          {Guard({
            any: ["substitution.view"],
            children: <Route path="/substitutions" element={<Placeholder title="Substitutions" endpoint="/substitutions" />} />,
          })}
          {Guard({
            any: [P.NOTIFICATIONS_VIEW],
            children: <Route path="/notifications" element={<Placeholder title="Notifications" endpoint="/notifications" />} />,
          })}

          {/* Reports */}
          {Guard({
            any: [P.REPORTS_ATTENDANCE_VIEW, P.REPORTS_AUDIT_VIEW],
            children: <Route path="/reports" element={<Reports />} />,
          })}

          {/* Account settings (password + appearance) - everyone */}
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
