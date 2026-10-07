import {useNavigate} from "react-router-dom";
import {useState} from "react";
import {absenceTypes,correctionMock} from "../mockData";
import StatusBadge from "../components/StatusBadge";

export default function AttendanceCorrection(){
  const navigate=useNavigate();
  const [newStatus,setNewStatus]=useState(correctionMock.currentAttendance.status);
  const [absenceType,setAbsenceType]=useState("medical");
  const [reason,setReason]=useState("");
  const [submitted,setSubmitted]=useState(false);
  const isAbsent=newStatus==="ABSENT";

  return <div className="min-h-screen bg-slate-950 text-slate-100"><div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
    <button onClick={()=>navigate(-1)} className="mb-6 text-sm text-slate-400 hover:text-white">← Back</button>
    <div className="mb-8"><p className="text-xs uppercase tracking-[0.2em] text-slate-500">Attendance</p><h1 className="mt-2 text-2xl font-semibold">Correct attendance</h1><p className="mt-2 text-sm text-slate-400">Correct an already submitted student attendance record. The original record remains in audit history.</p></div>
    {submitted&&<div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Mock correction submitted successfully. No backend request was made.</div>}
    <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"><Title title="Attendance record" sub="Original submitted data"/>
        <div className="mt-6 space-y-5"><div><p className="text-xs text-slate-500">Student</p><p className="mt-1 text-lg font-medium">{correctionMock.student.name}</p><p className="text-sm text-slate-500">Roll no. {correctionMock.student.rollNo}</p></div>
        <div className="grid grid-cols-2 gap-4"><Info label="Date" value={correctionMock.session.date}/><Info label="Period" value={`Period ${correctionMock.session.period}`}/><Info label="Class" value={correctionMock.session.className}/><Info label="Subject" value={correctionMock.session.subject}/><Info label="Staff" value={correctionMock.session.staff}/><Info label="Session status" value={correctionMock.session.status}/></div>
        <div className="border-t border-slate-800 pt-5"><p className="mb-2 text-xs text-slate-500">Current attendance</p><StatusBadge status={correctionMock.currentAttendance.status}/>
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="grid gap-4 sm:grid-cols-2"><Info label="Absence type" value={correctionMock.currentAttendance.absenceType}/><Info label="Marked by" value={correctionMock.currentAttendance.markedBy}/><Info label="Marked at" value={correctionMock.currentAttendance.markedAt}/></div><div className="mt-4"><p className="text-xs text-slate-500">Remarks</p><p className="mt-1 text-sm text-slate-300">{correctionMock.currentAttendance.remarks}</p></div></div>
        </div></div>
      </section>
      <form onSubmit={e=>{e.preventDefault();setSubmitted(true)}} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"><Title title="Make correction" sub="Enter the corrected attendance information"/>
        <div className="mt-6 space-y-6"><div><label className="mb-2 block text-sm font-medium">New attendance status</label><div className="grid grid-cols-2 gap-3">{["PRESENT","ABSENT"].map(x=><button type="button" key={x} onClick={()=>setNewStatus(x)} className={`rounded-xl border px-4 py-3 text-sm font-medium ${newStatus===x?"border-slate-500 bg-slate-800":"border-slate-800 bg-slate-950/50 text-slate-500"}`}>{x==="PRESENT"?"Present":"Absent"}</button>)}</div></div>
        {isAbsent&&<div><label className="mb-2 block text-sm font-medium">Absence type</label><select value={absenceType} onChange={e=>setAbsenceType(e.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm"><option value="medical">Medical</option>{absenceTypes.filter(x=>x.id!=="medical").map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div>}
        <div><label className="mb-2 block text-sm font-medium">Correction reason</label><textarea required value={reason} onChange={e=>setReason(e.target.value)} rows={5} placeholder="Explain why the attendance record needs to be corrected..." className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm placeholder:text-slate-600"/></div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">Current: <b>{correctionMock.currentAttendance.status}</b> → New: <b>{newStatus}</b></div>
        <div className="flex justify-end gap-3"><button type="button" onClick={()=>navigate(-1)} className="rounded-xl border border-slate-700 px-5 py-3 text-sm">Cancel</button><button className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-950">Submit correction</button></div>
        </div>
      </form>
    </div>
  </div></div>;
}
function Title({title,sub}){return <div><h2 className="text-base font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-500">{sub}</p></div>}
function Info({label,value}){return <div><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-sm text-slate-200">{value}</p></div>}
