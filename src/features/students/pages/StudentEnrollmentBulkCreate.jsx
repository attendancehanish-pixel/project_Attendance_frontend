import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get } from "../../../shared/api/client";
import { studentEnrollmentApi } from "../api/student-enrollment.api";
import PageHeader from "../../../shared/components/PageHeader";
import { useDebouncedValue } from "../../../shared/hooks/useDebouncedValue";
import { humanStatus } from "../../../shared/utils/format";

const STATUSES = ["ENROLLED", "PROMOTED", "GRADUATED", "WITHDRAWN"];

export default function StudentEnrollmentBulkCreate() {
  const navigate = useNavigate();
  const [years, setYears] = useState([]);
  const [standards, setStandards] = useState([]);
  const [yearId, setYearId] = useState("");
  const [standardId, setStandardId] = useState("");
  const [status, setStatus] = useState("ENROLLED");

  const [entries, setEntries] = useState([]);           // { student, rollNo }
  const [usedRolls, setUsedRolls] = useState(new Set()); // roll numbers already taken in selected class/year
  const [suggestedRoll, setSuggestedRoll] = useState("1");

  // entry line
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [rollNo, setRollNo] = useState("");
  const [rollTouched, setRollTouched] = useState(false);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [lookupError, setLookupError] = useState("");
  const [entryError, setEntryError] = useState("");

  // inline edit
  const [editIndex, setEditIndex] = useState(null);
  const [editRoll, setEditRoll] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rowErrors, setRowErrors] = useState({});

  const queryRef = useRef(null);
  const rollRef = useRef(null);
  const reqId = useRef(0);
  const debouncedQuery = useDebouncedValue(query.trim(), 350);

  /* ---------- context ---------- */
  useEffect(() => {
    Promise.all([get("/academic-years"), get("/standards")]).then(([y, s]) => {
      const ys = y.data || [];
      setYears(ys); setStandards(s.data || []);
      setYearId((ys.find((x) => x.status === "ACTIVE") || ys[0])?.id || "");
    }).catch((e) => setError(e.message));
  }, []);

  const refreshRolls = useCallback(async () => {
    if (!yearId || !standardId) { setUsedRolls(new Set()); setSuggestedRoll("1"); return; }
    try {
      const res = await studentEnrollmentApi.nextRollNo(yearId, standardId);
      setUsedRolls(new Set(res.data.used.map(String)));
      setSuggestedRoll(res.data.nextRollNo);
    } catch (e) { setError(e.message); }
  }, [yearId, standardId]);
  useEffect(() => { refreshRolls(); }, [refreshRolls]);

  // next free roll number, taking this batch into account
  const nextFree = useMemo(() => {
    const taken = new Set([...usedRolls, ...entries.map((e) => e.rollNo)]);
    let n = Number.parseInt(suggestedRoll, 10) || 1;
    while (taken.has(String(n))) n += 1;
    return String(n);
  }, [usedRolls, entries, suggestedRoll]);

  useEffect(() => { if (!rollTouched) setRollNo(nextFree); }, [nextFree, rollTouched]);

  /* ---------- debounced lookup ---------- */
  useEffect(() => {
    if (!yearId || !debouncedQuery || selected) { setResults([]); setSearching(false); return; }
    const id = ++reqId.current;
    setSearching(true); setLookupError("");
    studentEnrollmentApi.lookup(yearId, debouncedQuery)
      .then((res) => {
        if (id !== reqId.current) return; // stale response
        const list = res.data || [];
        setResults(list); setActive(0); setOpen(true);
        const exact = list.find((s) => s.admissionNo.toLowerCase() === debouncedQuery.toLowerCase());
        if (exact && !exact.enrollment && !addedIds.has(exact.id)) pick(exact);
      })
      .catch((e) => { if (id === reqId.current) setLookupError(e.message); })
      .finally(() => { if (id === reqId.current) setSearching(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, yearId]);

  // typing again invalidates the in-flight lookup immediately
  function onQueryChange(v) {
    reqId.current += 1;
    setQuery(v); setSelected(null); setEntryError("");
    setOpen(true); setSearching(!!v.trim());
  }

  const addedIds = useMemo(() => new Set(entries.map((e) => e.student.id)), [entries]);

  function unavailableReason(s) {
    if (addedIds.has(s.id)) return "Already in this batch";
    if (s.enrollment) return `Enrolled${s.enrollment.standard ? ` in ${s.enrollment.standard.name || s.enrollment.standard.code}` : ""} (roll ${s.enrollment.rollNo})`;
    return "";
  }

  function pick(s) {
    if (unavailableReason(s)) return;
    setSelected(s); setQuery(s.admissionNo); setOpen(false); setResults([]); setEntryError("");
    setTimeout(() => { rollRef.current?.focus(); rollRef.current?.select(); }, 0);
  }

  /* ---------- commit a row ---------- */
  const rollConflict = (value, ignoreIndex = -1) => {
    const v = value.trim();
    if (!v) return "Roll number is required";
    if (usedRolls.has(v)) return `Roll ${v} is already used in this class`;
    const dup = entries.findIndex((e, i) => i !== ignoreIndex && e.rollNo === v);
    if (dup !== -1) return `Roll ${v} is already used in row ${dup + 1}`;
    return "";
  };

  function addRow() {
    if (!standardId) return setEntryError("Choose a class first.");
    if (!selected) return setEntryError("Pick a student from the suggestions.");
    const conflict = rollConflict(rollNo);
    if (conflict) return setEntryError(conflict);
    setEntries((r) => [...r, { student: selected, rollNo: rollNo.trim() }]);
    setSelected(null); setQuery(""); setRollTouched(false); setEntryError(""); setRowErrors({});
    setTimeout(() => queryRef.current?.focus(), 0);
  }

  function onQueryKey(e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Escape") setOpen(false);
    else if (e.key === "Enter") {
      e.preventDefault();
      if (selected) rollRef.current?.focus();
      else if (open && results[active]) pick(results[active]);
    }
  }

  /* ---------- edit / remove ---------- */
  function startEdit(i) { setEditIndex(i); setEditRoll(entries[i].rollNo); }
  function saveEdit() {
    const c = rollConflict(editRoll, editIndex);
    if (c) return setRowErrors({ [editIndex]: [c] });
    setEntries((r) => r.map((x, n) => (n === editIndex ? { ...x, rollNo: editRoll.trim() } : x)));
    setEditIndex(null); setRowErrors({});
  }
  function removeRow(i) { setEntries((r) => r.filter((_, n) => n !== i)); setEditIndex(null); setRowErrors({}); }

  // roll numbers that became invalid after changing class/year
  const staleIssues = useMemo(() => {
    const m = {};
    entries.forEach((e, i) => { if (usedRolls.has(e.rollNo)) m[i] = [`Roll ${e.rollNo} is already used in this class — edit it`]; });
    return m;
  }, [entries, usedRolls]);

  /* ---------- submit ---------- */
  async function submit() {
    setError(""); setRowErrors({});
    if (!yearId || !standardId) return setError("Select an academic year and class.");
    if (editIndex !== null) return setError("Save or cancel the row you are editing first.");
    if (selected) return setError("Add the student currently in the entry line, or clear it.");
    if (!entries.length) return setError("Add at least one student.");
    if (Object.keys(staleIssues).length) return setError("Fix the highlighted roll numbers first.");

    setSaving(true);
    try {
      const res = await studentEnrollmentApi.bulkEnroll({
        academicYearId: yearId, standardId, status,
        enrollments: entries.map((e) => ({ admissionNo: e.student.admissionNo, rollNo: e.rollNo })),
      });
      navigate("/student-enrollments", { state: { flash: res.message } });
    } catch (e) {
      const d = e?.body?.details;
      const map = {};
      d?.missingStudents?.forEach((x) => (map[x.row - 1] ||= []).push("Student not found"));
      d?.conflicts?.forEach((x) => (map[x.row - 1] ||= []).push(x.reason));
      setRowErrors(map);
      setError(Object.keys(map).length ? "Some rows need attention — see the highlighted rows." : e.message || "Could not create enrolments.");
      refreshRolls();
    } finally { setSaving(false); }
  }

  const rowIssues = (i) => rowErrors[i] || staleIssues[i];

  return <>
    <PageHeader title="Bulk enrol students"
      description="Type an admission number (or name) to find the student, set the roll number and add the row. Year, class and status apply to the whole batch."
      action={<Link className="button" to="/student-enrollments">← Enrolment report</Link>} />

    <section className="enrollment-step-card">
      <div className="step"><b>1</b><div><strong>Choose context</strong><span>These values apply to every student below.</span></div></div>
      <div className="bulk-context-grid">
        <label>Academic year<select value={yearId} onChange={(e) => setYearId(e.target.value)}><option value="">Select</option>{years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}</select></label>
        <label>Class / Standard<select value={standardId} onChange={(e) => setStandardId(e.target.value)}><option value="">Select</option>{standards.map((s) => <option key={s.id} value={s.id}>{s.name || s.code}</option>)}</select></label>
        <label>Enrollment status<select value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{humanStatus(s)}</option>)}</select></label>
      </div>
    </section>

    <section className="enrollment-step-card">
      <div className="step"><b>2</b><div><strong>Add students</strong><span>Start typing — matching students load automatically. Rows are added to the list when you press Add or Enter.</span></div></div>
      {error && <div className="form-alert error">{error}</div>}

      <div className="eb-grid eb-head"><span>#</span><span>Admission no. / name</span><span>Student</span><span>Roll no.</span><span></span></div>

      {entries.map((r, i) => (
        <div key={r.student.id} className={`eb-grid eb-row${rowIssues(i) ? " has-error" : ""}`}>
          <span className="row-number">{i + 1}</span>
          <strong>{r.student.admissionNo}</strong>
          <span>{r.student.name}</span>
          {editIndex === i
            ? <input value={editRoll} autoFocus onChange={(e) => setEditRoll(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); saveEdit(); } if (e.key === "Escape") setEditIndex(null); }} />
            : <span>{r.rollNo}</span>}
          <div className="sb-actions">
            {editIndex === i
              ? <><button type="button" className="text-button" onClick={saveEdit}>Save</button><button type="button" className="text-button muted" onClick={() => { setEditIndex(null); setRowErrors({}); }}>Cancel</button></>
              : <><button type="button" className="text-button" onClick={() => startEdit(i)}>Edit</button><button type="button" className="danger-text" onClick={() => removeRow(i)}>Remove</button></>}
          </div>
          {rowIssues(i) && <div className="sb-row-error">{rowIssues(i).join(" · ")}</div>}
        </div>
      ))}

      <div className="eb-grid eb-row eb-entry">
        <span className="row-number">{entries.length + 1}</span>
        <div className="eb-search">
          <input ref={queryRef} autoFocus value={query} placeholder="e.g. STU00012 or student name" autoComplete="off"
            onChange={(e) => onQueryChange(e.target.value)} onKeyDown={onQueryKey}
            onFocus={() => results.length && setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
          {searching && <span className="eb-spinner" aria-label="Searching" />}
          {open && !selected && query.trim() && (
            <ul className="eb-dropdown" role="listbox">
              {lookupError && <li className="eb-empty error">{lookupError}</li>}
              {!lookupError && !searching && results.length === 0 && debouncedQuery === query.trim() && <li className="eb-empty">No active student matches “{query.trim()}”</li>}
              {results.map((s, i) => {
                const why = unavailableReason(s);
                return <li key={s.id} role="option" aria-selected={i === active} aria-disabled={!!why}
                  className={`${i === active ? "active" : ""}${why ? " disabled" : ""}`}
                  onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); pick(s); }}>
                  <strong>{s.admissionNo}</strong><span>{s.name}</span>{why && <em>{why}</em>}
                </li>;
              })}
            </ul>
          )}
        </div>
        <span className={selected ? "eb-picked" : "muted"}>{selected ? selected.name : "—"}</span>
        <input ref={rollRef} value={rollNo} placeholder={nextFree} disabled={!selected}
          onChange={(e) => { setRollNo(e.target.value); setRollTouched(true); setEntryError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRow(); } }} />
        <div className="sb-actions"><button type="button" className="button" disabled={!selected || !rollNo.trim()} onClick={addRow}>Add</button></div>
        {entryError && <div className="sb-row-error">{entryError}</div>}
      </div>
      {!standardId && <p className="sb-hint">Choose a class in step 1 to get the next free roll number suggested automatically.</p>}

      <div className="bulk-footer">
        <span className="muted">{entries.length} student{entries.length === 1 ? "" : "s"} ready to enrol</span>
        <div>
          <Link className="button" to="/student-enrollments">Cancel</Link>
          <button type="button" className="button primary" disabled={saving || !entries.length} onClick={submit}>{saving ? "Saving…" : `Enrol ${entries.length || ""} student${entries.length === 1 ? "" : "s"}`}</button>
        </div>
      </div>
    </section>
  </>;
}
