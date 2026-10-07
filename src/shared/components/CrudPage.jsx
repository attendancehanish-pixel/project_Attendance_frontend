import { useEffect, useState } from "react";
import { get, post, patch, del } from "../api/client";
import PageHeader from "./PageHeader";
import DataTable from "./DataTable";
import Modal from "./Modal";
import { Loading, ErrorState, Empty } from "./State";
import { useAuth } from "../context/AuthContext";

function buildInitialForm(fields, row = null) {
  return Object.fromEntries(fields.map(f => {
    let value = row ? row[f.name] ?? "" : "";
    if (f.type === "number" && value !== "" && value !== null) value = String(value);
    return [f.name, value];
  }));
}

function serializeForm(fields, form) {
  const body = {};
  for (const field of fields) {
    const value = form[field.name];

    if (field.type === "number") {
      if (value === "" || value === null || value === undefined) {
        if (field.required === false) body[field.name] = null;
        continue;
      }
      const numberValue = Number(value);
      if (!Number.isInteger(numberValue)) {
        throw new Error(`${field.label} must be a whole number.`);
      }
      if (field.min !== undefined && numberValue < field.min) {
        throw new Error(`${field.label} must be at least ${field.min}.`);
      }
      if (field.max !== undefined && numberValue > field.max) {
        throw new Error(`${field.label} must be at most ${field.max}.`);
      }
      body[field.name] = numberValue;
      continue;
    }

    body[field.name] = value;
  }
  return body;
}

export default function CrudPage({
  title,
  description,
  endpoint,
  fields,
  columns,
  createLabel = "New"
}) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const isAdmin = useAuth().isAdmin;

  async function load() {
    try {
      setError(null);
      setRows((await get(endpoint)).data || []);
    } catch (e) {
      setError(e);
    }
  }

  useEffect(() => {
    load();
  }, [endpoint]);

  function open(row = null) {
    setEditing(row);
    setForm(buildInitialForm(fields, row));
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const body = serializeForm(fields, form);

      if (editing) {
        await patch(`${endpoint}/${editing.id}`, body);
      } else {
        await post(endpoint, body);
      }

      setModal(false);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this record?")) return;

    try {
      await del(`${endpoint}/${id}`);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  if (!rows) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={load} />;


  return (
    <>
      <PageHeader
        title={title}
        description={description}
        action={ isAdmin &&
          <button className="button primary" onClick={() => open()}>
            + {createLabel}
          </button>
        }
      />

      {rows.length === 0 ? (
        <Empty />
      ) : (
        <DataTable
          columns={[
            ...columns,
            {
              key: "actions",
              label: "",
              render: r => (
                <div className="row-actions">
                  <button className="text-button" onClick={() => open(r)}>
                    Edit
                  </button>
                  <button className="danger-text" onClick={() => remove(r.id)}>
                    Delete
                  </button>
                </div>
              )
            }
          ]}
          rows={rows}
        />
      )}

      {modal && (
        <Modal
          title={editing ? `Edit ${title}` : `Create ${title}`}
          onClose={() => setModal(false)}
        >
          <form className="form" onSubmit={save}>
            {fields.map(f => (
              <label key={f.name}>
                {f.label}
                {f.type === "textarea" ? (
                  <textarea
                    value={form[f.name] ?? ""}
                    onChange={e =>
                      setForm({ ...form, [f.name]: e.target.value })
                    }
                    required={f.required !== false}
                  />
                ) : f.type === "select" ? (
                  <select
                    value={form[f.name] ?? ""}
                    onChange={e =>
                      setForm({ ...form, [f.name]: e.target.value })
                    }
                    required={f.required !== false}
                  >
                    {(f.options || []).map(o => (
                      <option key={o.value ?? o} value={o.value ?? o}>
                        {o.label ?? o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type || "text"}
                    value={form[f.name] ?? ""}
                    min={f.min}
                    max={f.max}
                    step={f.type === "number" ? "1" : undefined}
                    onChange={e =>
                      setForm({ ...form, [f.name]: e.target.value })
                    }
                    required={f.required !== false}
                  />
                )}
                {f.help && <small className="field-help">{f.help}</small>}
              </label>
            ))}

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
