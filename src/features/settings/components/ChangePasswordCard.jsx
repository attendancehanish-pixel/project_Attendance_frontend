import { useMemo, useRef, useState } from "react";
import { AlertCircle, Check, Circle, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import SettingsCard from "./SettingsCard";
import { useAuth } from "../../../shared/context/AuthContext";

const MIN_LENGTH = 8; // backend rule: POST /auth/change-password

const STRENGTH = [
  { label: "Too short", bar: "bg-ui-err-dot" },
  { label: "Weak", bar: "bg-ui-err-dot" },
  { label: "Fair", bar: "bg-ui-warn-dot" },
  { label: "Good", bar: "bg-ui-ok-dot" },
  { label: "Strong", bar: "bg-ui-ok-dot" },
];

function scorePassword(password) {
  if (password.length < MIN_LENGTH) return 0;
  let score = 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  inputRef,
  invalid,
  describedBy,
  show,
  onToggleShow,
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ui-ink-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          required
          // Inline on purpose: global `input {…}` rules outrank Tailwind utilities.
          style={{ fontSize: 14, padding: "11px 44px 11px 12px", borderRadius: 10 }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[10px] text-ui-muted transition hover:text-ui-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-border"
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function Requirement({ met, children }) {
  return (
    <li className={`flex items-center gap-2 text-xs ${met ? "text-ui-ok-text" : "text-ui-muted"}`}>
      {met ? <Check size={13} strokeWidth={3} /> : <Circle size={13} />}
      <span>{children}</span>
    </li>
  );
}

export default function ChangePasswordCard() {
  const { user, changePassword, endSession } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [currentError, setCurrentError] = useState("");
  const currentRef = useRef(null);

  const checks = useMemo(
    () => ({
      length: next.length >= MIN_LENGTH,
      different: next.length > 0 && current.length > 0 && next !== current,
      match: confirm.length > 0 && next === confirm,
    }),
    [current, next, confirm]
  );

  const canSubmit =
    current.length > 0 && checks.length && checks.different && checks.match && !busy;

  const strength = scorePassword(next);
  const toggle = (field) => setShow((s) => ({ ...s, [field]: !s[field] }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setBusy(true);
    setError("");
    setCurrentError("");

    try {
      await changePassword(current, next);

      // The backend revoked all refresh tokens. Leave a one-time notice for
      // the login screen and drop the local session (ProtectedRoute → /login).
      try {
        sessionStorage.setItem("ca-notice", "password-changed");
      } catch {
        /* notice is optional */
      }
      endSession();
    } catch (err) {
      if (err?.status === 400 && /current password/i.test(err.message || "")) {
        setCurrentError("That isn't your current password. Please try again.");
        setCurrent("");
        currentRef.current?.focus();
      } else if (err?.status === undefined) {
        setError("Couldn't reach the server. Check your connection and try again.");
      } else {
        setError(err.message || "Couldn't change your password. Please try again.");
      }
      setBusy(false);
    }
  }

  return (
    <SettingsCard
      icon={KeyRound}
      title="Change password"
      description="Use at least 8 characters. You'll be signed out afterwards and asked to sign in with the new password."
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Helps password managers attach the new password to the right account */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          value={user?.email || ""}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: "absolute", opacity: 0, width: 0, height: 0, padding: 0, border: 0, pointerEvents: "none" }}
        />

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-ui-err-line bg-ui-err-bg px-3 py-2.5 text-sm text-ui-err-text"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <PasswordField
            id="cp-current"
            label="Current password"
            value={current}
            onChange={(value) => {
              setCurrent(value);
              if (currentError) setCurrentError("");
            }}
            autoComplete="current-password"
            inputRef={currentRef}
            invalid={Boolean(currentError)}
            describedBy={currentError ? "cp-current-error" : undefined}
            show={show.current}
            onToggleShow={() => toggle("current")}
          />
          {currentError && (
            <p id="cp-current-error" role="alert" className="mt-1.5 text-xs text-ui-err-text">
              {currentError}
            </p>
          )}
        </div>

        <div>
          <PasswordField
            id="cp-new"
            label="New password"
            value={next}
            onChange={setNext}
            autoComplete="new-password"
            describedBy="cp-requirements"
            show={show.next}
            onToggleShow={() => toggle("next")}
          />
          {next.length > 0 && (
            <div className="mt-2 flex items-center gap-2" aria-live="polite">
              <div className="flex flex-1 gap-1" aria-hidden="true">
                {[1, 2, 3, 4].map((step) => (
                  <span
                    key={step}
                    className={`h-1 flex-1 rounded-full ${
                      strength >= step ? STRENGTH[strength].bar : "bg-ui-chip"
                    }`}
                  />
                ))}
              </div>
              <span className="w-16 text-right text-xs text-ui-muted">
                {STRENGTH[strength].label}
              </span>
            </div>
          )}
        </div>

        <PasswordField
          id="cp-confirm"
          label="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          invalid={confirm.length > 0 && !checks.match}
          describedBy="cp-requirements"
          show={show.confirm}
          onToggleShow={() => toggle("confirm")}
        />

        <ul id="cp-requirements" className="space-y-1.5 rounded-xl bg-ui-surface-2 px-3.5 py-3">
          <Requirement met={checks.length}>At least {MIN_LENGTH} characters</Requirement>
          <Requirement met={checks.different}>Different from your current password</Requirement>
          <Requirement met={checks.match}>Matches the confirmation</Requirement>
        </ul>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {busy ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </SettingsCard>
  );
}
