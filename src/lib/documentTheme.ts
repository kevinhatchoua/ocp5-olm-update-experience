/**
 * PatternFly 6 theme classes on <html>. Tailwind `dark` is kept in sync for app shell utilities.
 * Project Felt: add `pf-v6-theme-felt` per PatternFly theming docs (replaces legacy redhat class in PF 6.5).
 * Glass mode: add `pf-v6-theme-glass` per PatternFly glass mode handbook.
 * @see https://www.patternfly.org/v6/foundations-and-styles/theming
 * @see https://www.patternfly.org/v6/foundations-and-styles/styles/theming/glass-mode-handbook
 */
export const PF_THEME_FELT_CLASS = "pf-v6-theme-felt";
export const PF_THEME_DARK_CLASS = "pf-v6-theme-dark";
export const PF_THEME_GLASS_CLASS = "pf-v6-theme-glass";

const STORAGE_KEY = "ocp5-cluster-update-experience:theme";

/** OpenShift User Preferences → Theme options. */
export type ColorTheme = "light" | "dark" | "system";

export type ThemePreferences = {
  /** Resolved preference used for class application (legacy + derived). */
  dark: boolean;
  glass: boolean;
  /** Explicit theme choice; OpenShift defaults to system when unset historically — we persist choice. */
  colorTheme: ColorTheme;
};

const DEFAULT_PREFERENCES: ThemePreferences = {
  dark: true,
  glass: true,
  colorTheme: "dark",
};

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function systemPrefersReducedTransparency(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-transparency: reduce)").matches;
}

export function resolveDark(prefs: Pick<ThemePreferences, "colorTheme" | "dark">): boolean {
  if (prefs.colorTheme === "system") return systemPrefersDark();
  if (prefs.colorTheme === "light") return false;
  if (prefs.colorTheme === "dark") return true;
  return prefs.dark;
}

/** User preference + OS accessibility: glass blur only when both allow it. */
export function isGlassEffectEnabled(prefs: ThemePreferences): boolean {
  return prefs.glass && !systemPrefersReducedTransparency();
}

export function readThemePreferences(): ThemePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as Partial<ThemePreferences> & { colorTheme?: string };
    const colorTheme: ColorTheme =
      parsed.colorTheme === "light" || parsed.colorTheme === "dark" || parsed.colorTheme === "system"
        ? parsed.colorTheme
        : typeof parsed.dark === "boolean"
          ? parsed.dark
            ? "dark"
            : "light"
          : DEFAULT_PREFERENCES.colorTheme;
    const base: ThemePreferences = {
      colorTheme,
      dark: typeof parsed.dark === "boolean" ? parsed.dark : DEFAULT_PREFERENCES.dark,
      glass: typeof parsed.glass === "boolean" ? parsed.glass : DEFAULT_PREFERENCES.glass,
    };
    return {
      ...base,
      dark: resolveDark(base),
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function writeThemePreferences(prefs: ThemePreferences): void {
  try {
    const toStore: ThemePreferences = {
      colorTheme: prefs.colorTheme,
      glass: prefs.glass,
      dark: resolveDark(prefs),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Apply PF + Tailwind classes from preferences (idempotent). */
export function applyThemeToDocument(prefs: ThemePreferences): void {
  const root = document.documentElement;
  root.classList.remove("pf-v6-theme-redhat");
  root.classList.add(PF_THEME_FELT_CLASS);

  const dark = resolveDark(prefs);
  if (dark) {
    root.classList.add("dark", PF_THEME_DARK_CLASS);
  } else {
    root.classList.remove("dark", PF_THEME_DARK_CLASS);
  }

  if (isGlassEffectEnabled(prefs)) {
    root.classList.add(PF_THEME_GLASS_CLASS);
    root.classList.remove("no-glass");
  } else {
    root.classList.remove(PF_THEME_GLASS_CLASS);
    root.classList.add("no-glass");
  }
}

/** Call once at startup (before React) so the first paint uses stored or default Dark + Glass. */
export function applyStoredOrDefaultTheme(): void {
  applyThemeToDocument(readThemePreferences());
}

/** Re-apply when OS color-scheme or reduced-transparency changes. */
export function initThemePreferenceListeners(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const reduced = window.matchMedia("(prefers-reduced-transparency: reduce)");
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => applyThemeToDocument(readThemePreferences());
  reduced.addEventListener("change", onChange);
  colorScheme.addEventListener("change", onChange);
  return () => {
    reduced.removeEventListener("change", onChange);
    colorScheme.removeEventListener("change", onChange);
  };
}

/** True when PatternFly glass theme is active (use for `Card isGlass`, etc.). */
export function isPatternFlyGlassActive(): boolean {
  const root = document.documentElement;
  return root.classList.contains(PF_THEME_GLASS_CLASS) && !root.classList.contains("no-glass");
}
