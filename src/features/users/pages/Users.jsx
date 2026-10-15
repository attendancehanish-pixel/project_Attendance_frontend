import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import DataTable from "../../../shared/components/DataTable";
import Modal from "../../../shared/components/Modal";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";
import { useAuth } from "../../../shared/context/AuthContext";
import P from "../../../shared/access/permissions";
import { usersApi, rolesApi, permissionsApi } from "../api/users.api";
import PermissionPicker from "../components/PermissionPicker";

const blank = { name: "", email: "", password: "", roleIds: [], permissions: [], isActive: true };

export default function Users() {
  const { user: me, hasPermission } = useAuth();
  const canCreate = hasPermission(P.USERS_CREATE);
  const canUpdate = hasPermission(P.USERS_UPDATE);
  const canToggle = hasPermission(P.USERS_DEACTIVATE);

  const [rows, setRows] = useState(null);
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setError(null);
      const [u, r, c] = await Promise.all([
        usersApi.list(),
        rolesApi.list().catch(() => ({ data: [] })),
        permissionsApi.catalog().catch(() => ({ data: null })),
      ]);
      setRows(u.data || []);
      setRoles(r.data || []);
      setCatalog(c.data);
    } catch (e) {
      setError(e);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows || [];
    return (rows || []).filter((u) =>
      [u.name, u.email, u.staff?.employeeCode, ...u.roles.map((r) => r.name)]
        .filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [rows, search]);

  // Permissions that come from the roles ticked in the form.
  const inherited = useMemo(() => {
    const picked = new Set(form.roleIds);
    return [...new Set(roles.filter((r) => picked.has(r.id)).flatMap((r) => r.permissions))];
  }, [roles, form.roleIds]);

  function open(row = null) {
    setEditing(row);
    setFormError("");
    setForm(row
      ? { name: row.name, email: row.email, password: "", roleIds: row.roles.map((r) => r.id), permissions: row.customPermissions, isActive: row.isActive }
      : blank);
    setModal(true);
  }

  const isSelf = editing && editing.id === me?.id;
  const accessLocked = Boolean(isSelf) || (editing && !canUpdate);

  async function save(e) {
    e.preventDefault();
    setFormError("");
    if (!editing && form.password.length < 8) return setFormError("Password must be at least 8 characters.");
    if (editing && form.password && form.password.length < 8) return setFormError("New password must be at least 8 characters.");
    setSaving(true);
    try {
      const body = { name: form.name.trim(), email: form.email.trim() };
      if (form.password) body.password = form.password;
      if (!accessLocked) {
        body.roleIds = form.roleIds;
        body.permissions = form.permissions;
      }
      if (editing) await usersApi.update(editing.id, body);
      else await usersApi.create(body);
      setModal(false);
      await load();
    } catch (err) {
      setFormError(err.body?.details?.permissions
        ? `${err.message}: ${err.body.details.permissions.join(", ")}`
        : err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(row) {
    const next = !row.isActive;
    if (!next && !confirm(`Deactivate ${row.name}? They will be signed out and unable to log in.`)) return;
    try {
      await usersApi.setStatus(row.id, next);
      await load();
    } catch (err) {
      alert(err.message);
    }
  }

  const toggleRole = (id) =>
    setForm((f) => ({
      ...f,
      roleIds: f.roleIds.includes(id) ? f.roleIds.filter((x) => x !== id) : [...f.roleIds, id],
    }));

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!rows) return <Loading />;

  return (
    <>
      <PageHeader
        title="Users"
        description="Create login accounts and choose exactly what each person is allowed to do. Menus and buttons in the app follow these permissions."
        action={canCreate && <button className="button primary" onClick={() => open()}>+ User</button>}
      />

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search name, email, role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
        />
      </div>

      {filtered.length === 0 ? (
        <Empty>No users found.</Empty>
      ) : (
        <DataTable
          columns={[
            { key: "name", label: "Name", render: (u) => <strong>{u.name}</strong> },
            { key: "email", label: "Email" },
            {
              key: "access",
              label: "Access",
              render: (u) => (
                <div className="role-pills">
                  {u.roles.map((r) => <span className="role-pill" key={r.id}>{r.name}</span>)}
                  {u.customPermissions.length > 0 && (
                    <span className="role-pill custom">{u.customPermissions.length} custom</span>
                  )}
                  {u.roles.length === 0 && u.customPermissions.length === 0 && <span className="muted">No access</span>}
                </div>
              ),
            },
            { key: "staff", label: "Staff ID", render: (u) => u.staff?.employeeCode || "—" },
            {
              key: "status",
              label: "Status",
              render: (u) => (
                <span className={`status-badge ${u.isActive ? "active" : "absent"}`}>
                  {u.isActive ? "Active" : "Inactive"}
                </span>
              ),
            },
            {
              key: "actions",
              label: "",
              render: (u) => (
                <div className="row-actions">
                  {(canUpdate || u.id === me?.id) && <button className="text-button" onClick={() => open(u)}>Edit</button>}
                  {canToggle && u.id !== me?.id && (
                    <button className={u.isActive ? "danger-text" : "text-button"} onClick={() => toggleStatus(u)}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          rows={filtered}
        />
      )}

      {modal && (
        <Modal title={editing ? `Edit ${editing.name}` : "Create user"} size="wide" onClose={() => setModal(false)}>
          <form className="form" onSubmit={save}>
            <label>Full name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>Email (used to sign in)
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </label>
            <label>{editing ? "New password" : "Password"}
              <input
                type="password"
                value={form.password}
                minLength={8}
                required={!editing}
                autoComplete="new-password"
                placeholder={editing ? "Leave blank to keep the current password" : "Minimum 8 characters"}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </label>

            <div className="form-section">
              <h4>Roles</h4>
              {isSelf && <p className="access-note">You cannot change your own roles or permissions.</p>}
              {roles.length === 0 ? (
                <p className="access-note">No roles available.</p>
              ) : (
                <div className="role-checks">
                  {roles.map((r) => (
                    <label key={r.id} className={`role-check${form.roleIds.includes(r.id) ? " on" : ""}`} title={`${r.permissions.length} permissions`}>
                      <input
                        type="checkbox"
                        checked={form.roleIds.includes(r.id)}
                        disabled={accessLocked}
                        onChange={() => toggleRole(r.id)}
                      />
                      {r.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="form-section">
              <h4>Specific permissions</h4>
              <p className="access-note">Pick exactly the jobs this person may do, on top of any roles above. Required read access is added automatically.</p>
              {catalog ? (
                <PermissionPicker
                  catalog={catalog}
                  value={form.permissions}
                  inherited={inherited}
                  disabled={accessLocked}
                  onChange={(permissions) => setForm({ ...form, permissions })}
                />
              ) : (
                <p className="access-note">The permission list could not be loaded.</p>
              )}
            </div>

            {formError && <div className="form-error">{formError}</div>}
            <div className="modal-actions">
              <button type="button" className="button" onClick={() => setModal(false)}>Cancel</button>
              <button className="button primary" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
