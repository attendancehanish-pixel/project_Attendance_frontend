import { useEffect, useMemo, useState } from "react";
import { get } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import Modal from "../../../shared/components/Modal";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";
import { timetableApi, periodApi } from "../../../features/attendance/api/attendance-setup.api";
import { humanStatus } from "../../../shared/utils/format";

const DAYS=[["SUNDAY","SUNDAY"],["MONDAY","MONDAY"],["TUESDAY","TUESDAY"],["WEDNESDAY","WEDNESDAY"],["THURSDAY","THURSDAY"],["FRIDAY","FRIDAY"],["SATURDAY","SATURDAY"]];
const DAY_NUM={SUNDAY:0,MONDAY:1,TUESDAY:2,WEDNESDAY:3,THURSDAY:4,FRIDAY:5,SATURDAY:6};

export default function Timetable(){
  const [years,setYears]=useState([]),[yearId,setYearId]=useState("");
  const [standards,setStandards]=useState([]),[standardId,setStandardId]=useState("");
  const [subjects,setSubjects]=useState([]),[periods,setPeriods]=useState([]),[weekly,setWeekly]=useState([]);
  const [entries,setEntries]=useState(null),[dateEntries,setDateEntries]=useState([]);
  const [mode,setMode]=useState("normal"),[selectedDay,setSelectedDay]=useState("MONDAY");
  const [selectedDate,setSelectedDate]=useState(new Date().toISOString().slice(0,10));
  const [modal,setModal]=useState(null),[editing,setEditing]=useState(null),[saving,setSaving]=useState(false),[error,setError]=useState(null),[validation,setValidation]=useState(null);
  const [form,setForm]=useState({weekday:"MONDAY",periodId:"",subjectId:"",attendanceRequired:true});
  const [dateForm,setDateForm]=useState({calendarDate:"",periodId:"",subjectId:"",attendanceRequired:true});

  async function loadYears(){
    const y=(await get("/academic-years")).data||[];setYears(y);
    if(!yearId)setYearId(y.find(x=>x.status==="ACTIVE")?.id||y[0]?.id||"");
  }
  async function loadBase(){
    if(!yearId)return;
    try{
      setError(null);
      const [s,sub,w]=await Promise.all([get("/standards"),get("/subjects"),get(`/weekly-holidays/${yearId}`)]);
      setStandards(s.data||[]);setSubjects(sub.data||[]);setWeekly((w.data||[]).map(x=>x.weekday));
      if(!standardId&&(s.data||[])[0])setStandardId(s.data[0].id);
    }catch(e){setError(e)}
  }
  async function loadNormal(){
    if(!yearId||!standardId)return;
    try{
      const [t,p]=await Promise.all([timetableApi.list(yearId,standardId),periodApi.list(yearId)]);
      setEntries(t.data||[]);setPeriods(p.data||[]);
    }catch(e){setError(e)}
  }
  async function loadDate(){
    if(!yearId||!standardId||!selectedDate)return;
    try{setDateEntries((await timetableApi.listDateSpecific(yearId,selectedDate,standardId)).data||[])}catch(e){setError(e)}
  }
  useEffect(()=>{loadYears().catch(setError)},[]);
  useEffect(()=>{loadBase()},[yearId]);
  useEffect(()=>{loadNormal()},[yearId,standardId]);
  useEffect(()=>{loadDate()},[yearId,standardId,selectedDate]);

  const dayPeriods=useMemo(()=>periods.filter(p=>String(p.weekday)===selectedDay).sort((a,b)=>a.periodIndex-b.periodIndex),[periods,selectedDay]);
  const byDay=useMemo(()=>{
    const m=new Map(DAYS.map(([d])=>[d,[]]));
    (entries||[]).forEach(e=>{if(m.has(e.weekday))m.get(e.weekday).push(e)});
    for(const list of m.values())list.sort((a,b)=>(a.period?.periodIndex||999)-(b.period?.periodIndex||999));
    return m;
  },[entries]);

  function openNormal(day="MONDAY"){
    setEditing(null);setSelectedDay(day);
    setForm({weekday:day,periodId:"",subjectId:"",attendanceRequired:true});setModal("normal");
  }
  function openDate(){
    setEditing(null);
    setDateForm({calendarDate:selectedDate,periodId:"",subjectId:"",attendanceRequired:true});setModal("date");
  }
  async function saveNormal(e){
    e.preventDefault();setSaving(true);
    try{
      const body={academicYearId:yearId,standardId,weekday:form.weekday,periodId:form.periodId,subjectId:form.subjectId,attendanceRequired:form.attendanceRequired};
      if(editing)await timetableApi.update(editing.id,body);else await timetableApi.create(body);
      setModal(null);await loadNormal();
    }catch(e){alert(e.message)}finally{setSaving(false)}
  }
  async function saveDate(e){
    e.preventDefault();setSaving(true);
    try{
      const body={calendarDate:new Date(`${dateForm.calendarDate}T00:00:00`).toISOString(),standardId,periodId:dateForm.periodId,subjectId:dateForm.subjectId,attendanceRequired:dateForm.attendanceRequired};
      if(editing)await timetableApi.updateDateSpecific(editing.id,body);else await timetableApi.createDateSpecific(yearId,body);
      setModal(null);await loadDate();
    }catch(e){alert(e.message)}finally{setSaving(false)}
  }
  async function removeNormal(id){if(!confirm("Delete this recurring timetable entry?"))return;try{await timetableApi.delete(id);await loadNormal()}catch(e){alert(e.message)}}
  async function removeDate(id){if(!confirm("Delete this date-specific timetable entry?"))return;try{await timetableApi.deleteDateSpecific(id);await loadDate()}catch(e){alert(e.message)}}
  async function validate(){try{setValidation((await timetableApi.validate(yearId)).data)}catch(e){setValidation({valid:false,errors:e.body?.details||[e.message]})}}
  async function publish(){try{await timetableApi.publish(yearId);alert("Timetable published.")}catch(e){alert(e.message)}}

  if(!years.length&&!error)return <Loading/>;
  return <>
    <PageHeader title="Timetable" description="Configure the recurring weekly timetable separately from one-off date-specific schedules."
      action={<div className="row-actions"><button className="button" onClick={validate} disabled={!yearId}>Validate</button><button className="button primary" onClick={publish} disabled={!yearId}>Publish</button></div>}/>
    <div className="toolbar timetable-toolbar">
      <label className="inline-label">Academic year<select value={yearId} onChange={e=>setYearId(e.target.value)}>{years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</select></label>
      <label className="inline-label">Standard<select value={standardId} onChange={e=>setStandardId(e.target.value)}>{standards.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
    </div>
    {error&&<ErrorState error={error} onRetry={()=>{loadBase();loadNormal();loadDate()}}/>}
    <div className="card timetable-mode-tabs">
      <button className={`button ${mode==="normal"?"primary":""}`} onClick={()=>setMode("normal")}>Recurring timetable</button>
      <button className={`button ${mode==="date"?"primary":""}`} onClick={()=>setMode("date")}>Date-specific timetable</button>
    </div>

    {mode==="normal"?<div className="card">
      <div className="table-headline"><div><span className="eyebrow">NORMAL_TIMETABLE</span><h3>{standards.find(s=>s.id===standardId)?.name||"Select a standard"}</h3></div><button className="button primary" disabled={!standardId} onClick={()=>openNormal(selectedDay)}>+ Add period</button></div>
      <div className="timetable-grid">
        {DAYS.map(([day])=>{const holiday=weekly.includes(day);const list=byDay.get(day)||[];return <div className={`day-column ${holiday?"weekly-holiday-column":""}`} key={day}>
          <div className="day-header"><strong>{humanStatus(day)}</strong>{holiday&&<span className="status-badge">Weekly holiday</span>}<button className="text-button" onClick={()=>openNormal(day)}>+ Add</button></div>
          {list.length===0?<div className="day-empty">{holiday?"No recurring periods":"No periods"}</div>:list.map(e=><div className="period-card" key={e.id}>
            <div className="period-index">P{e.period?.periodIndex??"?"}</div><div className="period-main"><strong>{e.subject?.name||e.subjectId}</strong><span>{e.period?.startTime||""} – {e.period?.endTime||""}</span></div>
            <div className="period-flags">{!e.attendanceRequired&&<span className="status-badge absent">No attendance</span>}</div>
            <div className="row-actions"><button className="text-button" onClick={()=>{setEditing(e);setForm({weekday:e.weekday,periodId:e.periodId,subjectId:e.subjectId,attendanceRequired:e.attendanceRequired});setModal("normal")}}>Edit</button><button className="danger-text" onClick={()=>removeNormal(e.id)}>Delete</button></div>
          </div>)}
        </div>})}
      </div>
      <div className="callout">Recurring entries describe the normal week. They are never converted into date-specific entries. A substitute teacher is handled separately and does not change this source.</div>
    </div>:<div className="card">
      <div className="table-headline"><div><span className="eyebrow">DATE_SPECIFIC_TIMETABLE</span><h3>One-off schedule</h3></div><button className="button primary" disabled={!standardId} onClick={openDate}>+ Add date-specific period</button></div>
      <div className="toolbar"><label className="inline-label">Date<input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></label></div>
      {dateEntries.length===0?<Empty>No date-specific timetable entries for this standard on {selectedDate}.</Empty>:<div className="table-wrap"><table><thead><tr><th>Period</th><th>Subject</th><th>Time</th><th>Attendance</th><th>Actions</th></tr></thead><tbody>
        {dateEntries.sort((a,b)=>(a.period?.periodIndex||999)-(b.period?.periodIndex||999)).map(e=><tr key={e.id}><td>P{e.period?.periodIndex??"?"}</td><td>{e.subject?.name||e.subjectId}</td><td>{e.period?.startTime||""} – {e.period?.endTime||""}</td><td>{e.attendanceRequired?"Required":"Not required"}</td><td><div className="row-actions"><button className="text-button" onClick={()=>{setEditing(e);setDateForm({calendarDate:selectedDate,periodId:e.periodId,subjectId:e.subjectId,attendanceRequired:e.attendanceRequired});setModal("date")}}>Edit</button><button className="danger-text" onClick={()=>removeDate(e.id)}>Delete</button></div></td></tr>)}
      </tbody></table></div>}
      <div className="callout">Use this for a special working Sunday, an examination-day schedule, or any other one-off timetable. The backend marks resulting attendance sessions as DATE_SPECIFIC_TIMETABLE.</div>
    </div>}
    {validation&&<div className={`callout ${validation.valid?"validation-ok":"validation-error"}`}><strong>{validation.valid?"Timetable is valid":"Timetable validation found issues"}</strong>{validation.errors?.length>0&&<ul>{validation.errors.map((x,i)=><li key={i}>{typeof x==="string"?x:(x.message||JSON.stringify(x))}</li>)}</ul>}</div>}

    {modal==="normal"&&<Modal title={editing?"Edit recurring timetable entry":"Add recurring timetable entry"} onClose={()=>setModal(null)}><form className="form" onSubmit={saveNormal}>
      <label>Weekday<select value={form.weekday} onChange={e=>{setSelectedDay(e.target.value);setForm({...form,weekday:e.target.value,periodId:""})}}>{DAYS.map(([d])=><option key={d} value={d}>{humanStatus(d)}{weekly.includes(d)?" — weekly holiday":""}</option>)}</select></label>
      <label>Period<select value={form.periodId} onChange={e=>setForm({...form,periodId:e.target.value})} required><option value="">Select period</option>{periods.filter(p=>String(p.weekday)===form.weekday).sort((a,b)=>a.periodIndex-b.periodIndex).map(p=><option key={p.id} value={p.id}>P{p.periodIndex} ({p.startTime}–{p.endTime})</option>)}</select></label>
      <label>Subject<select value={form.subjectId} onChange={e=>setForm({...form,subjectId:e.target.value})} required><option value="">Select subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label className="check-card"><input type="checkbox" checked={form.attendanceRequired} onChange={e=>setForm({...form,attendanceRequired:e.target.checked})}/><span><strong>Attendance required</strong><small>Disable for periods that should not create attendance sessions.</small></span></label>
      <div className="callout">{weekly.includes(form.weekday)?"This weekday is a weekly holiday. The backend will reject a recurring entry unless its calendar rules permit it. For a one-off working day, prefer the Date-specific timetable.":"This is a recurring weekly entry."}</div>
      <div className="modal-actions"><button type="button" className="button" onClick={()=>setModal(null)}>Cancel</button><button className="button primary" disabled={saving}>{saving?"Saving…":"Save"}</button></div>
    </form></Modal>}
    {modal==="date"&&<Modal title={editing?"Edit date-specific entry":"Add date-specific entry"} onClose={()=>setModal(null)}><form className="form" onSubmit={saveDate}>
      <label>Date<input type="date" value={dateForm.calendarDate} onChange={e=>setDateForm({...dateForm,calendarDate:e.target.value})} required/></label>
      <label>Period<select value={dateForm.periodId} onChange={e=>setDateForm({...dateForm,periodId:e.target.value})} required><option value="">Select period</option>{periods.filter(p=>String(p.weekday)===DAYS[new Date(`${dateForm.calendarDate}T00:00:00`).getDay()]?.[0]).sort((a,b)=>a.periodIndex-b.periodIndex).map(p=><option key={p.id} value={p.id}>P{p.periodIndex} ({p.startTime}–{p.endTime})</option>)}</select></label>
      <label>Subject<select value={dateForm.subjectId} onChange={e=>setDateForm({...dateForm,subjectId:e.target.value})} required><option value="">Select subject</option>{subjects.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label className="check-card"><input type="checkbox" checked={dateForm.attendanceRequired} onChange={e=>setDateForm({...dateForm,attendanceRequired:e.target.checked})}/><span><strong>Attendance required</strong><small>Only enabled entries can lead to an attendance session.</small></span></label>
      <div className="modal-actions"><button type="button" className="button" onClick={()=>setModal(null)}>Cancel</button><button className="button primary" disabled={saving}>{saving?"Saving…":"Save"}</button></div>
    </form></Modal>}
  </>;
}
