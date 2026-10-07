import { humanStatus } from "../../../shared/utils/format";


const statusConfig = {
  PENDING: {
    label: "Pending",
    className: "border-amber-400/20 bg-amber-400/10 text-amber-400",
  },
  MARKED: {
    label: "Marked",
    className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400",
  },
  CLOSED: {
    label: "Closed",
    className: "border-slate-700 bg-slate-800/50 text-slate-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "border-red-400/30 bg-red-400/15 text-red-300",
  },
    STAFF_LEAVE: {
    label: "Staff on leave",
    className: "border-purple-400/30 bg-purple-400/15 text-purple-300",
  },
};

export default function StatusBadge({ status }) {
  const normalized = String(status || "PENDING").toUpperCase();

  const config = statusConfig[normalized] || {
    label: humanStatus(normalized),
    className: "border-slate-700 bg-slate-800/50 text-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
