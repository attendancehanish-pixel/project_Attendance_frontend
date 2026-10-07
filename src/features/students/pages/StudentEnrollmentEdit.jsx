import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { studentEnrollmentApi } from "../api/student-enrollment.api";
import PageHeader from "../../../shared/components/PageHeader";
import { Loading, ErrorState } from "../../../shared/components/State";
import { humanStatus } from "../../../shared/utils/format";

const statuses=["ENROLLED","PROMOTED","GRADUATED","WITHDRAWN"];

export default function StudentEnrollmentEdit() {
  const { id }=useParams(); const navigate=useNavigate();
  const [record,setRecord]=useState(null); const [rollNo,setRollNo]=useState(""); const [status,setStatus]=useState("");
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [error,setError]=useState("");

  async function load(){ try { setError(""); const res=await studentEnrollmentApi.getById(id); const r=res.data; setRecord(r); setRollNo(r.rollNo||""); setStatus(r.status||"ENROLLED"); } catch(e){setError(e.message);} finally{setLoading(false);} }
  useEffect(()=>{load();},[id]);

  async function save(e){ e.preventDefault(); setSaving(true); setError(""); try{await studentEnrollmentApi.update(id,{rollNo:rollNo.trim(),status}); navigate("/student-enrollment");}catch(e){setError(e.message);}finally{setSaving(false);} }
  async function remove(){ if(!window.confirm("Remove this enrollment? If attendance history exists, the backend will reject the operation."))return; try{await studentEnrollmentApi.remove(id);navigate("/student-enrollment");}catch(e){setError(e.message);} }

  if(loading)return <Loading/>; if(!record)return <ErrorState error={error||"Enrollment not found"} onRetry={load}/>;
  return <>
    <PageHeader title="Edit enrollment" description="Update the roll number or enrollment status. Student, academic year and class are read-only." action={<Link className="button" to="/student-enrollment">← Back to report</Link>}/>
    {error&&<div className="form-alert error">{error}</div>}
    <section className="edit-enrollment-layout">
      <div className="card">
        <div className="record-title"><div className="student-avatar">{record.student?.name?.slice(0,1)?.toUpperCase()||"S"}</div><div><h3>{record.student?.name}</h3><p>{record.student?.admissionNo}</p></div></div>
        <div className="read-only-grid">
          <div><span>Academic year</span><strong>{record.academicYear?.name||"—"}</strong></div>
          <div><span>Class</span><strong>{record.standard?.name||record.standard?.code||"—"}</strong></div>
          <div><span>Email</span><strong>{record.student?.email||"—"}</strong></div>
          <div><span>Current status</span><strong>{humanStatus(record.status)}</strong></div>
        </div>
      </div>
      <div className="card">
        <h3>Enrollment details</h3>
        <p className="muted">Only the fields below can be changed.</p>
        <form className="form" onSubmit={save}>
          <label>Roll number<input value={rollNo} onChange={e=>setRollNo(e.target.value)} required /></label>
          <label>Status<select value={status} onChange={e=>setStatus(e.target.value)}>{statuses.map(s=><option key={s} value={s}>{humanStatus(s)}</option>)}</select></label>
          <div className="modal-actions"><button type="button" className="danger-outline" onClick={remove}>Remove enrollment</button><button className="button primary" disabled={saving}>{saving?"Saving…":"Save changes"}</button></div>
        </form>
      </div>
    </section>
  </>;
}
