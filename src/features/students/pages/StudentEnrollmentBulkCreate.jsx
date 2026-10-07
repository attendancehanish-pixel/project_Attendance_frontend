import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get } from "../../../shared/api/client";
import { studentEnrollmentApi } from "../api/student-enrollment.api";
import PageHeader from "../../../shared/components/PageHeader";

const statuses = ["ENROLLED", "PROMOTED", "GRADUATED", "WITHDRAWN"];
const blank = () => ({ admissionNo: "", rollNo: "" });

export default function StudentEnrollmentBulkCreate() {
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [standards, setStandards] = useState([]);
  const [yearId, setYearId] = useState("");
  const [standardId, setStandardId] = useState("");
  const [status, setStatus] = useState("ENROLLED");
  const [rows, setRows] = useState([blank()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([get("/academic-years"), get("/standards")]).then(([y,s]) => {
      const ys=y.data||[], ss=s.data||[];
      setYears(ys); setStandards(ss);
      const active=ys.find(x=>x.status==="ACTIVE");
      setYearId(active?.id || ys[0]?.id || "");
    }).catch(e=>setError(e.message));
  }, []);

  function update(i,key,value){ setRows(r=>r.map((x,n)=>n===i?{...x,[key]:value}:x)); }
  function add(){ setRows(r=>[...r,blank()]); }
  function remove(i){ setRows(r=>r.length===1?r:r.filter((_,n)=>n!==i)); }

  async function submit(e){
    e.preventDefault(); setError(""); setSuccess("");
    const clean=rows.map(r=>({admissionNo:r.admissionNo.trim(),rollNo:r.rollNo.trim()})).filter(r=>r.admissionNo||r.rollNo);
    if(!yearId||!standardId) return setError("Select an academic year and class.");
    if(!clean.length) return setError("Add at least one student.");
    setSaving(true);
    try {
      const res=await studentEnrollmentApi.bulkEnroll({academicYearId:yearId,standardId,status,enrollments:clean});
      setSuccess(res.message || `${clean.length} enrolments created.`);
      setRows([blank()]);
    } catch(e) {
      const detail=e?.details;
      const parts=[];
      if(detail?.missingStudents?.length) parts.push(`Unknown admission numbers: ${detail.missingStudents.map(x=>x.admissionNo).join(", ")}`);
      if(detail?.conflicts?.length) parts.push(detail.conflicts.map(x=>`Row ${x.row}: ${x.reason}`).join(" | "));
      setError(parts.join(" | ") || e.message || "Could not create enrolments.");
    } finally { setSaving(false); }
  }

  return <>
    <PageHeader title="Bulk enrol students" description="Place existing students into one class for the selected academic year. Academic year, class and status apply to the whole batch." action={<Link className="button" to="/student-enrollment">← Enrolment report</Link>} />
    <section className="enrollment-step-card">
      <div className="step"><b>1</b><div><strong>Choose context</strong><span>These values apply to every student below.</span></div></div>
      <div className="bulk-context-grid">
        <label>Academic year<select value={yearId} onChange={e=>setYearId(e.target.value)}><option value="">Select</option>{years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</select></label>
        <label>Class / Standard<select value={standardId} onChange={e=>setStandardId(e.target.value)}><option value="">Select</option>{standards.map(s=><option key={s.id} value={s.id}>{s.name||s.code}</option>)}</select></label>
        <label>Enrollment status<select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></label>
      </div>
    </section>

    <section className="enrollment-step-card">
      <div className="step"><b>2</b><div><strong>Add students</strong><span>Enter the admission number already stored in Students and assign a unique roll number.</span></div></div>
      {error && <div className="form-alert error">{error}</div>}
      {success && <div className="form-alert success">{success}</div>}
      <form onSubmit={submit}>
        <div className="bulk-table">
          <div className="bulk-row bulk-head"><span>#</span><span>Admission number</span><span>Roll number</span><span></span></div>
          {rows.map((r,i)=><div className="bulk-row" key={i}>
            <span className="row-number">{i+1}</span>
            <input autoFocus={i===0} value={r.admissionNo} onChange={e=>update(i,"admissionNo",e.target.value)} placeholder="STU00001" />
            <input value={r.rollNo} onChange={e=>update(i,"rollNo",e.target.value)} placeholder="1" />
            <button type="button" className="icon-remove" onClick={()=>remove(i)} disabled={rows.length===1} aria-label="Remove row">×</button>
          </div>)}
        </div>
        <div className="bulk-footer">
          <button type="button" className="button" onClick={add}>+ Add student</button>
          <div><Link className="button" to="/student-enrollment">Cancel</Link><button className="button primary" disabled={saving}>{saving?"Saving…":"Create enrolments"}</button></div>
        </div>
      </form>
    </section>
  </>;
}
