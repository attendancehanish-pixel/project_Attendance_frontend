// pages/Staff.jsx
import { useEffect, useState } from "react";
import { staffApi } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import DataTable from "../../../shared/components/DataTable";
import Modal from "../../../shared/components/Modal";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";

export default function Staff() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    employeeCode: "",
    designation: "",
    department: "",
    dateOfJoining: ""
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setError(null);
      const response = await staffApi.getAll();
      setRows(response.data || []);
    } catch (e) {
      setError(e);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function open(row = null) {
    setEditing(row);
    setForm({
      name: row?.user?.name || row?.name || "",
      email: row?.user?.email || row?.email || "",
      password: "",
      employeeCode: row?.employeeCode || "",
      designation: row?.designation || "",
      department: row?.department || "",
      dateOfJoining: row?.dateOfJoining ? row.dateOfJoining.split('T')[0] : ""
    });
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        email: form.email.trim(),
        employeeCode: form.employeeCode.trim(),
        designation: form.designation.trim() || null,
        department: form.department.trim() || null,
        dateOfJoining: form.dateOfJoining || null
      };

      if (!editing) {
        if (form.password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
        body.password = form.password;
      } else if (form.password) {
        if (form.password.length < 8) {
          throw new Error("New password must be at least 8 characters.");
        }
        body.password = form.password;
      }

      if (editing) {
        await staffApi.update(editing.id, body);
      } else {
        await staffApi.create(body);
      }

      setModal(false);
      await load();
    } catch (e) {
      alert(e.message || "Failed to save staff member");
    } finally {
      setSaving(false);
    }
  }

  if (!rows) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={load} />;

  return (
    <>
      <PageHeader
        title="Staff"
        description="Create and manage staff accounts. Staff members are linked to user accounts for authentication and permissions."
        action={
          <button className="button primary" onClick={() => open()}>
            + Staff
          </button>
        }
      />

      {rows.length === 0 ? (
        <Empty />
      ) : (
        <DataTable
          columns={[
            {
              key: "employeeCode",
              label: "Staff ID",
              render: (r) => <strong>{r.employeeCode}</strong>
            },
            {
              key: "user",
              label: "Name",
              render: (r) => r.user?.name || r.name
            },
            {
              key: "email",
              label: "Email",
              render: (r) => r.user?.email || r.email
            },
            {
              key: "designation",
              label: "Designation",
              render: (r) => r.designation || "-"
            },
            {
              key: "department",
              label: "Department",
              render: (r) => r.department || "-"
            },
            {
              key: "status",
              label: "Status",
              render: (r) => {
                const isActive = r.user?.isActive !== false && r.isActive !== false;
                return (
                  <span className={`status-badge ${isActive ? "active" : "inactive"}`}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                );
              }
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <button className="text-button" onClick={() => open(r)}>
                  Edit
                </button>
              )
            }
          ]}
          rows={rows}
        />
      )}

      {modal && (
        <Modal
          title={editing ? "Edit Staff" : "Create Staff"}
          onClose={() => setModal(false)}
        >
          <form className="form" onSubmit={save}>
            <label>
              Full Name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="John Doe"
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                placeholder="john@example.com"
              />
            </label>

            <label>
              Employee Code
              <input
                value={form.employeeCode}
                onChange={(e) =>
                  setForm({ ...form, employeeCode: e.target.value })
                }
                required
                placeholder="EMP001"
              />
              <small className="field-help">Unique identifier for the staff member</small>
            </label>

            <label>
              Designation
              <input
                value={form.designation}
                onChange={(e) =>
                  setForm({ ...form, designation: e.target.value })
                }
                placeholder="Senior Teacher, HOD, etc."
              />
            </label>

            <label>
              Department
              <input
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
                placeholder="Science, Mathematics, etc."
              />
            </label>

            <label>
              Date of Joining
              <input
                type="date"
                value={form.dateOfJoining}
                onChange={(e) =>
                  setForm({ ...form, dateOfJoining: e.target.value })
                }
              />
            </label>

            <label>
              {editing ? "New Password" : "Password"}
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required={!editing}
                minLength={8}
                placeholder={
                  editing
                    ? "Leave blank to keep current password"
                    : "Minimum 8 characters"
                }
              />
              <small className="field-help">
                {editing
                  ? "Leave blank to keep the existing password."
                  : "The backend will hash this password before storing it."}
              </small>
            </label>

            <div className="callout">
              <strong>Note:</strong> Staff role assignment should be handled through the RBAC/role-management API. 
              Upon creation, the STAFF role is automatically assigned.
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button className="button primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}