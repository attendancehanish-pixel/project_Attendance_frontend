import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Guards admin-only routes (e.g. Attendance Dashboard) so staff users
// can't reach them directly by URL even though ProtectedRoute already
// confirmed they're logged in.
export default function RequireAdmin() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
