import { useEffect, useMemo, useState } from "react";
import { get } from "../../../shared/api/client";
import PageHeader from "../../../shared/components/PageHeader";
import Modal from "../../../shared/components/Modal";
import { Loading, ErrorState } from "../../../shared/components/State";
import {
  periodConfigurationApi,
  periodApi,
} from "../../../features/attendance/api/attendance-setup.api";
import { humanStatus } from "../../../shared/utils/format";

const DAYS = [
  ["MONDAY", "Monday"],
  ["TUESDAY", "Tuesday"],
  ["WEDNESDAY", "Wednesday"],
  ["THURSDAY", "Thursday"],
  ["FRIDAY", "Friday"],
  ["SATURDAY", "Saturday"],
  ["SUNDAY", "Sunday"],
];

const emptyPeriod = {
  weekday: "MONDAY",
  periodIndex: "1",
  startTime: "09:00",
  endTime: "09:45",
};

const makeOutlinePeriod = (
  index,
  startTime = "09:00",
  duration = 45,
  breakAfter = 0
) => ({
  periodIndex: index,
  startTime,
  durationMinutes: duration,
  breakAfterMinutes: breakAfter,
});

const timeToMinutes = (time) => {
  if (!time) return 0;

  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const normalized = minutes % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export default function Configuration() {
  const [years, setYears] = useState([]);
  const [yearId, setYearId] = useState("");

  const [config, setConfig] = useState(null);
  const [periods, setPeriods] = useState([]);

  const [weekday, setWeekday] = useState("MONDAY");
  const [error, setError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [periodModal, setPeriodModal] = useState(false);
  const [periodForm, setPeriodForm] = useState(emptyPeriod);
  const [editing, setEditing] = useState(null);

  const [outline, setOutline] = useState([]);
  const [outlineSaving, setOutlineSaving] = useState(false);

  /* ---------------------------------------------------------------------- */
  /* Helpers                                                                */
  /* ---------------------------------------------------------------------- */

  function buildOutlineFromPeriods(allPeriods) {
    const sourceWeekday = DAYS.map(([value]) => value).find((day) =>
      allPeriods.some((period) => period.weekday === day)
    );

    if (!sourceWeekday) {
      const duration = Number(config?.defaultDurationMinutes || 45);
      const start = config?.firstPeriodStartTime || "09:00";

      return Array.from(
        { length: Number(config?.totalPeriodCount || 1) },
        (_, index) => {
          const startMinutes =
            timeToMinutes(start) + index * duration;

          return makeOutlinePeriod(
            index + 1,
            minutesToTime(startMinutes),
            duration,
            Number(config?.defaultBreakMinutes || 0)
          );
        }
      );
    }

    return allPeriods
      .filter((period) => period.weekday === sourceWeekday)
      .sort((a, b) => a.periodIndex - b.periodIndex)
      .map((period, index, rows) => {
        const duration =
          timeToMinutes(period.endTime) -
          timeToMinutes(period.startTime);

        const next = rows[index + 1];

        const breakAfter = next
          ? Math.max(
            0,
            timeToMinutes(next.startTime) -
            timeToMinutes(period.endTime)
          )
          : 0;

        return makeOutlinePeriod(
          period.periodIndex,
          period.startTime,
          duration,
          breakAfter
        );
      });
  }

  async function loadYears() {
    const r = (await get("/academic-years")).data || [];
    setYears(r);

    if (!yearId) {
      setYearId(
        r.find((x) => x.status === "ACTIVE")?.id || r[0]?.id || ""
      );
    }
  }

  async function load() {
    if (!yearId) return;

    try {
      setError(null);

      const r = await periodConfigurationApi.getSetup(yearId);

      const nextConfig = r.data?.configuration || null;
      const nextPeriods = r.data?.periods || [];

      setConfig(nextConfig);
      setPeriods(nextPeriods);

      if (nextConfig?.sameOutlineForAllDays) {
        const storedOutline = r.data?.outline || [];

        if (storedOutline.length > 0) {
          setOutline(
            storedOutline.map((row) => ({
              periodIndex: row.periodIndex,
              startTime: row.startTime,
              durationMinutes: row.durationMinutes,
              breakAfterMinutes: row.breakAfterMinutes,
            }))
          );
        } else {
          // Backward compatibility: derive from generated periods if no
          // outline was stored yet.
          setOutline(buildOutlineFromPeriods(nextPeriods));
        }
      } else {
        setOutline([]);
      }
    } catch (e) {
      setError(e);
    }
  }

  useEffect(() => {
    loadYears().catch(setError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearId]);

  const visiblePeriods = useMemo(
    () =>
      periods
        .filter(
          (p) => p.weekday === weekday || String(p.weekday) === weekday
        )
        .sort((a, b) => a.periodIndex - b.periodIndex),
    [periods, weekday]
  );

  /* ---------------------------------------------------------------------- */
  /* Save config                                                            */
  /* ---------------------------------------------------------------------- */

  async function saveConfig(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const r = await periodConfigurationApi.upsert(yearId, {
        totalPeriodCount: Number(config.totalPeriodCount),

        defaultDurationMinutes:
          config.defaultDurationMinutes === ""
            ? null
            : Number(config.defaultDurationMinutes),

        isDurationDefault: Boolean(config.isDurationDefault),

        sameOutlineForAllDays: Boolean(config.sameOutlineForAllDays),

        firstPeriodStartTime: config.firstPeriodStartTime || null,

        defaultBreakMinutes:
          config.defaultBreakMinutes === ""
            ? null
            : Number(config.defaultBreakMinutes),

        outline: config.sameOutlineForAllDays
          ? outline.map((p) => ({
            periodIndex: Number(p.periodIndex),
            startTime: p.startTime,
            durationMinutes: Number(p.durationMinutes),
            breakAfterMinutes: Number(p.breakAfterMinutes || 0),
          }))
          : [],
      });

      setConfig(r.data || r);

      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Outline editor                                                         */
  /* ---------------------------------------------------------------------- */

  function updateOutlinePeriod(index, field, value) {
    setOutline((current) => {
      const updated = current.map((period, i) =>
        i === index ? { ...period, [field]: value } : period
      );

      return recalculateOutline(updated, index);
    });
  }

  function recalculateOutline(rows, changedIndex = 0) {
    const result = rows.map((row) => ({ ...row }));

    for (let i = changedIndex + 1; i < result.length; i++) {
      const previous = result[i - 1];

      const previousEnd =
        timeToMinutes(previous.startTime) +
        Number(previous.durationMinutes || 0);

      const nextStart =
        previousEnd + Number(previous.breakAfterMinutes || 0);

      result[i].startTime = minutesToTime(nextStart);
    }

    return result;
  }

  function addOutlinePeriod() {
    setOutline((current) => {
      if (!current.length) {
        return [
          makeOutlinePeriod(
            1,
            config?.firstPeriodStartTime || "09:00",
            Number(config?.defaultDurationMinutes || 45),
            Number(config?.defaultBreakMinutes || 0)
          ),
        ];
      }

      const last = current[current.length - 1];

      const lastEnd =
        timeToMinutes(last.startTime) +
        Number(last.durationMinutes || 0);

      const nextStart =
        lastEnd + Number(last.breakAfterMinutes || 0);

      return [
        ...current,
        makeOutlinePeriod(
          current.length + 1,
          minutesToTime(nextStart),
          Number(config?.defaultDurationMinutes || 45),
          0
        ),
      ];
    });
  }

  function removeOutlinePeriod(index) {
    setOutline((current) =>
      current
        .filter((_, i) => i !== index)
        .map((period, i) => ({
          ...period,
          periodIndex: i + 1,
        }))
    );
  }

  function getOutlineEndTime(period) {
    return minutesToTime(
      timeToMinutes(period.startTime) +
      Number(period.durationMinutes || 0)
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Generate                                                               */
  /* ---------------------------------------------------------------------- */

  async function generate() {
    if (!config) return;

    if (config.sameOutlineForAllDays && !outline.length) {
      alert("Please configure the period outline first.");
      return;
    }

    if (
      !confirm(
        "Generate periods from this configuration? Existing timetable/attendance-linked periods cannot be replaced."
      )
    ) {
      return;
    }

    setGenerating(true);

    try {
      await periodApi.generate(yearId, {
        weekdays: DAYS.map(([value]) => value),
        replaceExisting: false,
        sameOutlineForAllDays: Boolean(config.sameOutlineForAllDays),

        outline: config.sameOutlineForAllDays
          ? outline.map((period) => ({
            periodIndex: Number(period.periodIndex),
            startTime: period.startTime,
            durationMinutes: Number(period.durationMinutes),
            breakAfterMinutes: Number(period.breakAfterMinutes || 0),
          }))
          : undefined,
      });

      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setGenerating(false);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Manual period CRUD                                                     */
  /* ---------------------------------------------------------------------- */

  function openCreate() {
    setEditing(null);
    setPeriodForm({
      weekday,
      periodIndex: String(visiblePeriods.length + 1),
      startTime: config?.firstPeriodStartTime || "09:00",
      endTime: "09:45",
    });
    setPeriodModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setPeriodForm({
      weekday: p.weekday,
      periodIndex: String(p.periodIndex),
      startTime: p.startTime,
      endTime: p.endTime,
    });
    setPeriodModal(true);
  }

  async function savePeriod(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const body = {
        weekday: periodForm.weekday,
        periodIndex: Number(periodForm.periodIndex),
        startTime: periodForm.startTime,
        endTime: periodForm.endTime,
      };

      if (editing) await periodApi.update(editing.id, body);
      else await periodApi.create(yearId, body);

      setPeriodModal(false);
      await load();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function removePeriod(id) {
    if (!confirm("Delete this period?")) return;

    try {
      await periodApi.delete(id);
      await load();
    } catch (e) {
      alert(e.message);
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  if (!years.length && !error) return <Loading />;

  return (
    <>
      <PageHeader
        title="Configuration"
        description="Configure the academic-year period structure and exact period timings for each weekday."
      />

      <div className="toolbar">
        <label className="inline-label">
          Academic year
          <select
            value={yearId}
            onChange={(e) => setYearId(e.target.value)}
          >
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={load} />
      ) : (
        <>
          {/* ------------------------------------------------------------ */}
          {/* Period configuration card                                    */}
          {/* ------------------------------------------------------------ */}
          <div className="card configuration-card">
            <div className="table-headline">
              <div>
                <span className="eyebrow">Period configuration</span>
                <h3>Daily schedule rules</h3>
              </div>

              <button
                className="button primary"
                disabled={saving || generating || !config}
                onClick={generate}
              >
                {generating ? "Generating…" : "Generate periods"}
              </button>
            </div>

            <form className="form" onSubmit={saveConfig}>
              {/* Row 1: totals + default duration */}
              <div className="form-grid">
                <label>
                  Total periods
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={config?.totalPeriodCount ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        totalPeriodCount: e.target.value,
                      })
                    }
                    required
                  />
                </label>

                <label>
                  Default duration (minutes)
                  <input
                    type="number"
                    min="1"
                    value={config?.defaultDurationMinutes ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        defaultDurationMinutes: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {/* Row 2: start time + default break */}
              <div className="form-grid">
                <label>
                  First period starts
                  <input
                    type="time"
                    value={config?.firstPeriodStartTime || ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        firstPeriodStartTime: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Default break (minutes)
                  <input
                    type="number"
                    min="0"
                    value={config?.defaultBreakMinutes ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        defaultBreakMinutes: e.target.value,
                      })
                    }
                  />
                </label>
              </div>

              {/* Toggle: default duration */}
              <label className="check-card">
                <input
                  type="checkbox"
                  checked={Boolean(config?.isDurationDefault)}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      isDurationDefault: e.target.checked,
                    })
                  }
                />
                <span>
                  <strong>Use one default duration</strong>
                  <small>
                    Period generation can use the configured duration
                    unless individual timings are entered.
                  </small>
                </span>
              </label>

              {/* Toggle: same outline for all days */}
              <label className="check-card">
                <input
                  type="checkbox"
                  checked={Boolean(config?.sameOutlineForAllDays)}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      sameOutlineForAllDays: e.target.checked,
                    })
                  }
                />
                <span>
                  <strong>Same period outline for all days</strong>
                  <small>
                    Keep the same period count/order across weekdays.
                    Timings can still be edited per weekday below.
                  </small>
                </span>
              </label>

              {/* -------------------------------------------------------- */}
              {/* Common outline editor                                     */}
              {/* -------------------------------------------------------- */}
              {config?.sameOutlineForAllDays && (
                <div className="period-outline-editor">
                  <div className="table-headline">
                    <div>
                      <span className="eyebrow">
                        Common period outline
                      </span>
                      <h3>Daily period schedule</h3>
                      <p className="muted">
                        This schedule will be generated for every
                        selected weekday.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="button"
                      onClick={addOutlinePeriod}
                    >
                      + Add period
                    </button>
                  </div>

                  {outline.length === 0 ? (
                    <div className="empty">
                      No periods in the outline. Add your first period.
                    </div>
                  ) : (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Period</th>
                            <th>Start</th>
                            <th>Duration</th>
                            <th>End</th>
                            <th>Break after</th>
                            <th>Action</th>
                          </tr>
                        </thead>

                        <tbody>
                          {outline.map((period, index) => (
                            <tr key={period.periodIndex}>
                              <td>
                                <strong>P{period.periodIndex}</strong>
                              </td>

                              <td>
                                <input
                                  type="time"
                                  value={period.startTime}
                                  onChange={(e) =>
                                    updateOutlinePeriod(
                                      index,
                                      "startTime",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <input
                                  type="number"
                                  min="1"
                                  max="240"
                                  value={period.durationMinutes}
                                  onChange={(e) =>
                                    updateOutlinePeriod(
                                      index,
                                      "durationMinutes",
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </td>

                              <td>
                                <strong>
                                  {getOutlineEndTime(period)}
                                </strong>
                              </td>

                              <td>
                                {index < outline.length - 1 ? (
                                  <input
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={period.breakAfterMinutes}
                                    onChange={(e) =>
                                      updateOutlinePeriod(
                                        index,
                                        "breakAfterMinutes",
                                        Number(e.target.value)
                                      )
                                    }
                                  />
                                ) : (
                                  <span className="muted">—</span>
                                )}
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="danger-text"
                                  onClick={() =>
                                    removeOutlinePeriod(index)
                                  }
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="callout">
                    <strong>How timing works:</strong> Each period uses
                    its start time and duration. The break after a
                    period automatically determines the next period's
                    start time.
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button
                  className="button primary"
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save configuration"}
                </button>
              </div>
            </form>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Per-weekday period timings card                              */}
          {/* ------------------------------------------------------------ */}
          <div className="card" style={{ marginTop: 15 }}>
            <div className="table-headline">
              <div>
                <span className="eyebrow">Period timings</span>
                <h3>{humanStatus(weekday)}</h3>
              </div>

              <button className="button" onClick={openCreate}>
                + Add period
              </button>
            </div>

            <div className="toolbar">
              <div className="weekday-tabs">
                {DAYS.map(([v, l]) => (
                  <button
                    type="button"
                    key={v}
                    className={`button ${weekday === v ? "primary" : ""
                      }`}
                    onClick={() => setWeekday(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {visiblePeriods.length === 0 ? (
              <div className="empty">
                No periods configured for {humanStatus(weekday)}.
                Generate the schedule or add them manually.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Period</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {visiblePeriods.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>P{p.periodIndex}</strong>
                        </td>
                        <td>{p.startTime}</td>
                        <td>{p.endTime}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="text-button"
                              onClick={() => openEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              className="danger-text"
                              onClick={() => removePeriod(p.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="callout">
              Period rows are weekday-specific. This lets Monday,
              Tuesday, etc. have different start/end times while
              retaining the same period numbers.
            </div>
          </div>
        </>
      )}

      {/* -------------------------------------------------------------- */}
      {/* Add / Edit period modal                                        */}
      {/* -------------------------------------------------------------- */}
      {periodModal && (
        <Modal
          title={editing ? "Edit period" : "Add period"}
          onClose={() => setPeriodModal(false)}
        >
          <form className="form" onSubmit={savePeriod}>
            <label>
              Weekday
              <select
                value={periodForm.weekday}
                onChange={(e) =>
                  setPeriodForm({
                    ...periodForm,
                    weekday: e.target.value,
                  })
                }
              >
                {DAYS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-grid">
              <label>
                Period number
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={periodForm.periodIndex}
                  onChange={(e) =>
                    setPeriodForm({
                      ...periodForm,
                      periodIndex: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <div />
            </div>

            <div className="form-grid">
              <label>
                Start time
                <input
                  type="time"
                  value={periodForm.startTime}
                  onChange={(e) =>
                    setPeriodForm({
                      ...periodForm,
                      startTime: e.target.value,
                    })
                  }
                  required
                />
              </label>

              <label>
                End time
                <input
                  type="time"
                  value={periodForm.endTime}
                  onChange={(e) =>
                    setPeriodForm({
                      ...periodForm,
                      endTime: e.target.value,
                    })
                  }
                  required
                />
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="button"
                onClick={() => setPeriodModal(false)}
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