// Theme presets. The CSS for each lives in ./theme.css, keyed by these ids:
//   <html data-mode="light|dark" data-accent="<accent id>">

export const MODES = [
  { id: "light", label: "Light", description: "Bright, high-contrast surfaces" },
  { id: "dark", label: "Dark", description: "Easier on the eyes in low light" },
  { id: "system", label: "System", description: "Match your device setting" },
];

// `swatch` is only used for the picker dots in Settings.
export const ACCENTS = [
  { id: "slate", label: "Slate", swatch: "#475569" },
  { id: "blue", label: "Blue", swatch: "#2563eb" },
  { id: "indigo", label: "Indigo", swatch: "#4f46e5" },
  { id: "violet", label: "Violet", swatch: "#7c3aed" },
  { id: "emerald", label: "Emerald", swatch: "#059669" },
  { id: "rose", label: "Rose", swatch: "#e11d48" },
  { id: "amber", label: "Amber", swatch: "#d97706" },
];

export const MODE_IDS = MODES.map((m) => m.id);
export const ACCENT_IDS = ACCENTS.map((a) => a.id);

// What a user sees before they pick anything. Matches how the app looked
// before themes existed: admin portal = light, staff portal = dark.
export function defaultThemeFor(isAdmin) {
  return { mode: isAdmin ? "light" : "dark", accent: "slate" };
}
