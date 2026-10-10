import { useState } from "react";
import { Check, Monitor, Moon, Palette, RotateCcw, Sun } from "lucide-react";
import SettingsCard from "./SettingsCard";
import StatusToggle from "../../../shared/components/StatusToggle";
import { useTheme } from "../../../shared/theme/ThemeContext";
import { ACCENTS, MODES } from "../../../shared/theme/themes";

const MODE_ICONS = { light: Sun, dark: Moon, system: Monitor };

// NOTE: the radio inputs are hidden with inline styles on purpose – the global
// `input { width:100%; padding… }` rule in styles.css would otherwise beat the
// `sr-only` utility and show a stretched native radio.
const HIDDEN_INPUT = {
  position: "absolute",
  opacity: 0,
  width: 1,
  height: 1,
  margin: 0,
  padding: 0,
  border: 0,
  pointerEvents: "none",
};

/* Tiny fixed-colour thumbnails so each option previews its own look. */
const PALETTES = {
  light: { page: "#f5f7fb", card: "#ffffff", line: "#e8ebf1", bar: "#d0d5dd" },
  dark: { page: "#020617", card: "#0f172a", line: "#1e293b", bar: "#334155" },
};

function ThumbPane({ palette }) {
  return (
    <div className="h-full w-full p-2" style={{ background: palette.page }}>
      <div
        className="h-full rounded-md border p-1.5"
        style={{ background: palette.card, borderColor: palette.line }}
      >
        <div className="h-1.5 w-8 rounded-full" style={{ background: palette.bar }} />
        <div
          className="mt-1 h-1.5 w-5 rounded-full opacity-60"
          style={{ background: palette.bar }}
        />
      </div>
    </div>
  );
}

function ModeThumb({ mode }) {
  return (
    <div className="h-16 overflow-hidden rounded-lg border border-ui-line">
      {mode === "system" ? (
        <div className="grid h-full grid-cols-2">
          <ThumbPane palette={PALETTES.light} />
          <ThumbPane palette={PALETTES.dark} />
        </div>
      ) : (
        <ThumbPane palette={PALETTES[mode]} />
      )}
    </div>
  );
}

export default function AppearanceCard() {
  const { mode, accent, setMode, setAccent, reset, isDefault } = useTheme();
  const [previewStatus, setPreviewStatus] = useState("PRESENT");

  return (
    <SettingsCard
      icon={Palette}
      title="Appearance"
      description="Choose how the portal looks. This is saved in this browser for your account."
    >
      {/* ---------------- MODE ---------------- */}
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-ui-ink-2">Theme</legend>
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {MODES.map((option) => {
            const Icon = MODE_ICONS[option.id];
            const checked = mode === option.id;
            return (
              <label key={option.id} className="relative block cursor-pointer">
                <input
                  type="radio"
                  name="theme-mode"
                  value={option.id}
                  checked={checked}
                  onChange={() => setMode(option.id)}
                  className="peer"
                  style={HIDDEN_INPUT}
                />
                <div className="rounded-xl border border-ui-line bg-ui-surface-2 p-2 transition hover:border-ui-line-hover peer-checked:border-accent-border peer-checked:ring-2 peer-checked:ring-accent-border/30 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-border">
                  <ModeThumb mode={option.id} />
                  <div className="mt-2 flex items-center justify-between gap-1 px-0.5">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-ui-ink">
                      <Icon size={14} className="text-ui-muted" />
                      {option.label}
                    </span>
                    {checked && <Check size={14} className="text-accent-text" />}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* ---------------- ACCENT ---------------- */}
      <fieldset className="mt-6">
        <legend className="mb-2 text-sm font-medium text-ui-ink-2">Accent colour</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-3">
          {ACCENTS.map((option) => {
            const checked = accent === option.id;
            return (
              <label
                key={option.id}
                className="relative flex w-14 cursor-pointer flex-col items-center gap-1.5"
              >
                <input
                  type="radio"
                  name="theme-accent"
                  value={option.id}
                  checked={checked}
                  onChange={() => setAccent(option.id)}
                  className="peer"
                  style={HIDDEN_INPUT}
                />
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full ring-offset-2 ring-offset-ui-surface transition peer-checked:ring-2 peer-focus-visible:ring-2"
                  style={{ backgroundColor: option.swatch, "--tw-ring-color": option.swatch }}
                >
                  {checked && <Check size={18} strokeWidth={3} color="#ffffff" />}
                </span>
                <span
                  className={`text-xs ${
                    checked ? "font-semibold text-ui-ink" : "text-ui-muted"
                  }`}
                >
                  {option.label}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* ---------------- PREVIEW ---------------- */}
      <div className="mt-6 rounded-xl border border-ui-line bg-ui-surface-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-ui-faint">
          Preview
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            Primary
          </button>
          <button
            type="button"
            className="rounded-lg border border-ui-line-strong bg-ui-surface px-4 py-2 text-sm font-medium text-ui-ink-2 transition hover:border-ui-line-hover"
          >
            Secondary
          </button>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-text">
            Accent badge
          </span>
          <StatusToggle
            value={previewStatus}
            onChange={setPreviewStatus}
            label="preview student"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={reset}
          disabled={isDefault}
          className="inline-flex items-center gap-2 rounded-lg border border-ui-line-strong bg-ui-surface px-3.5 py-2 text-sm font-medium text-ui-ink-2 transition hover:border-ui-line-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw size={14} />
          Reset to default
        </button>
      </div>
    </SettingsCard>
  );
}
