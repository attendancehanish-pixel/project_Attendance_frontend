import { useState } from "react";
import { get } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";

export default function Reports(){
  const [result,setResult]=useState(null),[busy,setBusy]=useState(false);
  async function run(type){setBusy(true);try{setResult(await get(`/reports/${type}`))}catch(e){setResult({message:e.message})}finally{setBusy(false)}}
  return <><PageHeader title="Reports" description="Run attendance and audit report endpoints exposed by the backend."/><div className="stat-grid"><button className="report-card" onClick={()=>run("attendance")}><span>Attendance report</span><strong>View</strong><small>Subject/student attendance overview</small></button><button className="report-card" onClick={()=>run("audit")}><span>Audit report</span><strong>View</strong><small>Attendance corrections and historical actions</small></button></div>{result&&<div className="card report-result"><h3>Response</h3><pre>{JSON.stringify(result,null,2)}</pre></div>}{busy&&<p className="muted">Running report…</p>}</>
}