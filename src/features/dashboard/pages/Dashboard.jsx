import { useEffect, useState } from "react";
import { get } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import { Loading, ErrorState } from "../../../shared/components/State";
import { dateOnly, humanStatus } from "../../../shared/utils/format";

export default function Dashboard() {
  const [years, setYears] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    try { setError(null); setYears((await get("/academic-years")).data || []); }
    catch (e) { setError(e); }
  }
  useEffect(() => { load(); }, []);

  if (!years) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  const active = years.find((x) => x.status === "ACTIVE");
  return (
    <>
      <PageHeader title="Dashboard" description="A quick view of your academic setup and attendance operations." />
      <div className="hero">
        <div>
          <span className="eyebrow">Current academic year</span>
          <h2>{active?.name || "No active academic year"}</h2>
          {active && <p>{dateOnly(active.startDate)} — {dateOnly(active.endDate)}</p>}
        </div>
        <span className={`status-badge ${String(active?.status || "draft").toLowerCase()}`}>{humanStatus(active?.status || "DRAFT")}</span>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><span>Academic years</span><strong>{years.length}</strong><small>Historical + current</small></div>
        <div className="stat-card"><span>Active year</span><strong>{active ? "1" : "0"}</strong><small>Only one should normally be active</small></div>
        <div className="stat-card"><span>Attendance</span><strong>Ready</strong><small>Session-based marking</small></div>
        <div className="stat-card"><span>Audit</span><strong>Enabled</strong><small>Corrections remain traceable</small></div>
      </div>
      <div className="info-grid">
        <div className="card"><h3>Recommended workflow</h3><ol className="steps"><li>Create academic year</li><li>Configure calendar and weekly offs</li><li>Create standards and subjects</li><li>Assign staff and timetable</li><li>Generate sessions and mark attendance</li></ol></div>
        <div className="card"><h3>Backend status</h3><p className="muted">This frontend is connected to the MVP API. Modules that are still scaffolded by the backend are shown as unavailable until their endpoints are implemented.</p></div>
      </div>
    </>
  );
}