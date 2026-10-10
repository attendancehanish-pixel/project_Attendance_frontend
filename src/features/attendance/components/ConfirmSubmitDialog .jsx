import { AlertCircle, UserCheck } from "lucide-react";

export  function ConfirmSubmitDialog({ presentCount, absentCount, busy, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-submit-title"
      aria-describedby="confirm-submit-desc"
      onClick={busy ? undefined : onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400">
            <AlertCircle size={18} />
          </div>
          <div className="min-w-0">
            <h3 id="confirm-submit-title" className="text-sm font-semibold text-slate-100">
              Submit attendance?
            </h3>
            <p id="confirm-submit-desc" className="mt-1.5 text-xs leading-5 text-slate-500">
              You're marking <span className="font-medium text-slate-300">{presentCount} present</span>
              {" "}and{" "}
              <span className="font-medium text-red-300">{absentCount} absent</span>. Once
              submitted, this session cannot be edited from this page — a correction
              workflow would be required to change it later.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            autoFocus
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserCheck size={16} />
            {busy ? "Submitting..." : "Yes, submit"}
          </button>
        </div>
      </div>
    </div>
  );
}