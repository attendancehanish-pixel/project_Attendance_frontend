import { useEffect, useMemo, useState } from "react";
import { get, subjectAllocationApi } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import { Loading, ErrorState, Empty } from "../../../shared/components/State";
import { timetableApi, periodApi } from "../../../features/attendance/api/attendance-setup.api";
import { humanStatus } from "../../../shared/utils/format";
import { useAuth } from "../../../shared/context/AuthContext";
import P from "../../../shared/access/permissions";

// Sunday first so DAYS[date.getDay()] maps straight to a weekday.
const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];

const byIndex = (a, b) => a.periodIndex - b.periodIndex;

/**
 * Inline editor shown inside a period box. The admin only has to pick the
 * subject; "Attendance required" is ticked by default.
 */
function SlotEditor({ subjects, draft, setDraft, onSave, onCancel, saving, error, isEdit }) {
  return (
    <form
      className="slot-editor"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <select
        autoFocus
        required
        value={draft.subjectId}
        onChange={(e) => setDraft({ ...draft, subjectId: e.target.value })}
      >
        <option value="">Select subject</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <label className="slot-check">
        <input
          type="checkbox"
          checked={draft.attendanceRequired}
          onChange={(e) => setDraft({ ...draft, attendanceRequired: e.target.checked })}
        />
        Attendance required
      </label>

      {error && <div className="slot-error">{error}</div>}

      <div className="slot-editor-actions">
        <button className="button primary" disabled={saving || !draft.subjectId}>
          {saving ? "Saving…" : isEdit ? "Update" : "Save"}
        </button>
        <button type="button" className="button" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </form>
  );
}

const newDraft = (entry) => ({
  subjectId: entry?.subjectId || "",
  attendanceRequired: entry ? Boolean(entry.attendanceRequired) : true,
});

export default function Timetable() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(P.TIMETABLE_CREATE),
    canUpdate = hasPermission(P.TIMETABLE_UPDATE),
    canDelete = hasPermission(P.TIMETABLE_DELETE),
    canValidate = hasPermission(P.TIMETABLE_VALIDATE),
    canPublish = hasPermission(P.TIMETABLE_PUBLISH);

  const [years, setYears] = useState([]),
    [yearId, setYearId] = useState("");
  const [standards, setStandards] = useState([]),
    [standardId, setStandardId] = useState("");
  const [subjects, setSubjects] = useState([]),
    [allocatedIds, setAllocatedIds] = useState(null),
    [periods, setPeriods] = useState([]),
    [weekly, setWeekly] = useState([]);
  const [entries, setEntries] = useState(null),
    [dateEntries, setDateEntries] = useState([]);
  const [mode, setMode] = useState("normal");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState(null),
    [validation, setValidation] = useState(null);

  // The period box that is currently being edited (one at a time).
  // { scope: "normal" | "date", periodId, entryId | null }
  const [slot, setSlot] = useState(null);
  const [draft, setDraft] = useState(newDraft());
  const [saving, setSaving] = useState(false);
  const [slotError, setSlotError] = useState(null);

  async function loadYears() {
    const y = (await get("/academic-years")).data || [];
    setYears(y);
    if (!yearId) setYearId(y.find((x) => x.status === "ACTIVE")?.id || y[0]?.id || "");
  }

  async function loadBase() {
    if (!yearId) return;
    try {
      setError(null);
      const [s, sub, w] = await Promise.all([
        get("/standards"),
        get("/subjects"),
        get(`/weekly-holidays/${yearId}`),
      ]);
      setStandards(s.data || []);
      setSubjects(sub.data || []);
      setWeekly((w.data || []).map((x) => x.weekday));
      if (!standardId && (s.data || [])[0]) setStandardId(s.data[0].id);
    } catch (e) {
      setError(e);
    }
  }

  // Only subjects allocated to the selected standard can be scheduled (the
  // backend rejects anything else). If the user may not read allocations we
  // fall back to the full subject list.
  async function loadAllocations() {
    if (!yearId || !standardId) return;
    try {
      const r = await subjectAllocationApi.getByStandard(standardId, yearId);
      setAllocatedIds(new Set((r.data || []).map((a) => a.subjectId)));
    } catch {
      setAllocatedIds(null);
    }
  }

  async function loadNormal() {
    if (!yearId || !standardId) return;
    try {
      const [t, p] = await Promise.all([
        timetableApi.list(yearId, standardId),
        periodApi.list(yearId),
      ]);
      setEntries(t.data || []);
      setPeriods(p.data || []);
    } catch (e) {
      setError(e);
    }
  }

  async function loadDate() {
    if (!yearId || !standardId || !selectedDate) return;
    try {
      setDateEntries(
        (await timetableApi.listDateSpecific(yearId, selectedDate, standardId)).data || []
      );
    } catch (e) {
      setError(e);
    }
  }

  useEffect(() => {
    loadYears().catch(setError);
  }, []);
  useEffect(() => {
    loadBase();
  }, [yearId]);
  useEffect(() => {
    loadAllocations();
  }, [yearId, standardId]);
  useEffect(() => {
    loadNormal();
  }, [yearId, standardId]);
  useEffect(() => {
    loadDate();
  }, [yearId, standardId, selectedDate]);

  // Close any open editor when the context changes.
  useEffect(() => {
    setSlot(null);
  }, [yearId, standardId, mode, selectedDate]);

  const subjectOptions = useMemo(
    () => (allocatedIds ? subjects.filter((s) => allocatedIds.has(s.id)) : subjects),
    [subjects, allocatedIds]
  );

  // weekday -> its periods (sorted). Every period becomes a ready-made box.
  const periodsByDay = useMemo(() => {
    const m = new Map(DAYS.map((d) => [d, []]));
    periods.forEach((p) => {
      if (m.has(p.weekday)) m.get(p.weekday).push(p);
    });
    for (const list of m.values()) list.sort(byIndex);
    return m;
  }, [periods]);

  // periodId -> recurring entry, for the selected standard.
  const entryByPeriod = useMemo(
    () => new Map((entries || []).map((e) => [e.periodId, e])),
    [entries]
  );

  const dateWeekday = DAYS[new Date(`${selectedDate}T00:00:00`).getDay()];
  const datePeriods = periodsByDay.get(dateWeekday) || [];
  const dateEntryByPeriod = useMemo(
    () => new Map(dateEntries.map((e) => [e.periodId, e])),
    [dateEntries]
  );

  /* ------------------------------ slot actions ----------------------------- */

  function openSlot(scope, periodId, entry = null) {
    setSlot({ scope, periodId, entryId: entry?.id || null });
    setDraft(newDraft(entry));
    setSlotError(null);
  }

  function closeSlot() {
    setSlot(null);
    setSlotError(null);
  }

  async function saveSlot() {
    if (!slot || !draft.subjectId) return;
    setSaving(true);
    setSlotError(null);
    try {
      if (slot.scope === "normal") {
        const period = periods.find((p) => p.id === slot.periodId);
        const body = {
          academicYearId: yearId,
          standardId,
          weekday: period.weekday,
          periodId: slot.periodId,
          subjectId: draft.subjectId,
          attendanceRequired: draft.attendanceRequired,
        };
        if (slot.entryId) await timetableApi.update(slot.entryId, body);
        else await timetableApi.create(body);
        await loadNormal();
      } else {
        const body = {
          calendarDate: new Date(`${selectedDate}T00:00:00`).toISOString(),
          standardId,
          periodId: slot.periodId,
          subjectId: draft.subjectId,
          attendanceRequired: draft.attendanceRequired,
        };
        if (slot.entryId) await timetableApi.updateDateSpecific(slot.entryId, body);
        else await timetableApi.createDateSpecific(yearId, body);
        await loadDate();
      }
      closeSlot();
    } catch (e) {
      setSlotError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeNormal(id) {
    if (!confirm("Delete this recurring timetable entry?")) return;
    try {
      await timetableApi.delete(id);
      await loadNormal();
    } catch (e) {
      alert(e.message);
    }
  }

  async function removeDate(id) {
    if (!confirm("Delete this date-specific timetable entry?")) return;
    try {
      await timetableApi.deleteDateSpecific(id);
      await loadDate();
    } catch (e) {
      alert(e.message);
    }
  }

  async function validate() {
    try {
      setValidation((await timetableApi.validate(yearId)).data);
    } catch (e) {
      setValidation({ valid: false, errors: e.body?.details || [e.message] });
    }
  }

  async function publish() {
    try {
      await timetableApi.publish(yearId);
      alert("Timetable published.");
    } catch (e) {
      alert(e.message);
    }
  }

  /* -------------------------------- render --------------------------------- */

  const isEditing = (scope, periodId) => slot?.scope === scope && slot.periodId === periodId;

  const renderEditor = () => (
    <SlotEditor
      subjects={subjectOptions}
      draft={draft}
      setDraft={setDraft}
      onSave={saveSlot}
      onCancel={closeSlot}
      saving={saving}
      error={slotError}
      isEdit={Boolean(slot?.entryId)}
    />
  );

  // One period "box": filled card, inline editor, or an empty clickable slot.
  function renderSlot({ scope, period, entry, blocked }) {
    if (isEditing(scope, period.id)) {
      return (
        <div key={period.id}>
          <div className="slot-head">
            <strong>P{period.periodIndex}</strong>
            <span>
              {period.startTime} – {period.endTime}
            </span>
          </div>
          {renderEditor()}
        </div>
      );
    }

    if (entry) {
      return (
        <div className="period-card" key={period.id}>
          <div className="period-index">P{period.periodIndex}</div>
          <div className="period-main">
            <strong>{entry.subject?.name || entry.subjectId}</strong>
            <span>
              {period.startTime} – {period.endTime}
            </span>
          </div>
          <div className="period-flags">
            {!entry.attendanceRequired && <span className="status-badge absent">No attendance</span>}
          </div>
          <div className="row-actions">
            {canUpdate && (
              <button className="text-button" onClick={() => openSlot(scope, period.id, entry)}>
                Edit
              </button>
            )}
            {canDelete && (
              <button
                className="danger-text"
                onClick={() => (scope === "normal" ? removeNormal(entry.id) : removeDate(entry.id))}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      );
    }

    const clickable = canCreate && !blocked && Boolean(standardId);
    return (
      <button
        type="button"
        key={period.id}
        className="slot-empty"
        disabled={!clickable}
        onClick={() => openSlot(scope, period.id)}
        title={clickable ? "Click to choose a subject" : undefined}
      >
        <span>
          <strong>P{period.periodIndex}</strong> {period.startTime}–{period.endTime}
        </span>
        {clickable && <span>+ Subject</span>}
      </button>
    );
  }

  if (!years.length && !error) return <Loading />;

  return (
    <>
      <PageHeader
        title="Timetable"
        description="Configure the recurring weekly timetable separately from one-off date-specific schedules."
        action={
          <div className="row-actions">
            {canValidate && (
              <button className="button" onClick={validate} disabled={!yearId}>
                Validate
              </button>
            )}
            {canPublish && (
              <button className="button primary" onClick={publish} disabled={!yearId}>
                Publish
              </button>
            )}
          </div>
        }
      />
      <div className="toolbar timetable-toolbar">
        <label className="inline-label">
          Academic year
          <select value={yearId} onChange={(e) => setYearId(e.target.value)}>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-label">
          Standard
          <select value={standardId} onChange={(e) => setStandardId(e.target.value)}>
            {standards.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <ErrorState
          error={error}
          onRetry={() => {
            loadBase();
            loadNormal();
            loadDate();
          }}
        />
      )}
      <div className="card timetable-mode-tabs">
        <button className={`button ${mode === "normal" ? "primary" : ""}`} onClick={() => setMode("normal")}>
          Recurring timetable
        </button>
        <button className={`button ${mode === "date" ? "primary" : ""}`} onClick={() => setMode("date")}>
          Date-specific timetable
        </button>
      </div>

      {mode === "normal" ? (
        <div className="card">
          <div className="table-headline">
            <div>
              <span className="eyebrow">NORMAL_TIMETABLE</span>
              <h3>{standards.find((s) => s.id === standardId)?.name || "Select a standard"}</h3>
            </div>
          </div>

          {canCreate && (
            <p className="muted small" style={{ marginBottom: 10 }}>
              Click any period box, choose the subject, and save. Attendance is required by default.
            </p>
          )}

          <div className="timetable-grid">
            {DAYS.map((day) => {
              const holiday = weekly.includes(day);
              const list = periodsByDay.get(day) || [];
              return (
                <div className={`day-column ${holiday ? "weekly-holiday-column" : ""}`} key={day}>
                  <div className="day-header">
                    <strong>{humanStatus(day)}</strong>
                    {holiday && <span className="status-badge">Weekly holiday</span>}
                  </div>
                  {list.length === 0 ? (
                    <div className="day-empty">No periods configured</div>
                  ) : (
                    list.map((period) =>
                      renderSlot({
                        scope: "normal",
                        period,
                        entry: entryByPeriod.get(period.id),
                        blocked: holiday,
                      })
                    )
                  )}
                </div>
              );
            })}
          </div>
          <div className="callout">
            Recurring entries describe the normal week. They are never converted into date-specific
            entries. A substitute teacher is handled separately and does not change this source.
            Weekly holidays cannot receive new recurring entries.
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-headline">
            <div>
              <span className="eyebrow">DATE_SPECIFIC_TIMETABLE</span>
              <h3>One-off schedule</h3>
            </div>
          </div>
          <div className="toolbar">
            <label className="inline-label">
              Date
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </label>
          </div>

          {datePeriods.length === 0 ? (
            <Empty>No periods are configured for {humanStatus(dateWeekday)}. Add them on the Periods page.</Empty>
          ) : (
            <div className="slot-list">
              {datePeriods.map((period) =>
                renderSlot({
                  scope: "date",
                  period,
                  entry: dateEntryByPeriod.get(period.id),
                  blocked: false,
                })
              )}
            </div>
          )}

          <div className="callout">
            Use this for a special working Sunday, an examination-day schedule, or any other one-off
            timetable. The backend marks resulting attendance sessions as DATE_SPECIFIC_TIMETABLE.
          </div>
        </div>
      )}

      {validation && (
        <div className={`callout ${validation.valid ? "validation-ok" : "validation-error"}`}>
          <strong>{validation.valid ? "Timetable is valid" : "Timetable validation found issues"}</strong>
          {validation.errors?.length > 0 && (
            <ul>
              {validation.errors.map((x, i) => (
                <li key={i}>{typeof x === "string" ? x : x.message || JSON.stringify(x)}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
