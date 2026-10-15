import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import { Loading, ErrorState } from "../../../shared/components/State";
import { dateOnly, humanStatus } from "../../../shared/utils/format";
import { useAuth } from "../../../shared/context/AuthContext";
import P from "../../../shared/access/permissions";
import { visibleNav } from "../../../shared/access/navigation";

export default function Dashboard() {
  const { user, hasPermission, hasAny } = useAuth();
  const canSeeYears = hasPermission(P.ACADEMIC_YEAR_VIEW);
  const [years, setYears] = useState(canSeeYears ? null : []);
  const [error, setError] = useState(null);

  async function load() {
    if (!canSeeYears) return;
    try { setError(null); setYears((await get("/academic-years")).data || []); }
    catch (e) { setError(e); }
  }
  useEffect(() => { load(); }, [canSeeYears]);

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!years) return <Loading />;

  const active = years.find((x) => x.status === "ACTIVE");
  // Everything this person can open, except the dashboard itself.
  const links = visibleNav(hasAny)
    .map((section) => ({ ...section, items: section.items.filter((i) => i.to !== "/dashboard") }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <PageHeader title={`Welcome, ${user?.name?.split(" ")[0] || ""}`} description="Here is what you can work on with your account." />

      {canSeeYears && (
        <div className="hero">
          <div>
            <span className="eyebrow">Current academic year</span>
            <h2>{active?.name || "No active academic year"}</h2>
            {active && <p>{dateOnly(active.startDate)} — {dateOnly(active.endDate)}</p>}
          </div>
          <span className={`status-badge ${String(active?.status || "draft").toLowerCase()}`}>{humanStatus(active?.status || "DRAFT")}</span>
        </div>
      )}

      {links.length === 0 ? (
        <div className="card"><p className="muted">Your account does not have access to any sections yet. Ask an administrator to assign permissions.</p></div>
      ) : (
        <div className="info-grid">
          {links.map((section) => (
            <div className="card" key={section.label}>
              <h3>{section.label}</h3>
              <ul className="steps" style={{ listStyle: "none", paddingLeft: 0 }}>
                {section.items.map((item) => (
                  <li key={item.to}><Link to={item.to}>{item.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
