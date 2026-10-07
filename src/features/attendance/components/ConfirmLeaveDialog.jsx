import { CalendarOff } from "lucide-react";

export  function ConfirmLeaveDialog({
  busy,
  reason,
  onReasonChange,
  onCancel,
  onConfirm,
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-leave-title"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-400/10 text-purple-300">
            <CalendarOff size={18} />
          </div>
          <div className="min-w-0">
            <h3
              id="confirm-leave-title"
              className="text-sm font-semibold text-slate-100"
            >
              Mark as staff leave?
            </h3>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              This session will be marked{" "}
              <span className="font-medium text-purple-300">STAFF_LEAVE</span>.
              Attendance will need to be marked by the substitute staff or an
              admin.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="leave-reason"
            className="block text-[11px] font-medium text-slate-400"
          >
            Reason (optional)
          </label>
          <textarea
            id="leave-reason"
            rows={2}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            disabled={busy}
            placeholder="e.g. Sick leave, personal emergency…"
            className="mt-1.5 w-full resize-none rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-slate-600 disabled:opacity-50"
          />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:opacity-50"
          >
            <CalendarOff size={16} />
            {busy ? "Marking..." : "Yes, mark leave"}
          </button>
        </div>
      </div>
    </div>
  );
}