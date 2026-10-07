import { useEffect, useRef } from "react";
import { CheckCheck, CheckCircle2, CalendarOff, Users, UserCheck, X } from "lucide-react";
import {ConfirmLeaveDialog} from "./ConfirmLeaveDialog";
import {ConfirmSubmitDialog} from "./ConfirmSubmitDialog ";
import StatusBadge from "./StatusBadge";

export default function AttendanceDrawer({
  detail,
  absenceTypes,
  busy,
  confirmOpen,
  onClose,
  onUpdateStudent,
  onMarkAllPresent,
  onRequestSubmit,
  onCancelConfirm,
  onConfirmSubmit,
  leaveConfirmOpen,
  leaveBusy,
  leaveReason,
  onRequestLeave,
  onCancelLeaveConfirm,
  onConfirmLeave,
  onLeaveReasonChange,
}) {
  const closeButtonRef = useRef(null);

  // Normalize: support both flat shape and { session, students } shape
  const session = detail?.session ?? detail;
  const students = detail?.students ?? detail?.students ?? [];

  useEffect(() => {
    if (!session) return;
    closeButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape" && !confirmOpen && !leaveConfirmOpen) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [session, confirmOpen, leaveConfirmOpen, onClose]);

  if (!session) return null;

  const sessionStatus = String(session.sessionStatus || "PENDING").toUpperCase();
  const isEditable = sessionStatus === "PENDING";
  const isStaffLeave = sessionStatus === "STAFF_LEAVE";

  const presentCount = students.filter(
    (student) => String(student.status || "PRESENT").toUpperCase() === "PRESENT"
  ).length;

  const absentCount = students.filter(
    (student) => String(student.status || "PRESENT").toUpperCase() === "ABSENT"
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 mb-3 bg-black/60 backdrop-blur-sm pb-3"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="attendance-drawer-title"
    >
      <div
        className="absolute inset-x-0 bottom-0 mx-auto flex h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-slate-800 bg-slate-950 shadow-2xl sm:inset-y-4 sm:bottom-auto sm:h-auto sm:max-h-[calc(100vh-2rem)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Attendance session
            </span>

            <h2
              id="attendance-drawer-title"
              className="mt-1 truncate text-lg font-semibold text-slate-100"
            >
              {session.subject?.name || session.subjectName || "Attendance"}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{session.standard?.name || session.standardName || "—"}</span>
              <span>•</span>
              <span>
                Period {session.period?.periodIndex ?? session.periodIndex ?? "—"}
              </span>
              {(session.period?.startTime || session.startTime) && (
                <>
                  <span>•</span>
                  <span>
                    {session.period?.startTime || session.startTime} –{" "}
                    {session.period?.endTime || session.endTime || "—"}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close attendance drawer"
            className="ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* SESSION STATUS */}
        <div className="border-b border-slate-800 px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusBadge status={sessionStatus} />

            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span>{presentCount} present</span>
              <span>{absentCount} absent</span>
              <span>{students.length} total</span>
            </div>
          </div>

          {isEditable && students.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onMarkAllPresent}
                disabled={busy || leaveBusy}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-1.5 text-[11px] font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCheck size={13} />
                Mark all present
              </button>

              <button
                type="button"
                onClick={onRequestLeave}
                disabled={busy || leaveBusy}
                className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-1.5 text-[11px] font-medium text-purple-300 transition hover:bg-purple-500/20 hover:text-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CalendarOff size={13} />
                Mark leave
              </button>
            </div>
          )}
        </div>

        {/* BODY */}
        <div className="max-h-[calc(94vh-190px)] flex-1 overflow-y-auto">
          {!isEditable && !isStaffLeave && (
            <div className="mx-5 mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex gap-3">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Attendance is already submitted
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    This attendance session cannot be modified from the staff
                    marking page. Use the correction workflow if a correction
                    is required.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isStaffLeave && (
            <div className="mx-5 mt-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
              <div className="flex gap-3">
                <CalendarOff size={18} className="mt-0.5 shrink-0 text-purple-300" />
                <div>
                  <p className="text-sm font-medium text-purple-200">
                    Staff is on leave
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    This session was marked as staff leave. A substitute staff
                    member or an administrator must mark the attendance.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 p-5">
            {students.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                <Users size={28} className="mx-auto text-slate-600" />
                <p className="mt-2 text-sm font-medium text-slate-300">
                  No students found
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  This class currently has no students available for attendance.
                </p>
              </div>
            ) : (
              students.map((student, index) => {
                const status = String(student.status || "PRESENT").toUpperCase();
                const isAbsent = status === "ABSENT";

                const missingAbsenceType = isAbsent && !student.absenceTypeId;

                return (
                  <div
                    key={student.id}
                    className={`rounded-2xl border p-4 transition ${
                      isAbsent
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-slate-800 bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xs font-semibold text-slate-500">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-200">
                          {student.name || student.studentName || "Unnamed student"}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                          {(student.rollNo !== undefined ||
                            student.rollNumber !== undefined) && (
                            <span>
                              Roll No: {student.rollNo ?? student.rollNumber}
                            </span>
                          )}
                          {student.admissionNo && (
                            <span>Admission No: {student.admissionNo}</span>
                          )}
                        </div>
                      </div>

                      <div className="w-32 shrink-0">
                        <select
                          disabled={!isEditable}
                          value={student.status || "PRESENT"}
                          aria-label={`Attendance status for ${
                            student.name || student.studentName || "student"
                          }`}
                          onChange={(event) =>
                            onUpdateStudent(student.id, {
                              status: event.target.value,
                              ...(event.target.value === "PRESENT"
                                ? { absenceTypeId: null, remarks: "" }
                                : {}),
                            })
                          }
                          className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none transition ${
                            isAbsent
                              ? "border-red-500/20 bg-red-500/10 text-red-300"
                              : "border-slate-800 bg-slate-900 text-slate-200"
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
                          disabled={!isEditable}
                          value={student.absenceTypeId || ""}
                          aria-label="Absence type"
                          onChange={(event) =>
                            onUpdateStudent(student.id, {
                              absenceTypeId: event.target.value || null,
                            })
                          }
                          className={`w-full rounded-xl border bg-slate-900 px-3 py-2.5 text-xs text-slate-200 outline-none transition focus:border-slate-600 disabled:cursor-not-allowed disabled:opacity-50 ${
                            missingAbsenceType
                              ? "border-red-500/40"
                              : "border-slate-800"
                          }`}
                        >
                          <option value="">Select absence type *</option>
                          {absenceTypes.map((absenceType) => (
                            <option key={absenceType.id} value={absenceType.id}>
                              {absenceType.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* FOOTER */}
        {isEditable && (
          <div className="border-t border-slate-800 bg-slate-950 px-5 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-600">
                {absentCount > 0
                  ? `${absentCount} absent student${
                      absentCount === 1 ? "" : "s"
                    } require absence details.`
                  : "All students are currently marked present."}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy || leaveBusy}
                  className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={busy || leaveBusy || students.length === 0}
                  onClick={onRequestSubmit}
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserCheck size={17} />
                  {busy ? "Submitting..." : "Submit Attendance"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmOpen && (
        <ConfirmSubmitDialog
          presentCount={presentCount}
          absentCount={absentCount}
          busy={busy}
          onCancel={onCancelConfirm}
          onConfirm={onConfirmSubmit}
        />
      )}

      {leaveConfirmOpen && (
        <ConfirmLeaveDialog
          busy={leaveBusy}
          reason={leaveReason}
          onReasonChange={onLeaveReasonChange}
          onCancel={onCancelLeaveConfirm}
          onConfirm={onConfirmLeave}
        />
      )}
    </div>
  );
}