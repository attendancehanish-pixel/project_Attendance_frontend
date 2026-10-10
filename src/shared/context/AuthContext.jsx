import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    changePassword,
    endSession,
    hasPermission: (permission) => Boolean(user?.permissions?.includes(permission)),
    isAdmin: Boolean(user?.roles?.includes("ADMIN")),
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}