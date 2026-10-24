import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader";
import DataTable from "../../../shared/components/DataTable";
import Modal from "../../../shared/components/Modal";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";
import { useAuth } from "../../../shared/context/AuthContext";
import P from "../../../shared/access/permissions";
import { studentApi } from "../api/student.api";
import { humanStatus } from "../../../shared/utils/format";
import { validateStudent } from "../utils/student-validation";

const STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"];
const blank = { admissionNo: "", name: "", email: "", phone: "", status: "ACTIVE" };

export default function Students() {
  const flash = useLocation().state?.flash;
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(P.STUDENTS_CREATE);
  const canUpdate = hasPermission(P.STUDENTS_UPDATE);
  const canRemove = hasPermission(P.STUDENTS_ARCHIVE);

  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState(null); // null | { editing }
  const [form, setForm] = useState(blank);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setError(null);
      const res = await studentApi.list();
      setRows(res.data || []);
    } catch (e) { setError(e); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows || []).filter((r) =>
      (!statusFilter || r.status === statusFilter) &&
      (!q || r.admissionNo.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q))
    );
  }, [rows, search, statusFilter]);

  function open(row = null) {
    setModal({ editing: row });
    setForm(row ? { admissionNo: row.admissionNo, name: row.name, email: row.email || "", phone: row.phone || "", status: row.status || "ACTIVE" } : blank);
    setFieldErrors({}); setFormError("");
  }
  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setFieldErrors((e) => ({ ...e, [k]: undefined })); };

  async function save(e) {
    e.preventDefault();
    const errs = validateStudent(form);
    // Duplicate admission number check against already-loaded students
    const dup = rows.find((r) => r.admissionNo.toLowerCase() === form.admissionNo.trim().toLowerCase() && r.id !== modal.editing?.id);
    if (dup) errs.admissionNo = `Already used by ${dup.name}`;
    if (Object.keys(errs).length) return setFieldErrors(errs);

    setSaving(true); setFormError("");
    const body = {
      admissionNo: form.admissionNo.trim(),
      name: form.name.trim().replace(/\s+/g, " "),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      status: form.status,
    };
    try {
      if (modal.editing) await studentApi.update(modal.editing.id, body);
      else await studentApi.create(body);
      setModal(null);
      await load();
    } catch (err) { setFormError(err.message); }
    finally { setSaving(false); }
  }

  async function remove(row) {
    if (!window.confirm(`Delete ${row.name} (${row.admissionNo})? Students with enrolment or attendance history cannot be deleted — set them to Inactive/Archived instead.`)) return;
    try { await studentApi.remove(row.id); await load(); }
    catch (err) { window.alert(err.message); }
  }

  if (!rows && !error) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  const Field = ({ name, label, type = "text", required, placeholder }) => (
    <label>{label}{required && <span className="req"> *</span>}
      <input type={type} value={form[name]} placeholder={placeholder} onChange={(e) => set(name, e.target.value)} className={fieldErrors[name] ? "invalid" : ""} />
      {fieldErrors[name] && <small className="field-error">{fieldErrors[name]}</small>}
    </label>
  );

  return <>
    <PageHeader
      title="Students"
      description="Maintain student master data. Use inactive or archived status to keep historical records."
      action={canCreate && <div className="header-actions">
        <Link className="button" to="/students/bulk-create">Bulk add</Link>
        <button className="button primary" onClick={() => open()}>+ Student</button>
      </div>}
    />

    {flash && <div className="form-alert success">{flash}</div>}

    <section className="enrollment-toolbar">
      <div className="student-filter">
        <label>Search
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Admission no., name or email" />
        </label>
        <label>Status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{humanStatus(s)}</option>)}
          </select>
        </label>
      </div>
    </section>

    <section className="card enrollment-report-card">
      <div className="section-heading"><div><h3>Student register</h3><p>{filtered.length} of {rows.length} student{rows.length === 1 ? "" : "s"}</p></div></div>
      {filtered.length === 0 ? <Empty>{rows.length ? "No students match your filters." : "No students yet. Add one or use Bulk add."}</Empty> :
        <DataTable rows={filtered} columns={[
          { key: "admissionNo", label: "Admission No.", render: (r) => <strong>{r.admissionNo}</strong> },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "status", label: "Status", render: (r) => <span className={`status-badge ${String(r.status || "").toLowerCase()}`}>{humanStatus(r.status)}</span> },
          ...(canUpdate || canRemove ? [{ key: "actions", label: "", render: (r) => <div className="row-actions">
            {canUpdate && <button className="text-button" onClick={() => open(r)}>Edit</button>}
            {canRemove && <button className="danger-text" onClick={() => remove(r)}>Delete</button>}
          </div> }] : []),
        ]} />}
    </section>

    {modal && <Modal title={modal.editing ? "Edit student" : "Add student"} onClose={() => setModal(null)}>
      <form className="form" onSubmit={save} noValidate>
        {formError && <div className="form-alert error">{formError}</div>}
        {Field({ name: "admissionNo", label: "Admission number", required: true, placeholder: "STU00001" })}
        {Field({ name: "name", label: "Full name", required: true })}
        {Field({ name: "email", label: "Email", type: "email" })}
        {Field({ name: "phone", label: "Phone" })}
        <label>Status
          <select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{humanStatus(s)}</option>)}
          </select>
        </label>
        <div className="modal-actions">
          <button type="button" className="button" onClick={() => setModal(null)}>Cancel</button>
          <button className="button primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </Modal>}
  </>;
}
