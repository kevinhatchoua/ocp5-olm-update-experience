import { useEffect, useState } from "react";
import { Content, ToggleGroup, ToggleGroupItem } from "@patternfly/react-core";
import {
  THEME_PREFERENCES_EVENT,
  readThemePreferences,
  setThemePreferences,
  type BrandTheme,
  type ColorScheme,
  type ContrastMode,
  type ThemePreferences,
} from "@/lib/documentTheme";

/**
 * PatternFly 6 theme switcher — Theme / Color scheme / Contrast mode.
 * Shared by Prototype controls and User Preferences.
 */
export default function PatternFlyThemeControls({ idPrefix = "theme" }: { idPrefix?: string }) {
  const [prefs, setPrefs] = useState<ThemePreferences>(() => readThemePreferences());

  useEffect(() => {
    const sync = () => setPrefs(readThemePreferences());
    const onCustom = (ev: Event) => {
      const detail = (ev as CustomEvent<ThemePreferences>).detail;
      if (detail) setPrefs(detail);
      else sync();
    };
    window.addEventListener(THEME_PREFERENCES_EVENT, onCustom as EventListener);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(THEME_PREFERENCES_EVENT, onCustom as EventListener);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = (partial: Partial<ThemePreferences>) => {
    setPrefs(setThemePreferences(partial));
  };

  return (
    <div className="ocs-pf-theme-controls">
      <div className="ocs-pf-theme-controls__section">
        <Content component="p" className="ocs-pf-theme-controls__label" id={`${idPrefix}-brand`}>
          Theme
        </Content>
        <ToggleGroup aria-labelledby={`${idPrefix}-brand`} isCompact>
          {(
            [
              ["default", "Default"],
              ["felt", "Project Felt"],
            ] as [BrandTheme, string][]
          ).map(([id, label]) => (
            <ToggleGroupItem
              key={id}
              text={label}
              isSelected={prefs.brandTheme === id}
              onChange={() => update({ brandTheme: id })}
            />
          ))}
        </ToggleGroup>
      </div>

      <div className="ocs-pf-theme-controls__section">
        <Content component="p" className="ocs-pf-theme-controls__label" id={`${idPrefix}-color`}>
          Color scheme
        </Content>
        <ToggleGroup aria-labelledby={`${idPrefix}-color`} isCompact>
          {(
            [
              ["system", "System"],
              ["light", "Light"],
              ["dark", "Dark"],
            ] as [ColorScheme, string][]
          ).map(([id, label]) => (
            <ToggleGroupItem
              key={id}
              text={label}
              isSelected={prefs.colorScheme === id}
              onChange={() => update({ colorScheme: id })}
            />
          ))}
        </ToggleGroup>
      </div>

      <div className="ocs-pf-theme-controls__section">
        <Content component="p" className="ocs-pf-theme-controls__label" id={`${idPrefix}-contrast`}>
          Contrast mode
        </Content>
        <ToggleGroup aria-labelledby={`${idPrefix}-contrast`} isCompact>
          {(
            [
              ["system", "System"],
              ["default", "Default"],
              ["high-contrast", "High contrast"],
              ["glass", "Glass"],
            ] as [ContrastMode, string][]
          ).map(([id, label]) => (
            <ToggleGroupItem
              key={id}
              text={label}
              isSelected={prefs.contrastMode === id}
              onChange={() => update({ contrastMode: id })}
            />
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
