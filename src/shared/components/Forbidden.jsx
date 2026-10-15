import { Link } from "react-router-dom";

export default function Forbidden() {
  return (
    <div className="state-card error-state">
      <strong>You don't have access to this page</strong>
      <p>Your account has not been given permission to use this section. Ask an administrator if you need it.</p>
      <Link className="button" to="/dashboard">Back to dashboard</Link>
    </div>
  );
}
