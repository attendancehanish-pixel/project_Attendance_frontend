import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./shared/components/ProtectedRoute";
import RequireAdmin from "./shared/components/RequireAdmin";
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
import Placeholder from "./shared/components/Placeholder";

// import AttendanceDashboard from "./attendance/pages/AttendanceDashboard";
// import AttendanceCorrection from "./attendance/pages/AttendanceCorrection";
// import AttendanceAdjustment from "./attendance/pages/AttendanceAdjustment";
import AttendanceSessionList from "./features/attendance/pages/AttendanceSessionList";

import StaffStudentsPage from "./features/students/pages/StaffStudentsPage";


function ApplicationLayout() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminLayout /> : <StaffLayout />;
}

export default function App() {
  const { isAdmin } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<ApplicationLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={isAdmin ? <Dashboard /> : <StaffDashboard />} />

          {/* Admin-only */}
          <Route element={<RequireAdmin />}>
            <Route path="/attendance" element={<AttendanceDashboard />} />
            <Route path="/attendance/sessions" element={<AttendanceSessionList />} />
            <Route path="/attendance/generate" element={<AttendanceSessionGenerate />} />
            <Route path="/attendance/correction/:attendanceRecordId" element={<AttendanceCorrection />} />
            <Route path="/attendance/adjustment/:attendanceRecordId" element={<AttendanceAdjustment />} />
          </Route>

          {/* Academic */}
          <Route path="/academic-years" element={<AcademicYears />} />
          <Route path="/configuration" element={<Configuration />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/standards" element={<Standards />} />
          <Route path="/subjects" element={<Subjects />} />

          {/* Students */}
          <Route path="/students" element={isAdmin ? <Students /> : <StaffStudentsPage />} />
          <Route path="/student-enrollments" element={<StudentEnrollmentReport />} />
          <Route path="/student-enrollments/bulk-create" element={<StudentEnrollmentBulkCreate />} />
          <Route path="/student-enrollments/:id/edit" element={<StudentEnrollmentEdit />} />



          {/* Attendance */}
          <Route path="/absence-types" element={<AbsenceTypes />} />
          <Route path="/mark" element={<Attendance />} />
          <Route path="/attendance/corrections" element={<Corrections />} />

          {/* Timetable */}
          <Route path="/timetable" element={isAdmin ? <Timetable /> : <StaffTimetable />} />
          <Route path="/timetable/settings" element={<TimetableSettings />} />

          {/* Staff & assignments */}
          <Route path="/staff" element={<Staff />} />
          <Route path="/assignments" element={<Assignments />} />

          {/* Future modules */}
          <Route path="/staff-leaves" element={<Placeholder title="Staff Leaves" endpoint="/staff-leaves" />} />
          <Route path="/student-leaves" element={<Placeholder title="Student Leaves" endpoint="/student-leaves" />} />
          <Route path="/substitutions" element={<Placeholder title="Substitutions" endpoint="/substitutions" />} />
          <Route path="/notifications" element={<Placeholder title="Notifications" endpoint="/notifications" />} />

          {/* Reports */}
          <Route path="/reports" element={<Reports />} />

          {/* Account settings (password + appearance) – admin and staff */}
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
