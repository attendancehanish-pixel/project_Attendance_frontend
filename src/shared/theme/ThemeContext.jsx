import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../context/AuthContext";
import { ACCENT_IDS, MODE_IDS, defaultThemeFor } from "./themes";

/*
| Theme = { mode: "light" | "dark" | "system", accent: <accent id> }
|
| Stored in localStorage (this browser only – there is no backend field for it):
|   ca-theme:user:<userId>  the signed-in user's choice
|   ca-theme:last           mirror of whatever is applied; used for the login
|                           page and by the inline script in index.html so the
|                           first paint already has the right colours.
*/

const LAST_KEY = "ca-theme:last";
const userKey = (id) => `ca-theme:user:${id}`;

function sanitize(value) {
  if (!value || !MODE_IDS.includes(value.mode) || !ACCENT_IDS.includes(value.accent)) {
    return null;
  }
  return { mode: value.mode, accent: value.accent };
}

function readTheme(key) {
  try {
    return sanitize(JSON.parse(localStorage.getItem(key)));
  } catch {
    return null;
  }
}

function writeTheme(key, theme) {
  try {
    localStorage.setItem(key, JSON.stringify(theme));
  } catch {
    /* private mode / quota – theme still works for this session */
  }
}

const prefersDark = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches);

export const resolveMode = (mode) =>
  mode === "system" ? (prefersDark() ? "dark" : "light") : mode;

function applyTheme(theme) {
  const root = document.documentElement;
  const mode = resolveMode(theme.mode);
  root.dataset.mode = mode;
  root.dataset.accent = theme.accent;
  root.style.colorScheme = mode;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", mode === "dark" ? "#020617" : "#111827");
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user, isAdmin } = useAuth();
  const userId = user?.id ?? null;

  const roleDefault = useMemo(() => defaultThemeFor(isAdmin), [isAdmin]);
  const [theme, setTheme] = useState(
    () => readTheme(LAST_KEY) ?? defaultThemeFor(true)
  );

  // When a user signs in (or the session restores) load THEIR saved theme.
  // While signed out we keep whatever is applied (login page).
  useEffect(() => {
    if (!userId) return;
    setTheme(readTheme(userKey(userId)) ?? roleDefault);
  }, [userId, roleDefault]);

  // Apply to <html>, mirror to ca-theme:last, follow the OS when "system".
  useEffect(() => {
    applyTheme(theme);
    writeTheme(LAST_KEY, theme);

    if (theme.mode !== "system") return undefined;
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!query) return undefined;
    const onChange = () => applyTheme(theme);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [theme]);

  // Keep other open tabs in sync.
  useEffect(() => {
    if (!userId) return undefined;
    function onStorage(event) {
      if (event.key !== userKey(userId)) return;
      setTheme(sanitize(safeParse(event.newValue)) ?? roleDefault);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [userId, roleDefault]);

  const update = useCallback(
    (patch) => {
      const next = { ...theme, ...patch };
      setTheme(next);
      if (userId) writeTheme(userKey(userId), next);
    },
    [theme, userId]
  );

  const reset = useCallback(() => {
    setTheme(roleDefault);
    if (userId) {
      try {
        localStorage.removeItem(userKey(userId));
      } catch {
        /* ignore */
      }
    }
  }, [roleDefault, userId]);

  const value = useMemo(
    () => ({
      mode: theme.mode,
      accent: theme.accent,
      setMode: (mode) => update({ mode }),
      setAccent: (accent) => update({ accent }),
      reset,
      isDefault:
        theme.mode === roleDefault.mode && theme.accent === roleDefault.accent,
    }),
    [theme, roleDefault, update, reset]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
