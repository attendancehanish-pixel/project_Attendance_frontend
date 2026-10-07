export function dateOnly(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value));
}

export function statusClass(value = "") {
  return String(value).toLowerCase().replaceAll("_", "-");
}

export function humanStatus(value = "") {
  return String(value).replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase());
}