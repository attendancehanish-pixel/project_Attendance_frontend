import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/context/AuthContext";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // One-time notice left by Settings after a successful password change.
  const [notice] = useState(() => {
    try {
      return sessionStorage.getItem("ca-notice") === "password-changed"
        ? "Your password was updated. Please sign in with your new password."
        : "";
    } catch {
      return "";
    }
  });

  useEffect(() => {
    try {
      sessionStorage.removeItem("ca-notice");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      // Don't send people straight back to the change-password screen.
      const from = location.state?.from;
      navigate(from && from !== "/settings" ? from : "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <div className="brand large">
          <div className="brand-mark">CA</div>
          <div>
            <strong>College Attendance</strong>
            <span>Secure administration portal</span>
          </div>
        </div>
        <div className="login-copy">
          <span className="eyebrow">Welcome back</span>
          <h1>Sign in to your portal</h1>
          <p>Manage academic years, timetables, students and attendance from one place.</p>
        </div>
        <form onSubmit={submit} className="form">
          <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" required /></label>
          <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required /></label>
          {notice && !error && <div className="form-alert success" role="status">{notice}</div>}
          {error && <div className="form-error">{error}</div>}
          <button className="button primary large-button" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </div>
      <div className="login-art">
        <div className="art-card">
          <span className="eyebrow">Built around your academic calendar</span>
          <h2>Attendance stays tied to the correct year, standard, subject and period.</h2>
          <div className="mini-flow"><span>Academic year</span><b>→</b><span>Timetable</span><b>→</b><span>Session</span><b>→</b><span>Attendance</span></div>
        </div>
      </div>
    </div>
  );
}