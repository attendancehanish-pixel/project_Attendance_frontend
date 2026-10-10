import { Check, X } from "lucide-react";

/*
| Present / Absent toggle – replaces the old <select>.
|
|   value     "PRESENT" | "ABSENT"   (anything else is treated as PRESENT,
|                                    matching the old `status || "PRESENT"`)
|   onChange  (nextValue) => void    called with "PRESENT" or "ABSENT"
|   label     student name, used for the accessible name
|
| One tap flips the state. It is a real <button role="switch">, so Space/Enter
| work from the keyboard and screen readers announce "Present"/"Absent".
| The knob shows ✓ / ✕ so the state is not conveyed by colour alone.
*/
export default function StatusToggle({
  value,
  onChange,
  disabled = false,
  label = "student",
}) {
  const isPresent = String(value || "PRESENT").toUpperCase() !== "ABSENT";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isPresent}
      aria-label={`Attendance for ${label}: ${isPresent ? "Present" : "Absent"}. Tap to change.`}
      disabled={disabled}
      onClick={() => onChange(isPresent ? "ABSENT" : "PRESENT")}
      className={`relative h-10 w-32 shrink-0 select-none rounded-full border text-xs font-semibold transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 disabled:cursor-not-allowed disabled:opacity-50 ${
        isPresent
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
          : "border-red-500/30 bg-red-500/15 text-red-300"
      }`}
    >
      {/* Label sits on the side opposite the knob */}
      <span
        className={`absolute inset-y-0 flex items-center transition-all duration-200 ${
          isPresent ? "left-4" : "right-4"
        }`}
      >
        {isPresent ? "Present" : "Absent"}
      </span>

      {/* Knob */}
      <span
        aria-hidden="true"
        className={`absolute top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full shadow-sm transition-[left,background-color] duration-200 ${
          isPresent
            ? "bg-emerald-400 text-emerald-950"
            : "bg-red-400 text-red-950"
        }`}
        style={{ left: isPresent ? "calc(100% - 2.125rem)" : "0.125rem" }}
      >
        {isPresent ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
      </span>
    </button>
  );
}
