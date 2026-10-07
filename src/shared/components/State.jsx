export function Loading() {
  return <div className="state-card">Loading…</div>;
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state-card error-state">
      <strong>Something went wrong</strong>
      <p>{error?.message || "Request failed."}</p>
      {onRetry && <button className="button" onClick={onRetry}>Retry</button>}
    </div>
  );
}

export function Empty({ children = "No records found." }) {
  return <div className="empty">{children}</div>;
}