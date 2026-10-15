import { useAuth } from "../context/AuthContext";

// <Can any={[P.STAFF_CREATE]}><button/></Can>  -> renders children only if allowed
export default function Can({ any, all, children, fallback = null }) {
  const { hasAny, hasAll } = useAuth();
  const ok = (!any || hasAny(any)) && (!all || hasAll(all));
  return ok ? children : fallback;
}
