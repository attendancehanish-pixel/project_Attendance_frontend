import { useEffect, useState } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import DataTable from "../../../shared/components/DataTable";
import Modal from "../../../shared/components/Modal";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";
import { useAuth } from "../../../shared/context/AuthContext";
import P from "../../../shared/access/permissions";
import { rolesApi, permissionsApi } from "../api/users.api";
import PermissionPicker from "../components/PermissionPicker";

const blank = { name: "", description: "", permissions: [] };

export default function Roles() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(P.ROLES_CREATE);
  const canUpdate = hasPermission(P.ROLES_UPDATE);
  const canDelete = hasPermission(P.ROLES_DELETE);

  const [rows, setRows] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setError(null);
      const [r, c] = await Promise.all([rolesApi.list(), permissionsApi.catalog().catch(() => ({ data: null }))]);
      setRows(r.data || []);
      setCatalog(c.data);
    } catch (e) {
      setError(e);
    }
  }
  useEffect(() => { load(); }, []);

  function open(row = null) {
    setEditing(row);
    setFormError("");
    setForm(row ? { name: row.name, description: row.description || "", permissions: row.permissions } : blank);
    setModal(true);
  }

  const readOnly = Boolean(editing?.builtIn) || (editing && !canUpdate);

  async function save(e) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const body = { name: form.name, description: form.description, permissions: form.permissions };
      if (editing) await rolesApi.update(editing.id, body);
      else await rolesApi.create(body);
      setModal(false);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(row) {
    if (!confirm(`Delete the role ${row.name}?`)) return;
    try {
      await rolesApi.remove(row.id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!rows) return <Loading />;

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="A role is a reusable bundle of permissions (for example “Timetable coordinator”). Assign roles to users from the Users page."
        action={canCreate && <button className="button primary" onClick={() => open()}>+ Role</button>}
      />

      {rows.length === 0 ? (
        <Empty>No roles found.</Empty>
      ) : (
        <DataTable
          columns={[
            { key: "name", label: "Role", render: (r) => <strong>{r.name}</strong> },
            { key: "description", label: "Description", render: (r) => r.description || "—" },
            { key: "permissions", label: "Permissions", render: (r) => r.permissions.length },
            { key: "userCount", label: "Users" },
            {
              key: "type",
              label: "Type",
              render: (r) => <span className="role-pill">{r.builtIn ? "Built-in" : "Custom"}</span>,
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <div className="row-actions">
                  <button className="text-button" onClick={() => open(r)}>
                    {r.builtIn || !canUpdate ? "View" : "Edit"}
                  </button>
                  {canDelete && !r.builtIn && (
                    <button className="danger-text" onClick={() => remove(r)}>Delete</button>
                  )}
                </div>
              ),
            },
          ]}
          rows={rows}
        />
      )}

      {modal && (
        <Modal title={editing ? `${readOnly ? "" : "Edit "}${editing.name}` : "Create role"} size="wide" onClose={() => setModal(false)}>
          <form className="form" onSubmit={save}>
            {editing?.builtIn && (
              <div className="callout">Built-in roles are managed by the system and cannot be changed. Create a new role if you need a different set of permissions.</div>
            )}
            <label>Role name
              <input value={form.name} disabled={readOnly} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Timetable coordinator" />
              <small className="field-help">Saved in capitals with underscores, e.g. TIMETABLE_COORDINATOR.</small>
            </label>
            <label>Description
              <input value={form.description} disabled={readOnly} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            {catalog ? (
              <PermissionPicker
                catalog={catalog}
                value={form.permissions}
                disabled={readOnly}
                onChange={(permissions) => setForm({ ...form, permissions })}
              />
            ) : (
              <p className="access-note">The permission list could not be loaded.</p>
            )}
            {formError && <div className="form-error">{formError}</div>}
            <div className="modal-actions">
              <button type="button" className="button" onClick={() => setModal(false)}>{readOnly ? "Close" : "Cancel"}</button>
              {!readOnly && <button className="button primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>}
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
