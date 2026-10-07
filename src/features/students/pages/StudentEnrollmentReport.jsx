import { useEffect, useMemo, useState } from "react";
import { get } from "../../../shared/api/client";
import { studentEnrollmentApi } from "../api/student-enrollment.api";
import PageHeader from "../../../shared/components/PageHeader";
import DataTable from "../../../shared/components/DataTable";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";
import { humanStatus } from "../../../shared/utils/format";
import { Link } from "react-router-dom";

const statusOptions = ["ENROLLED", "PROMOTED", "GRADUATED", "WITHDRAWN"];

export default function StudentEnrollmentReport() {
  const [years, setYears] = useState([]);
  const [standards, setStandards] = useState([]);
  const [yearId, setYearId] = useState("");
  const [standardId, setStandardId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadFilters() {
    const [y, s] = await Promise.all([get("/academic-years"), get("/standards")]);
    const ys = y.data || [], ss = s.data || [];
    setYears(ys); setStandards(ss);
    const active = ys.find(x => x.status === "ACTIVE");
    setYearId(active?.id || ys[0]?.id || "");
  }

  async function loadRows() {
    if (!yearId) return;
    setLoading(true);
    try {
      setError(null);
      const res = await studentEnrollmentApi.list({ academicYearId: yearId, standardId, status, search });
      setRows(res.data || []);
    } catch (e) { setError(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadFilters().catch(setError); }, []);
  useEffect(() => { if (yearId) loadRows(); }, [yearId, standardId, status]);

  const counts = useMemo(() => ({
    total: rows.length,
    enrolled: rows.filter(r => r.status === "ENROLLED").length,
    promoted: rows.filter(r => r.status === "PROMOTED").length,
    withdrawn: rows.filter(r => r.status === "WITHDRAWN").length,
  }), [rows]);

  if (loading && !rows.length && !error) return <Loading />;
  if (error && !rows.length) return <ErrorState error={error} onRetry={loadRows} />;

  return <>
    <PageHeader
      title="Student Enrolments"
      description="View and manage student placement for an academic year and class."
      action={<Link className="button primary" to="/student-enrollment/bulk">+ Bulk enrol students</Link>}
    />

    <section className="enrollment-toolbar">
      <div className="filter-group">
        <label>Academic year
          <select value={yearId} onChange={e => setYearId(e.target.value)}>
            <option value="">Select academic year</option>
            {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </label>
        <label>Class / Standard
          <select value={standardId} onChange={e => setStandardId(e.target.value)}>
            <option value="">All classes</option>
            {standards.map(s => <option key={s.id} value={s.id}>{s.name || s.code}</option>)}
          </select>
        </label>
        <label>Status
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {statusOptions.map(s => <option key={s} value={s}>{humanStatus(s)}</option>)}
          </select>
        </label>
        <label className="search-field">Search
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadRows()} placeholder="Admission no. or student name" />
        </label>
        <button className="button" onClick={loadRows}>Search</button>
      </div>
    </section>

    <div className="enrollment-stat-grid">
      <div className="enrollment-stat"><span>Total</span><strong>{counts.total}</strong><small>matching records</small></div>
      <div className="enrollment-stat"><span>Enrolled</span><strong>{counts.enrolled}</strong><small>currently enrolled</small></div>
      <div className="enrollment-stat"><span>Promoted</span><strong>{counts.promoted}</strong><small>promotion status</small></div>
      <div className="enrollment-stat"><span>Withdrawn</span><strong>{counts.withdrawn}</strong><small>not attending</small></div>
    </div>

    <section className="card enrollment-report-card">
      <div className="section-heading">
        <div><h3>Enrolment register</h3><p>{rows.length} record{rows.length === 1 ? "" : "s"} found</p></div>
      </div>
      {rows.length === 0 ? <Empty /> : <DataTable columns={[
        {key:"rollNo",label:"Roll No.",render:r=><strong>{r.rollNo}</strong>},
        {key:"admissionNo",label:"Admission No.",render:r=>r.student?.admissionNo || "—"},
        {key:"student",label:"Student",render:r=><div><strong>{r.student?.name || "—"}</strong><small className="table-secondary">{r.student?.email || ""}</small></div>},
        {key:"standard",label:"Class",render:r=>r.standard?.name || r.standard?.code || "—"},
        {key:"status",label:"Status",render:r=><span className={`status-badge ${String(r.status||"").toLowerCase()}`}>{humanStatus(r.status)}</span>},
        {key:"actions",label:"",render:r=><Link className="text-button" to={`/student-enrollment/edit/${r.id}`}>Edit</Link>}
      ]} rows={rows} />}
    </section>
  </>;
}
