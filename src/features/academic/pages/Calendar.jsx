import { useEffect, useMemo, useState } from "react";
import { get, del } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import Modal from "../../../shared/components/Modal";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";
import { calendarApi } from "../../../features/attendance/api/attendance-setup.api";
import { humanStatus } from "../../../shared/utils/format";

const DAYS = ["SUNDAY","MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const emptyOverride = { calendarDate:"", type:"HOLIDAY", reason:"" };
const emptyCategory = { name:"", code:"", description:"" };
const emptyException = { categoryId:"", startDate:"", endDate:"", scope:"FULL_DAY", startPeriodId:"", endPeriodId:"", reason:"" };

function isoDate(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}` }

// Parse "YYYY-MM-DD" as a LOCAL date (avoids UTC shift bugs)
function parseLocalDate(s){
  const [y,m,d] = String(s).slice(0,10).split("-").map(Number);
  return new Date(y, m-1, d);
}

export default function Calendar(){
  const [years,setYears] = useState([]),[yearId,setYearId] = useState("");
  const [month,setMonth] = useState(new Date().getMonth()+1),[year,setYear] = useState(new Date().getFullYear());
  const [monthData,setMonthData] = useState(null),[categories,setCategories] = useState([]),[exceptions,setExceptions] = useState([]);
  const [error,setError] = useState(null),[modal,setModal] = useState(null),[saving,setSaving] = useState(false);
  const [override,setOverride] = useState(emptyOverride),[category,setCategory] = useState(emptyCategory),[exception,setException] = useState(emptyException);

  async function loadYears(){
    const r = (await get("/academic-years")).data || [];
    setYears(r);
    if(!yearId) setYearId(r.find(x=>x.status==="ACTIVE")?.id || r[0]?.id || "");
  }
  async function load(){
    if(!yearId) return;
    try{
      setError(null);
      const [m,c,e] = await Promise.all([
        calendarApi.getMonth(yearId,year,month),
        calendarApi.listCategories(),
        calendarApi.listExceptions(yearId)
      ]);
      setMonthData(m.data||m);
      setCategories(c.data||[]);
      setExceptions(e.data||[]);
    }catch(e){ setError(e); }
  }
  useEffect(()=>{ loadYears().catch(setError) },[]);
  useEffect(()=>{ load() },[yearId,year,month]);

  // ---- FIX: build a proper 7-column grid with leading offset ----
  const cells = useMemo(() => {
    const list = monthData?.days || [];
    if(!list.length) return [];

    // Sort ascending to be safe
    const sorted = [...list].sort((a,b)=> a.date.localeCompare(b.date));

    // Find first cell that belongs to the currently displayed month.
    // The API may return trailing days from the previous month (e.g. 2026-08-31).
    let firstOfMonthIdx = sorted.findIndex(d => {
      const dt = parseLocalDate(d.date);
      return dt.getFullYear() === year && dt.getMonth()+1 === month;
    });
    if(firstOfMonthIdx === -1) firstOfMonthIdx = 0;

    // Weekday of the 1st of the displayed month => leading blanks
    const firstOfMonth = new Date(year, month-1, 1);
    const leadingBlankCount = firstOfMonth.getDay(); // 0=Sun ... 6=Sat

    const blanks = Array.from({ length: leadingBlankCount }, (_, i) => ({
      _blank: true,
      key: `blank-${i}`
    }));

    const dayCells = sorted.slice(firstOfMonthIdx).map(d => ({
      _blank: false,
      ...d,
      key: d.date
    }));

    return [...blanks, ...dayCells];
  }, [monthData, year, month]);
  // ----------------------------------------------------------------

  function changeMonth(delta){
    const d = new Date(year, month-1+delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth()+1);
  }
  function openOverride(date="",type="HOLIDAY"){
    setOverride({...emptyOverride, calendarDate:date, type});
    setModal("override");
  }
  async function saveOverride(e){
    e.preventDefault(); setSaving(true);
    try{
      await calendarApi.createOverride(yearId,{
        calendarDate:new Date(`${override.calendarDate}T00:00:00`).toISOString(),
        type:override.type,
        reason:override.reason||null
      });
      setModal(null); await load();
    }catch(e){ alert(e.message) } finally { setSaving(false) }
  }
  async function saveCategory(e){
    e.preventDefault(); setSaving(true);
    try{ await calendarApi.createCategory(category); setModal(null); setCategory(emptyCategory); await load() }
    catch(e){ alert(e.message) } finally { setSaving(false) }
  }
  async function saveException(e){
    e.preventDefault(); setSaving(true);
    try{
      const body = {
        ...exception,
        startDate:new Date(`${exception.startDate}T00:00:00`).toISOString(),
        endDate:new Date(`${exception.endDate}T00:00:00`).toISOString()
      };
      if(body.scope==="FULL_DAY"){ delete body.startPeriodId; delete body.endPeriodId }
      await calendarApi.createException(yearId,body);
      setModal(null); setException(emptyException); await load();
    }catch(e){ alert(e.message) } finally { setSaving(false) }
  }
  async function remove(kind,id){
    if(!confirm("Delete this item?")) return;
    try{
      if(kind==="override")  await calendarApi.deleteOverride(id);
      if(kind==="category")  await calendarApi.deleteCategory(id);
      if(kind==="exception") await calendarApi.deleteException(id);
      await load();
    }catch(e){ alert(e.message) }
  }

  if(!years.length && !error) return <Loading/>;

  return <>
    <PageHeader
      title="Calendar"
      description="Manage recurring holidays, date-specific working days, holiday categories, and period-range attendance exceptions."
      action={
        <div className="row-actions">
          <button className="button" disabled={!yearId} onClick={()=>setModal("category")}>+ Category</button>
          <button className="button" disabled={!yearId} onClick={()=>setModal("exception")}>+ Exception</button>
          <button className="button primary" disabled={!yearId} onClick={()=>openOverride()}>+ Date override</button>
        </div>
      }
    />
    <div className="toolbar calendar-toolbar">
      <label className="inline-label">
        Academic year
        <select value={yearId} onChange={e=>setYearId(e.target.value)}>
          {years.map(y=><option key={y.id} value={y.id}>{y.name}</option>)}
        </select>
      </label>
      <div className="month-nav">
        <button className="button" onClick={()=>changeMonth(-1)}>‹</button>
        <strong>{MONTHS[month-1]} {year}</strong>
        <button className="button" onClick={()=>changeMonth(1)}>›</button>
      </div>
    </div>

    {error ? <ErrorState error={error} onRetry={load}/> : monthData===null ? <Loading/> : <>
      <div className="card">
        <div className="calendar-legend">
          <span><i className="calendar-dot working"/>Working</span>
          <span><i className="calendar-dot holiday"/>Holiday</span>
          <span><i className="calendar-dot blocked"/>Attendance exception</span>
        </div>

        {/* FIXED GRID */}
        <div className="calendar-grid">
          {DAYS.map(d => <div className="calendar-weekday" key={d}>{humanStatus(d)}</div>)}

          {cells.map(cell => {
            if(cell._blank){
              return <div key={cell.key} className="calendar-day blank" aria-hidden="true"/>;
            }

            const status = String(cell.dayStatus || cell.status || "WORKING").toUpperCase();
            const dt = parseLocalDate(cell.date);
            const isOtherMonth = dt.getFullYear() !== year || dt.getMonth()+1 !== month;

            return (
              <button
                type="button"
                className={`calendar-day ${status.toLowerCase()}${isOtherMonth ? " other-month" : ""}`}
                key={cell.key}
                onClick={()=>openOverride(cell.date, status==="HOLIDAY" ? "WORKING_DAY" : "HOLIDAY")}
              >
                <strong>{dt.getDate()}</strong>
                <span>{humanStatus(status)}</span>
                {cell.reason && <small>{cell.reason}</small>}
              </button>
            );
          })}
        </div>

        <div className="callout">
          Calendar precedence: attendance exceptions first, then date override, then weekly holiday.
          A special working day should use WORKING_DAY plus a date-specific timetable when its schedule differs from the normal week.
        </div>
      </div>

      <div className="info-grid" style={{marginTop:15}}>
        <section className="card">
          <div className="table-headline">
            <div><span className="eyebrow">Holiday categories</span><h3>Admin-defined categories</h3></div>
          </div>
          {categories.length===0
            ? <Empty>No categories yet.</Empty>
            : <div className="compact-list">
                {categories.map(c => (
                  <div className="compact-row" key={c.id}>
                    <div>
                      <strong>{c.name}</strong>
                      <small>{c.code}{c.description?` · ${c.description}`:""}</small>
                    </div>
                    <button className="danger-text" onClick={()=>remove("category",c.id)}>Delete</button>
                  </div>
                ))}
              </div>}
        </section>

        <section className="card">
          <div className="table-headline">
            <div><span className="eyebrow">Attendance exceptions</span><h3>Full-day / period-range blocks</h3></div>
          </div>
          {exceptions.length===0
            ? <Empty>No exceptions yet.</Empty>
            : <div className="compact-list">
                {exceptions.map(x => (
                  <div className="compact-row" key={x.id}>
                    <div>
                      <strong>{x.category?.name || x.categoryId}</strong>
                      <small>
                        {String(x.startDate).slice(0,10)} → {String(x.endDate).slice(0,10)} · {humanStatus(x.scope)}
                        {x.reason?` · ${x.reason}`:""}
                      </small>
                    </div>
                    <button className="danger-text" onClick={()=>remove("exception",x.id)}>Delete</button>
                  </div>
                ))}
              </div>}
        </section>
      </div>
    </>}

    {modal==="override" && <Modal title="Date-specific calendar override" onClose={()=>setModal(null)}>
      <form className="form" onSubmit={saveOverride}>
        <label>Date<input type="date" value={override.calendarDate} onChange={e=>setOverride({...override,calendarDate:e.target.value})} required/></label>
        <label>Type<select value={override.type} onChange={e=>setOverride({...override,type:e.target.value})}>
          <option value="HOLIDAY">Holiday</option>
          <option value="WORKING_DAY">Working day</option>
        </select></label>
        <label>Reason<textarea value={override.reason} onChange={e=>setOverride({...override,reason:e.target.value})}/></label>
        <div className="modal-actions">
          <button type="button" className="button" onClick={()=>setModal(null)}>Cancel</button>
          <button className="button primary" disabled={saving}>{saving?"Saving…":"Save"}</button>
        </div>
      </form>
    </Modal>}

    {modal==="category" && <Modal title="Create attendance exception category" onClose={()=>setModal(null)}>
      <form className="form" onSubmit={saveCategory}>
        <label>Name<input value={category.name} onChange={e=>setCategory({...category,name:e.target.value})} placeholder="Examination" required/></label>
        <label>Code<input value={category.code} onChange={e=>setCategory({...category,code:e.target.value.toUpperCase().replace(/\s+/g,"_")})} placeholder="EXAMINATION" required/></label>
        <label>Description<textarea value={category.description} onChange={e=>setCategory({...category,description:e.target.value})}/></label>
        <div className="modal-actions">
          <button type="button" className="button" onClick={()=>setModal(null)}>Cancel</button>
          <button className="button primary" disabled={saving}>Create</button>
        </div>
      </form>
    </Modal>}

    {modal==="exception" && <Modal title="Create attendance exception" onClose={()=>setModal(null)}>
      <form className="form" onSubmit={saveException}>
        <label>Category<select value={exception.categoryId} onChange={e=>setException({...exception,categoryId:e.target.value})} required>
          <option value="">Select category</option>
          {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select></label>
        <div className="form-grid">
          <label>Start date<input type="date" value={exception.startDate} onChange={e=>setException({...exception,startDate:e.target.value})} required/></label>
          <label>End date<input type="date" value={exception.endDate} onChange={e=>setException({...exception,endDate:e.target.value})} required/></label>
        </div>
        <label>Scope<select value={exception.scope} onChange={e=>setException({...exception,scope:e.target.value})}>
          <option value="FULL_DAY">Full day</option>
          <option value="PERIOD_RANGE">Period range</option>
        </select></label>
        {exception.scope==="PERIOD_RANGE" && <>
          <label>Start period ID<input value={exception.startPeriodId} onChange={e=>setException({...exception,startPeriodId:e.target.value})} placeholder="Use a period ID from Configuration" required/></label>
          <label>End period ID<input value={exception.endPeriodId} onChange={e=>setException({...exception,endPeriodId:e.target.value})} placeholder="Use a period ID from Configuration" required/></label>
        </>}
        <label>Reason<textarea value={exception.reason} onChange={e=>setException({...exception,reason:e.target.value})}/></label>
        <div className="callout">For a range such as Monday P3 → Wednesday P2, the backend blocks P3 onward on Monday, all periods on Tuesday, and P1–P2 on Wednesday.</div>
        <div className="modal-actions">
          <button type="button" className="button" onClick={()=>setModal(null)}>Cancel</button>
          <button className="button primary" disabled={saving || !categories.length}>{saving?"Saving…":"Create exception"}</button>
        </div>
      </form>
    </Modal>}
  </>;
}