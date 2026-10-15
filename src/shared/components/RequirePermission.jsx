import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Forbidden from "./Forbidden";

// Route guard.
//   any    - user needs at least one of these permissions
//   all    - user needs every one of these permissions
//   portal - "admin" restricts the route to management-portal users (teachers
//            who happen to hold a view permission are not let in by URL)
export default function RequirePermission({ any, all, portal, children }) {
  const { hasAny, hasAll, portal: myPortal } = useAuth();
  const allowed =
    (!any || hasAny(any)) &&
    (!all || hasAll(all)) &&
    (!portal || portal === myPortal);
  if (!allowed) return <Forbidden />;
  return children ?? <Outlet />;
}
