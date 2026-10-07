import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Users,
  X,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { get, post } from "../../../shared/api/client";
import { dateOnly } from "../../../shared/utils/format";
import StatusBadge from "./StatusBadge";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeStatus(status) {
  return String(status).toUpperCase();
}

const READ_ONLY_REASONS = {
  SUBMITTED: {
    tone: "success",
    title: "Attendance is already submitted",
    description:
      "This session is read-only. Use the correction workflow if a change is required.",
  },
  MARKED: {
    tone: "success",
    title: "Attendance is already submitted",
    description:
      "This session is read-only. Use the correction workflow if a change is required.",
  },
  CLOSED: {
    tone: "neutral",
    title: "This session is closed",
    description:
      "Attendance for this period has been closed and can no longer be edited.",
  },
  CANCELLED: {
    tone: "danger",
    title: "This session was cancelled",
    description:
      "No attendance is expected for this period. It will not be counted in reports.",
  },
  STAFF_LEAVE: {
    tone: "info",
    title: "Staff is on leave",
    description:
      "No attendance can be marked for this period because the assigned staff member is on leave.",
  },
};

const READ_ONLY_TONES = {
  success: {
    wrapper: "border-[#abefc6] bg-[#ecfdf3]",
    icon: "text-[#027a48]",
    title: "text-[#027a48]",
    body: "text-[#05603a]",
    Icon: CheckCircle2,
  },
  info: {
    wrapper: "border-[#d6bbfb] bg-[#f4ebff]",
    icon: "text-[#6941c6]",
    title: "text-[#6941c6]",
    body: "text-[#5925dc]",
    Icon: Clock3,
  },
  neutral: {
    wrapper: "border-[#e4e7ec] bg-[#f2f4f7]",
    icon: "text-[#475467]",
    title: "text-[#344054]",
    body: "text-[#475467]",
    Icon: AlertCircle,
  },
  danger: {
    wrapper: "border-[#fecdca] bg-[#fef3f2]",
    icon: "text-[#b42318]",
    title: "text-[#b42318]",
    body: "text-[#912018]",
    Icon: AlertCircle,
  },
};

/*
|--------------------------------------------------------------------------
| Confirmation dialog
|--------------------------------------------------------------------------
*/

function SubmitConfirmDialog({
  session,
  presentCount,
  absentCount,
  totalCount,
  busy,
  onCancel,
  onConfirm,
}) {
  const periodLabel =
    session?.period?.periodIndex ?? session?.periodIndex ?? "—";
  const subjectLabel =
    session?.subject?.name || session?.subjectName || "Attendance";
  const classLabel =
    session?.standard?.name || session?.standardName || "—";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-2xl border border-[#e8ebf1] bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fffaeb] text-[#b54708]">
            <AlertTriangle size={19} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-[#172033]">
              Submit attendance?
            </h3>
            <p className="mt-1 text-[12px] leading-5 text-[#667085]">
              This will lock the session and attendance can no longer be edited
              without a correction.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2 border-y border-[#eef1f5] bg-[#f8fafc] px-5 py-4 text-[12px] text-[#344054]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#667085]">Class</span>
            <span className="font-medium text-[#172033]">{classLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#667085]">Subject</span>
            <span className="font-medium text-[#172033]">{subjectLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#667085]">Period</span>
            <span className="font-medium text-[#172033]">P{periodLabel}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#667085]">Total students</span>
            <span className="font-medium text-[#172033]">{totalCount}</span>
          </div>
          {/* <div className="flex items-center justify-between gap-3">
            <span className="text-[#667085]">Present</span>
            <span className="font-medium text-[#027a48]">{presentCount}</span>
          </div> */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#667085]">Absent</span>
            <span className="font-medium text-[#b42318]">{absentCount}</span>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-[#d8dee8] bg-white px-4 py-2.5 text-[12px] font-medium text-[#344054] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#172033] px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#0f1626] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserCheck size={15} />
            {busy ? "Submitting…" : "Confirm & submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Modal
|--------------------------------------------------------------------------
*/

export default function AttendanceSessionModal({ sessionId, onClose, onMarked }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [absenceTypes, setAbsenceTypes] = useState([]);

  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Controls the confirmation dialog.
  const [confirmOpen, setConfirmOpen] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Load session + students + absence types
  |--------------------------------------------------------------------------
  */

  const load = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const [sessionResponse, absenceTypesResponse] = await Promise.all([
        get(`/attendance/sessions/${sessionId}/students`),
        get("/absence-types"),
      ]);

      const data = sessionResponse?.data || {};
      const sessionData = data.session || {};
      const rawStudents = Array.isArray(data.students) ? data.students : [];

      const records = Array.isArray(data.attendanceRecords)
        ? data.attendanceRecords
        : Array.isArray(data.records)
          ? data.records
          : [];

      const recordMap = new Map(records.map((r) => [r.studentId, r]));

      const mergedStudents = rawStudents.map((student) => {
        const existing = recordMap.get(student.id);
        return {
          id: student.id,
          name: student.name || student.studentName || "Unnamed student",
          admissionNo: student.admissionNo || null,
          rollNo: student.rollNo ?? student.rollNumber ?? null,
          status: normalizeStatus(existing?.status || student.status || "PRESENT"),
          absenceTypeId:
            existing?.absenceTypeId || student.absenceTypeId || null,
          remarks: existing?.remarks || student.remarks || "",
        };
      });

      setSession(sessionData);
      setStudents(mergedStudents);

      setAbsenceTypes(
        Array.isArray(absenceTypesResponse?.data)
          ? absenceTypesResponse.data
          : []
      );
    } catch (e) {
      console.error("Failed to load attendance session:", e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  /*
  |--------------------------------------------------------------------------
  | Derived values
  |--------------------------------------------------------------------------
  */

  const sessionStatus = normalizeStatus(session?.sessionStatus || "PENDING");
  const isEditable = sessionStatus === "PENDING";

  const readOnlyReason = !isEditable
    ? READ_ONLY_REASONS[sessionStatus] || {
        tone: "neutral",
        title: "This session is read-only",
        description: "This attendance session can no longer be edited.",
      }
    : null;

  const hideRoster =
    sessionStatus === "STAFF_LEAVE" || sessionStatus === "CANCELLED";

  const presentCount = useMemo(
    () => students.filter((s) => s.status === "PRESENT").length,
    [students]
  );

  const absentCount = useMemo(
    () => students.filter((s) => s.status === "ABSENT").length,
    [students]
  );

  /*
  |--------------------------------------------------------------------------
  | Update a student
  |--------------------------------------------------------------------------
  */

  function updateStudent(id, patch) {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, ...patch } : student
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  |
  | `requestSubmit` validates the form and opens the confirmation dialog.
  | `confirmSubmit` performs the actual network call.
  |
  */

  function requestSubmit() {
    if (!session) return;
    setSubmitError(null);

    if (students.length === 0) {
      setSubmitError("No students found for this class.");
      return;
    }

    // Validate: absent students must have absence type + remarks
    const invalidAbsent = students.find(
      (s) =>
        s.status === "ABSENT" &&
        (!s.absenceTypeId || !String(s.remarks || "").trim())
    );

    if (invalidAbsent) {
      setSubmitError(
        `For every absent student, both absence type and description are required. (${invalidAbsent.name})`
      );
      return;
    }

    setConfirmOpen(true);
  }

  async function confirmSubmit() {
    if (!session) return;
    setSubmitError(null);

    const records = students.map((s) => {
      const status = s.status === "ABSENT" ? "ABSENT" : "PRESENT";
      const record = { studentId: s.id, status };
      if (status === "ABSENT") {
        record.absenceTypeId = s.absenceTypeId;
        record.remarks = String(s.remarks || "").trim();
      }
      return record;
    });

    setBusy(true);

    try {
      await post(`/attendance/sessions/${session.id}/mark`, { records });

      // Notify parent to refresh dashboard
      if (typeof onMarked === "function") onMarked();
      setConfirmOpen(false);
      onClose?.();
    } catch (e) {
      console.error("Failed to submit attendance:", e);
      setSubmitError(e?.message || "Unable to submit attendance.");
      // Keep the confirm dialog open so the user can retry or dismiss.
    } finally {
      setBusy(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
        onClick={busy ? undefined : onClose}
      >
        <div
          className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-[#e8ebf1] bg-white shadow-xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex items-start justify-between border-b border-[#eef1f5] px-5 py-4">
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#7a8497]">
                Attendance session
              </span>

              <h2 className="mt-1 truncate text-lg font-semibold tracking-[-0.02em] text-[#172033]">
                {session?.subject?.name || session?.subjectName || "Attendance"}
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#667085]">
                <span>{session?.standard?.name || session?.standardName || "—"}</span>
                <span>•</span>
                <span>
                  Period {session?.period?.periodIndex ?? session?.periodIndex ?? "—"}
                </span>
                {(session?.period?.startTime || session?.startTime) && (
                  <>
                    <span>•</span>
                    <span>
                      {session?.period?.startTime || session?.startTime} –{" "}
                      {session?.period?.endTime || session?.endTime || "—"}
                    </span>
                  </>
                )}
                {session?.attendanceDate && (
                  <>
                    <span>•</span>
                    <span>{dateOnly(session.attendanceDate)}</span>
                  </>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e4e7ec] text-[#667085] transition hover:bg-[#f8fafc] hover:text-[#172033] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={17} />
            </button>
          </div>

          {/* STATUS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eef1f5] bg-[#f8fafc] px-5 py-3">
            <StatusBadge status={sessionStatus} />

            {!hideRoster && (
              <div className="flex items-center gap-4 text-[11px] text-[#667085]">
                <span>{presentCount} present</span>
                <span>{absentCount} absent</span>
                <span>{students.length} total</span>
              </div>
            )}
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="p-10 text-center text-[12px] text-[#98a2b3]">
                Loading session…
              </div>
            )}

            {error && !loading && (
              <div className="m-5 flex items-start gap-3 rounded-xl border border-[#fecdca] bg-[#fef3f2] p-4">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#b42318]" />
                <div>
                  <p className="text-[12px] font-semibold text-[#b42318]">
                    Couldn&apos;t load this session
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-[#912018]">
                    {error.message || "Please try again."}
                  </p>
                  <button
                    type="button"
                    onClick={load}
                    className="mt-3 rounded-lg border border-[#d8dee8] bg-white px-3 py-1.5 text-[11px] font-medium text-[#344054] transition hover:bg-[#f8fafc]"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Read-only banner — tone and copy depend on session status */}
            {!loading && !error && readOnlyReason && (() => {
              const tone =
                READ_ONLY_TONES[readOnlyReason.tone] || READ_ONLY_TONES.neutral;
              const ToneIcon = tone.Icon;

              return (
                <div
                  className={`mx-5 mt-4 flex items-start gap-3 rounded-xl border p-4 ${tone.wrapper}`}
                >
                  <ToneIcon size={18} className={`mt-0.5 shrink-0 ${tone.icon}`} />
                  <div>
                    <p className={`text-[12px] font-semibold ${tone.title}`}>
                      {readOnlyReason.title}
                    </p>
                    <p className={`mt-1 text-[11px] leading-5 ${tone.body}`}>
                      {readOnlyReason.description}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Dedicated empty state for staff-leave / cancelled sessions */}
            {!loading && !error && hideRoster && (
              <div className="m-5 rounded-2xl border border-[#e8ebf1] bg-[#f8fafc] p-8 text-center">
                <Users size={26} className="mx-auto text-[#98a2b3]" />
                <p className="mt-2 text-[12px] font-semibold text-[#172033]">
                  {sessionStatus === "STAFF_LEAVE"
                    ? "No attendance for this period"
                    : "This session was cancelled"}
                </p>
                <p className="mt-1 text-[11px] text-[#667085]">
                  {sessionStatus === "STAFF_LEAVE"
                    ? "The assigned staff member is on leave, so attendance cannot be marked."
                    : "Cancelled sessions are not counted in attendance reports."}
                </p>
              </div>
            )}

            {/* Generic empty state when a normal session has no students */}
            {!loading &&
              !error &&
              !hideRoster &&
              students.length === 0 && (
                <div className="m-5 rounded-2xl border border-[#e8ebf1] bg-[#f8fafc] p-8 text-center">
                  <Users size={26} className="mx-auto text-[#98a2b3]" />
                  <p className="mt-2 text-[12px] font-semibold text-[#172033]">
                    No students found
                  </p>
                  <p className="mt-1 text-[11px] text-[#667085]">
                    This class currently has no students available for attendance.
                  </p>
                </div>
              )}

            {/* Student roster — only for sessions that can actually be marked */}
            {!loading &&
              !error &&
              !hideRoster &&
              students.length > 0 && (
                <div className="space-y-2 p-5">
                  {students.map((student, index) => {
                    const isAbsent = student.status === "ABSENT";

                    return (
                      <div
                        key={student.id}
                        className={`rounded-xl border p-4 transition ${
                          isAbsent
                            ? "border-[#fecdca] bg-[#fef3f2]"
                            : "border-[#e8ebf1] bg-white"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f2f4f7] text-[11px] font-semibold text-[#667085]">
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-[#172033]">
                              {student.name}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#667085]">
                              {student.rollNo != null && (
                                <span>Roll No: {student.rollNo}</span>
                              )}
                              {student.admissionNo && (
                                <span>Admission No: {student.admissionNo}</span>
                              )}
                            </div>
                          </div>

                          <div className="w-32 shrink-0">
                            <select
                              disabled={!isEditable || busy}
                              value={student.status}
                              onChange={(e) => {
                                const status = e.target.value;
                                updateStudent(student.id, {
                                  status,
                                  ...(status === "PRESENT"
                                    ? { absenceTypeId: null, remarks: "" }
                                    : {}),
                                });
                              }}
                              className={`w-full rounded-lg border px-3 py-2 text-[12px] outline-none transition ${
                                isAbsent
                                  ? "border-[#fda29b] bg-white text-[#b42318]"
                                  : "border-[#d8dee8] bg-white text-[#172033]"
                              } disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              <option value="PRESENT">Present</option>
                              <option value="ABSENT">Absent</option>
                            </select>
                          </div>
                        </div>

                        {isAbsent && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            <select
                              disabled={!isEditable || busy}
                              value={student.absenceTypeId || ""}
                              onChange={(e) =>
                                updateStudent(student.id, {
                                  absenceTypeId: e.target.value || null,
                                })
                              }
                              className="w-full rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[12px] text-[#172033] outline-none transition focus:border-[#667085] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">Select absence type *</option>
                              {absenceTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                  {type.name}
                                </option>
                              ))}
                            </select>

                            <input
                              disabled={!isEditable || busy}
                              value={student.remarks || ""}
                              onChange={(e) =>
                                updateStudent(student.id, { remarks: e.target.value })
                              }
                              placeholder="Description required *"
                              className="w-full rounded-lg border border-[#d8dee8] bg-white px-3 py-2 text-[12px] text-[#172033] outline-none transition placeholder:text-[#98a2b3] focus:border-[#667085] disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
          </div>

          {/* FOOTER */}
          <div className="border-t border-[#eef1f5] bg-white px-5 py-4">
            {submitError && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-[#fecdca] bg-[#fef3f2] px-3 py-2 text-[11px] text-[#b42318]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[11px] text-[#667085]">
                {!isEditable
                  ? readOnlyReason?.title || "This session is read-only."
                  : absentCount > 0
                    ? `${absentCount} absent student${
                        absentCount === 1 ? "" : "s"
                      } require absence details.`
                    : "All students are currently marked present."}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="rounded-lg border border-[#d8dee8] bg-white px-4 py-2.5 text-[12px] font-medium text-[#344054] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isEditable ? "Cancel" : "Close"}
                </button>

                {isEditable && (
                  <button
                    type="button"
                    onClick={requestSubmit}
                    disabled={busy || loading || students.length === 0}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#172033] px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#0f1626] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserCheck size={15} />
                    Submit attendance
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <SubmitConfirmDialog
          session={session}
          presentCount={presentCount}
          absentCount={absentCount}
          totalCount={students.length}
          busy={busy}
          onCancel={() => (busy ? null : setConfirmOpen(false))}
          onConfirm={confirmSubmit}
        />
      )}
    </>
  );
}