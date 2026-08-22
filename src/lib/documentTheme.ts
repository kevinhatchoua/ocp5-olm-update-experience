/**
 * PatternFly 6 theming on <html>. Tailwind `dark` stays in sync for app shell utilities.
 *
 * Tiered architecture (PatternFly theming docs):
 * - Theme: Default | Project Felt (`pf-v6-theme-felt`)
 * - Color scheme: System | Light | Dark (`pf-v6-theme-dark`)
 * - Contrast mode: System | Default | High contrast | Glass
 *   (`pf-v6-theme-high-contrast` | `pf-v6-theme-glass`)
 *
 * High contrast and glass are mutually exclusive.
 *
 * @see https://www.patternfly.org/v6/foundations-and-styles/theming
 * @see https://www.patternfly.org/v6/foundations-and-styles/styles/theming/glass-mode-handbook
 * @see https://www.patternfly.org/v6/foundations-and-styles/styles/theming/high-contrast-handbook
 */
export const PF_THEME_FELT_CLASS = "pf-v6-theme-felt";
export const PF_THEME_DARK_CLASS = "pf-v6-theme-dark";
export const PF_THEME_GLASS_CLASS = "pf-v6-theme-glass";
export const PF_THEME_HIGH_CONTRAST_CLASS = "pf-v6-theme-high-contrast";

export const THEME_PREFERENCES_EVENT = "ocs-theme-preferences-change";

const STORAGE_KEY = "ocp5-cluster-update-experience:theme";

/** Brand / product theme (PatternFly Default vs Project Felt). */
export type BrandTheme = "default" | "felt";

/** Color scheme preference. */
export type ColorScheme = "system" | "light" | "dark";

/** Contrast mode preference. Glass and high-contrast are mutually exclusive when resolved. */
export type ContrastMode = "system" | "default" | "high-contrast" | "glass";

/** @deprecated Prefer ColorScheme — kept for localStorage migration. */
export type ColorTheme = ColorScheme;

export type ThemePreferences = {
  brandTheme: BrandTheme;
  colorScheme: ColorScheme;
  contrastMode: ContrastMode;
  /** Resolved dark for consumers that only need a boolean. */
  dark: boolean;
  /** Resolved glass active (after mutual exclusion + a11y). */
  glass: boolean;
  /** @deprecated Alias of colorScheme for older callers. */
  colorTheme: ColorScheme;
};

const DEFAULT_PREFERENCES: ThemePreferences = {
  brandTheme: "felt",
  colorScheme: "dark",
  contrastMode: "glass",
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

function systemPrefersMoreContrast(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(prefers-contrast: more)").matches ||
    window.matchMedia("(forced-colors: active)").matches
  );
}

export function resolveDark(prefs: Pick<ThemePreferences, "colorScheme" | "colorTheme" | "dark">): boolean {
  const scheme = prefs.colorScheme ?? prefs.colorTheme;
  if (scheme === "system") return systemPrefersDark();
  if (scheme === "light") return false;
  if (scheme === "dark") return true;
  return prefs.dark;
}

/**
 * Resolve contrast: glass vs high-contrast are exclusive.
 * System: prefer high-contrast when OS asks for more contrast / forced colors;
 * otherwise glass unless reduced transparency.
 */
export function resolveContrastMode(
  prefs: Pick<ThemePreferences, "contrastMode">,
): "default" | "high-contrast" | "glass" {
  if (prefs.contrastMode === "default") return "default";
  if (prefs.contrastMode === "high-contrast") return "high-contrast";
  if (prefs.contrastMode === "glass") {
    if (systemPrefersReducedTransparency() || systemPrefersMoreContrast()) return "default";
    return "glass";
  }
  // system
  if (systemPrefersMoreContrast()) return "high-contrast";
  if (systemPrefersReducedTransparency()) return "default";
  return "glass";
}

export function isGlassEffectEnabled(prefs: ThemePreferences): boolean {
  return resolveContrastMode(prefs) === "glass";
}

function normalizePreferences(raw: Partial<ThemePreferences> & { colorTheme?: string; glass?: boolean }): ThemePreferences {
  const brandTheme: BrandTheme = raw.brandTheme === "default" ? "default" : "felt";

  const colorScheme: ColorScheme =
    raw.colorScheme === "light" || raw.colorScheme === "dark" || raw.colorScheme === "system"
      ? raw.colorScheme
      : raw.colorTheme === "light" || raw.colorTheme === "dark" || raw.colorTheme === "system"
        ? raw.colorTheme
        : typeof raw.dark === "boolean"
          ? raw.dark
            ? "dark"
            : "light"
          : DEFAULT_PREFERENCES.colorScheme;

  let contrastMode: ContrastMode =
    raw.contrastMode === "system" ||
    raw.contrastMode === "default" ||
    raw.contrastMode === "high-contrast" ||
    raw.contrastMode === "glass"
      ? raw.contrastMode
      : typeof raw.glass === "boolean"
        ? raw.glass
          ? "glass"
          : "default"
        : DEFAULT_PREFERENCES.contrastMode;

  const base: ThemePreferences = {
    brandTheme,
    colorScheme,
    contrastMode,
    colorTheme: colorScheme,
    dark: false,
    glass: false,
  };
  const dark = resolveDark(base);
  const resolvedContrast = resolveContrastMode(base);
  return {
    ...base,
    dark,
    glass: resolvedContrast === "glass",
  };
}

export function readThemePreferences(): ThemePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return normalizePreferences(JSON.parse(raw) as Partial<ThemePreferences>);
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function writeThemePreferences(prefs: ThemePreferences): void {
  const normalized = normalizePreferences(prefs);
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        brandTheme: normalized.brandTheme,
        colorScheme: normalized.colorScheme,
        contrastMode: normalized.contrastMode,
        colorTheme: normalized.colorScheme,
        dark: normalized.dark,
        glass: normalized.glass,
      }),
    );
  } catch {
    /* ignore quota / private mode */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(THEME_PREFERENCES_EVENT, { detail: normalized }));
  }
}

/** Apply PF + Tailwind classes from preferences (idempotent). */
export function applyThemeToDocument(prefs: ThemePreferences): void {
  const root = document.documentElement;
  const normalized = normalizePreferences(prefs);
  root.classList.remove("pf-v6-theme-redhat");

  if (normalized.brandTheme === "felt") {
    root.classList.add(PF_THEME_FELT_CLASS);
  } else {
    root.classList.remove(PF_THEME_FELT_CLASS);
  }

  if (normalized.dark) {
    root.classList.add("dark", PF_THEME_DARK_CLASS);
  } else {
    root.classList.remove("dark", PF_THEME_DARK_CLASS);
  }

  const contrast = resolveContrastMode(normalized);
  root.classList.remove(PF_THEME_GLASS_CLASS, PF_THEME_HIGH_CONTRAST_CLASS, "high-contrast", "high-contrast-dark", "no-glass");

  if (contrast === "glass") {
    root.classList.add(PF_THEME_GLASS_CLASS);
  } else if (contrast === "high-contrast") {
    root.classList.add(PF_THEME_HIGH_CONTRAST_CLASS);
    root.classList.add(normalized.dark ? "high-contrast-dark" : "high-contrast");
    root.classList.add("no-glass");
  } else {
    root.classList.add("no-glass");
  }
}

/** Persist + apply + notify listeners (Prototype controls / User Preferences). */
export function setThemePreferences(partial: Partial<ThemePreferences>): ThemePreferences {
  const next = normalizePreferences({ ...readThemePreferences(), ...partial });
  writeThemePreferences(next);
  applyThemeToDocument(next);
  return next;
}

/** Call once at startup (before React) so the first paint uses stored or default prefs. */
export function applyStoredOrDefaultTheme(): void {
  applyThemeToDocument(readThemePreferences());
}

/** Re-apply when OS color-scheme or a11y contrast / transparency changes. */
export function initThemePreferenceListeners(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const reduced = window.matchMedia("(prefers-reduced-transparency: reduce)");
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const contrastMore = window.matchMedia("(prefers-contrast: more)");
  const forcedColors = window.matchMedia("(forced-colors: active)");
  const onChange = () => applyThemeToDocument(readThemePreferences());
  reduced.addEventListener("change", onChange);
  colorScheme.addEventListener("change", onChange);
  contrastMore.addEventListener("change", onChange);
  forcedColors.addEventListener("change", onChange);
  return () => {
    reduced.removeEventListener("change", onChange);
    colorScheme.removeEventListener("change", onChange);
    contrastMore.removeEventListener("change", onChange);
    forcedColors.removeEventListener("change", onChange);
  };
}

/** True when PatternFly glass theme is active (use for `Card isGlass`, etc.). */
export function isPatternFlyGlassActive(): boolean {
  const root = document.documentElement;
  return root.classList.contains(PF_THEME_GLASS_CLASS) && !root.classList.contains("no-glass");
}
