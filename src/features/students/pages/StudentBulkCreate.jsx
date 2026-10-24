import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader";
import { studentApi } from "../api/student.api";
import { validateStudent } from "../utils/student-validation";

const blank = () => ({ admissionNo: "", name: "", email: "", phone: "" });
const FIELDS = [
  { key: "admissionNo", label: "Admission no.", placeholder: "STU00001", required: true },
  { key: "name", label: "Full name", placeholder: "Student name", required: true },
  { key: "email", label: "Email", placeholder: "optional", type: "email" },
  { key: "phone", label: "Phone", placeholder: "optional" },
];

export default function StudentBulkCreate() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);       // committed rows
  const [draft, setDraft] = useState(blank());      // row being typed
  const [draftErrors, setDraftErrors] = useState({});
  const [editIndex, setEditIndex] = useState(null); // index being edited inline
  const [editDraft, setEditDraft] = useState(blank());
  const [editErrors, setEditErrors] = useState({});
  const [serverErrors, setServerErrors] = useState({}); // rowIndex -> message[]
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const firstRef = useRef(null);

  const usedNos = useMemo(() => new Map(entries.map((e, i) => [e.admissionNo.trim().toLowerCase(), i])), [entries]);

  function checkRow(row, ignoreIndex = -1) {
    const errs = validateStudent(row);
    const hit = usedNos.get(row.admissionNo.trim().toLowerCase());
    if (hit !== undefined && hit !== ignoreIndex) errs.admissionNo = `Already added in row ${hit + 1}`;
    return errs;
  }

  // A row is "complete" once the required fields are filled — only then is it committed.
  const draftComplete = draft.admissionNo.trim() && draft.name.trim();

  function commitDraft() {
    const errs = checkRow(draft);
    setDraftErrors(errs);
    if (Object.keys(errs).length) return false;
    setEntries((r) => [...r, { ...draft, admissionNo: draft.admissionNo.trim(), name: draft.name.trim().replace(/\s+/g, " "), email: draft.email.trim(), phone: draft.phone.trim() }]);
    setDraft(blank());
    setServerErrors({});
    setTimeout(() => firstRef.current?.focus(), 0);
    return true;
  }

  function onDraftKey(e, key) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // Enter on the last field, or any field when the row is already complete, adds the row.
    if (draftComplete && (key === "phone" || e.ctrlKey || e.metaKey)) commitDraft();
    else {
      const inputs = [...e.currentTarget.closest(".sb-entry").querySelectorAll("input")];
      const next = inputs[inputs.indexOf(e.currentTarget) + 1];
      if (next) next.focus(); else if (draftComplete) commitDraft();
    }
  }

  function startEdit(i) { setEditIndex(i); setEditDraft({ ...entries[i] }); setEditErrors({}); }
  function saveEdit() {
    const errs = checkRow(editDraft, editIndex);
    setEditErrors(errs);
    if (Object.keys(errs).length) return;
    setEntries((r) => r.map((x, n) => (n === editIndex ? { ...editDraft, admissionNo: editDraft.admissionNo.trim(), name: editDraft.name.trim() } : x)));
    setEditIndex(null); setServerErrors({});
  }
  function removeRow(i) {
    setEntries((r) => r.filter((_, n) => n !== i));
    if (editIndex === i) setEditIndex(null);
    setServerErrors({});
  }

  async function submit() {
    setError(""); setServerErrors({});
    if (editIndex !== null) return setError("Save or cancel the row you are editing first.");
    let rows = entries;
    // If a complete row is still sitting in the entry line, include it instead of silently dropping it.
    if (draftComplete) {
      const errs = checkRow(draft);
      if (Object.keys(errs).length) { setDraftErrors(errs); return; }
      rows = [...entries, draft];
    } else if (draft.admissionNo.trim() || draft.name.trim()) {
      return setError("The row being typed is incomplete. Fill admission number and name, or clear it.");
    }
    if (!rows.length) return setError("Add at least one student.");

    setSaving(true);
    try {
      const res = await studentApi.bulkCreate(rows);
      navigate("/students", { state: { flash: res.message } });
    } catch (e) {
      const list = e?.body?.details?.errors;
      if (list?.length) {
        const map = {};
        list.forEach((x) => { (map[x.row - 1] ||= []).push(x.message); });
        setServerErrors(map);
        if (rows.length > entries.length) { setEntries(rows); setDraft(blank()); }
        setError(e.message);
      } else setError(e.message || "Could not create students.");
    } finally { setSaving(false); }
  }

  const input = (value, onChange, f, err, extra = {}) => (
    <div className="sb-cell" key={f.key}>
      <input type={f.type || "text"} value={value} placeholder={f.placeholder} onChange={(e) => onChange(f.key, e.target.value)} className={err ? "invalid" : ""} {...extra} />
      {err && <small className="field-error">{err}</small>}
    </div>
  );

  return <>
    <PageHeader title="Bulk add students"
      description="Type one student per line. A row is added to the list as soon as its required fields are complete — you can edit or remove any row before saving."
      action={<Link className="button" to="/students">← Students</Link>} />

    <section className="enrollment-step-card">
      {error && <div className="form-alert error">{error}</div>}

      <div className="sb-grid sb-head"><span>#</span>{FIELDS.map((f) => <span key={f.key}>{f.label}{f.required && " *"}</span>)}<span></span></div>

      {entries.map((r, i) => editIndex === i ? (
        <div key={i} className="sb-grid sb-row editing">
          <span className="row-number">{i + 1}</span>
          {FIELDS.map((f) => input(editDraft[f.key], (k, v) => setEditDraft((d) => ({ ...d, [k]: v })), f, editErrors[f.key]))}
          <div className="sb-actions"><button type="button" className="text-button" onClick={saveEdit}>Save</button><button type="button" className="text-button muted" onClick={() => setEditIndex(null)}>Cancel</button></div>
        </div>
      ) : (
        <div key={i} className={`sb-grid sb-row${serverErrors[i] ? " has-error" : ""}`}>
          <span className="row-number">{i + 1}</span>
          <strong>{r.admissionNo}</strong><span>{r.name}</span><span className="muted">{r.email || "—"}</span><span className="muted">{r.phone || "—"}</span>
          <div className="sb-actions"><button type="button" className="text-button" onClick={() => startEdit(i)}>Edit</button><button type="button" className="danger-text" onClick={() => removeRow(i)}>Remove</button></div>
          {serverErrors[i] && <div className="sb-row-error">{serverErrors[i].join(" · ")}</div>}
        </div>
      ))}

      <div className="sb-grid sb-row sb-entry">
        <span className="row-number">{entries.length + 1}</span>
        {FIELDS.map((f, idx) => input(draft[f.key], (k, v) => { setDraft((d) => ({ ...d, [k]: v })); setDraftErrors((x) => ({ ...x, [k]: undefined })); }, f, draftErrors[f.key], { ref: idx === 0 ? firstRef : undefined, autoFocus: idx === 0, onKeyDown: (e) => onDraftKey(e, f.key) }))}
        <div className="sb-actions"><button type="button" className="button" disabled={!draftComplete} onClick={commitDraft}>Add</button></div>
      </div>
      <p className="sb-hint">Press <kbd>Enter</kbd> to move to the next field; Enter on the last field adds the row.</p>

      <div className="bulk-footer">
        <span className="muted">{entries.length} student{entries.length === 1 ? "" : "s"} ready</span>
        <div>
          <Link className="button" to="/students">Cancel</Link>
          <button type="button" className="button primary" disabled={saving || (!entries.length && !draftComplete)} onClick={submit}>{saving ? "Saving…" : `Create ${entries.length + (draftComplete ? 1 : 0) || ""} student${entries.length + (draftComplete ? 1 : 0) === 1 ? "" : "s"}`}</button>
        </div>
      </div>
    </section>
  </>;
}
