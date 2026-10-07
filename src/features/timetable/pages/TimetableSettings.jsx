import { useEffect, useState } from "react";
import { get, patch } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import { Loading, ErrorState } from "../../../shared/components/State";

export default function TimetableSettings(){
  const [years,setYears]=useState([]),[yearId,setYearId]=useState(""),[settings,setSettings]=useState(null),[error,setError]=useState(null),[saving,setSaving]=useState(false);

  async function loadYears(){
    const data=(await get("/academic-years")).data||[];
    setYears(data);
    if(!yearId)setYearId(data.find(x=>x.status==="ACTIVE")?.id||data[0]?.id||"");
  }
  async function load(){
    if(!yearId)return;
    try{setError(null);setSettings((await get(`/timetable-settings/${yearId}`)).data)}catch(e){setError(e)}
  }
  useEffect(()=>{loadYears().catch(setError)},[]);
  useEffect(()=>{load()},[yearId]);

  async function update(value){
    setSaving(true);
    try{setSettings((await patch(`/timetable-settings/${yearId}`,{excludeWeeklyHolidaysFromTimetable:value})).data)}catch(e){alert(e.message)}finally{setSaving(false)}
  }

  if(error)return <ErrorState error={error} onRetry={load}/>;
  if(!years.length||!settings)return <Loading/>;

  return <>
    <PageHeader title="Timetable Settings" description="Control how recurring weekly holidays interact with normal timetable generation."/>
    <div className="toolbar">
      <label className="inline-label">Academic year
        <select value={yearId} onChange={e=>setYearId(e.target.value)}>{years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}</select>
      </label>
    </div>
    <div className="card settings-card">
      <label className="switch-row large">
        <input type="checkbox" checked={Boolean(settings.excludeWeeklyHolidaysFromTimetable)} disabled={saving} onChange={e=>update(e.target.checked)}/>
        <span><strong>Exclude weekly holidays from timetable by default</strong><small>ON by default. If Sunday is a weekly holiday, timetable generation skips Sunday unless an admin explicitly creates a custom period.</small></span>
      </label>
      <div className="callout">
        This setting does not affect specific calendar holidays. A normal timetable can still exist on a specific holiday; attendance-session generation decides not to create attendance for HOLIDAY/VACATION dates.
      </div>
    </div>
  </>;
}
