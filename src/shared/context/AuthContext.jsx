import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { get, post, setAccessToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    get("/auth/me")
      .then((r) => setUser(r.user))
      .catch(() => setAccessToken(null))
      .finally(() => setLoading(false));
  }, []);

  // Re-read the signed-in user's roles/permissions. An administrator can change
  // someone's access while they are logged in, so we refresh whenever the tab
  // regains focus. The API enforces permissions on every request regardless.
  const refreshUser = useCallback(async () => {
    try {
      const r = await get("/auth/me");
      setUser(r.user);
    } catch (e) {
      if (e.status === 401) {
        setAccessToken(null);
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const onFocus = () => refreshUser();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [user?.id, refreshUser]);

  async function login(email, password) {
    const result = await post("/auth/login", { email, password });
    setAccessToken(result.accessToken);
    setUser(result.user);
    return result.user;
  }

  async function logout() {
    try { await post("/auth/logout"); } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  // POST /auth/change-password. The backend revokes every refresh token on
  // success, so the caller must follow up with endSession() (see Settings).
  async function changePassword(currentPassword, newPassword) {
    return post("/auth/change-password", { currentPassword, newPassword });
  }

  // Drop the local session without calling /auth/logout (the server already
  // revoked the refresh tokens). ProtectedRoute then redirects to /login.
  function endSession() {
    setAccessToken(null);
    setUser(null);
  }

  const value = useMemo(() => {
    const granted = new Set(user?.permissions || []);
    const hasPermission = (permission) => granted.has(permission);
    return {
      user,
      loading,
      login,
      logout,
      changePassword,
      endSession,
      refreshUser,
      hasPermission,
      // true when the user holds at least one of the listed permissions
      hasAny: (list = []) => list.length === 0 || list.some(hasPermission),
      hasAll: (list = []) => list.every(hasPermission),
      isAdmin: Boolean(user?.roles?.includes("ADMIN")),
      // "admin" = management portal (sidebar limited to granted menus),
      // "staff" = teacher portal. Decided by the API from the permissions.
      portal: user?.portal === "admin" ? "admin" : "staff",
    };
  }, [user, loading, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
