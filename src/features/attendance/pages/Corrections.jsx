import { useEffect, useState } from "react";
import { get, post } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import DataTable from "../../../shared/components/DataTable";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";
import { dateOnly, humanStatus } from "../../../shared/utils/format";

export default function Corrections(){
  const [form,setForm]=useState({attendanceRecordId:"",oldStatus:"ABSENT",newStatus:"PRESENT",oldAbsenceTypeId:"",newAbsenceTypeId:"",reason:""});
  const [rows,setRows]=useState(null),[types,setTypes]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState(null);

  async function load(){
    try{
      setError(null);
      const [r,t]=await Promise.all([
        get("/attendance/corrections").catch(()=>({data:[]})),
        get("/absence-types")
      ]);
      setRows(r.data||[]);
      setTypes(t.data||[]);
    }catch(e){setError(e)}
  }
  useEffect(()=>{load()},[]);

  async function submit(e){
    e.preventDefault();setBusy(true);
    try{
      await post("/attendance/corrections",{
        attendanceRecordId:form.attendanceRecordId,
        oldStatus:form.oldStatus,
        newStatus:form.newStatus,
        oldAbsenceTypeId:form.oldStatus==="ABSENT"?form.oldAbsenceTypeId||undefined:undefined,
        newAbsenceTypeId:form.newStatus==="ABSENT"?form.newAbsenceTypeId||undefined:undefined,
        reason:form.reason
      });
      alert("Correction submitted.");
      setForm({...form,attendanceRecordId:"",reason:""});
      await load();
    }catch(e){alert(e.message)}finally{setBusy(false)}
  }

  async function review(id, action){
    try{
      await post(`/attendance/corrections/${id}/${action}`);
      await load();
    }catch(e){alert(e.message)}
  }

  if(rows===null)return <Loading/>;
  if(error)return <ErrorState error={error} onRetry={load}/>;

  return <>
    <PageHeader title="Attendance Corrections" description="Corrections are separate from the original attendance fact. Approval and audit history are handled by authorized attendance managers."/>

    <div className="card narrow">
      <form className="form" onSubmit={submit}>
        <label>Attendance record ID
          <input value={form.attendanceRecordId} onChange={e=>setForm({...form,attendanceRecordId:e.target.value})} placeholder="UUID" required/>
        </label>

        <div className="form-grid">
          <label>Old status
            <select value={form.oldStatus} onChange={e=>setForm({...form,oldStatus:e.target.value})}>
              <option>PRESENT</option><option>ABSENT</option>
            </select>
          </label>
          <label>New status
            <select value={form.newStatus} onChange={e=>setForm({...form,newStatus:e.target.value})}>
              <option>PRESENT</option><option>ABSENT</option>
            </select>
          </label>
        </div>

        {(form.oldStatus==="ABSENT"||form.newStatus==="ABSENT")&&<div className="form-grid">
          <label>Old absence type
            <select value={form.oldAbsenceTypeId} onChange={e=>setForm({...form,oldAbsenceTypeId:e.target.value})}>
              <option value="">None</option>
              {types.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label>New absence type
            <select value={form.newAbsenceTypeId} onChange={e=>setForm({...form,newAbsenceTypeId:e.target.value})}>
              <option value="">None</option>
              {types.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
        </div>}

        <label>Reason
          <textarea value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} required placeholder="Explain why this correction is required."/>
        </label>
        <button className="button primary" disabled={busy}>{busy?"Submitting…":"Request correction"}</button>
      </form>
    </div>

    <div className="card">
      <div className="table-headline"><div><span className="eyebrow">Correction queue</span><h3>Recent requests</h3></div></div>
      {rows.length===0?<Empty>No correction requests returned.</Empty>:
        <DataTable columns={[
          {key:"attendanceRecordId",label:"Attendance record",render:r=>r.attendanceRecordId},
          {key:"change",label:"Change",render:r=><>{humanStatus(r.oldStatus)} → {humanStatus(r.newStatus)}</>},
          {key:"reason",label:"Reason",render:r=>r.reason||"—"},
          {key:"status",label:"Status",render:r=><span className="status-badge">{humanStatus(r.status)}</span>},
          {key:"actions",label:"Actions",render:r=>r.status==="PENDING"?<div className="row-actions"><button className="text-button" onClick={()=>review(r.id,"approve")}>Approve</button><button className="danger-text" onClick={()=>review(r.id,"reject")}>Reject</button></div>:null}
        ]} rows={rows}/>
      }
    </div>
  </>;
}
