import { useMemo } from "react";

// Grouped permission checkboxes with dependency handling:
//  - ticking a permission also ticks what it needs to work (e.g. timetable.create
//    needs timetable.view, subjects.view, ...),
//  - unticking a permission also unticks everything that needs it,
//  - permissions that come from a selected role are shown ticked + locked.
export default function PermissionPicker({ catalog, value, onChange, inherited = [], disabled = false }) {
  const { requires, dependents, label } = useMemo(() => {
    const requires = {};
    const dependents = {};
    const label = {};
    for (const g of catalog.groups) {
      for (const p of g.permissions) {
        requires[p.name] = p.requires || [];
        label[p.name] = p.label;
        for (const r of p.requires || []) (dependents[r] ||= []).push(p.name);
      }
    }
    return { requires, dependents, label };
  }, [catalog]);

  const selected = new Set(value);
  const inheritedSet = new Set(inherited);
  const isOn = (n) => selected.has(n) || inheritedSet.has(n);

  function withDeps(names) {
    const out = new Set(value);
    const visit = (n) => {
      if (out.has(n) || inheritedSet.has(n)) return;
      out.add(n);
      (requires[n] || []).forEach(visit);
    };
    names.forEach(visit);
    return [...out];
  }

  function withoutDependents(names) {
    const out = new Set(value);
    const visit = (n) => {
      if (!out.has(n)) return;
      out.delete(n);
      (dependents[n] || []).forEach(visit);
    };
    names.forEach(visit);
    return [...out];
  }

  const toggle = (name) => {
    if (disabled || inheritedSet.has(name)) return;
    onChange(selected.has(name) ? withoutDependents([name]) : withDeps([name]));
  };

  const applyPreset = (preset) => !disabled && onChange(withDeps(preset.permissions));

  return (
    <div className="perm-picker">
      {catalog.presets?.length > 0 && !disabled && (
        <div className="perm-presets">
          <span>Quick add:</span>
          {catalog.presets.map((p) => (
            <button type="button" key={p.key} className="perm-chip" title={p.description} onClick={() => applyPreset(p)}>
              + {p.label}
            </button>
          ))}
          {value.length > 0 && (
            <button type="button" className="perm-chip" onClick={() => onChange([])}>Clear all</button>
          )}
        </div>
      )}

      <div className="perm-groups">
        {catalog.groups.map((g) => {
          const names = g.permissions.map((p) => p.name);
          const allOn = names.every(isOn);
          return (
            <div className="perm-group" key={g.key}>
              <div className="perm-group-head">
                <strong>{g.label}</strong>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onChange(allOn ? withoutDependents(names.filter((n) => !inheritedSet.has(n))) : withDeps(names))}
                  >
                    {allOn ? "Clear" : "Select all"}
                  </button>
                )}
              </div>
              <div className="perm-list">
                {g.permissions.map((p) => {
                  const viaRole = inheritedSet.has(p.name);
                  return (
                    <label key={p.name} className={`perm-item${viaRole ? " locked" : ""}`}>
                      <input
                        type="checkbox"
                        checked={isOn(p.name)}
                        disabled={disabled || viaRole}
                        onChange={() => toggle(p.name)}
                      />
                      <span>
                        {p.label}
                        {viaRole && <small>from selected role</small>}
                        {!viaRole && (p.requires || []).length > 0 && selected.has(p.name) === false && (
                          <small title={p.requires.map((r) => label[r] || r).join(", ")}>
                            also adds {p.requires.length} required
                          </small>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="perm-summary">
        {new Set([...value, ...inherited]).size} permission(s) selected
      </div>
    </div>
  );
}
