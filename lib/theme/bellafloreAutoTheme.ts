export type BellaFloreTheme = "day" | "night" | "dark-luxury";

export const THEME_STORAGE_KEY = "bellaflore-ui-theme";
export const THEME_MANUAL_OVERRIDE_KEY = "bellaflore-ui-theme-manual";

const MOSCOW_TIMEZONE = "Europe/Moscow";
const DAY_START_HOUR = 7;
const NIGHT_START_HOUR = 20;

export function getMoscowHour(date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: MOSCOW_TIMEZONE,
    }).format(date),
  );
}

export function resolveAutoTheme(date = new Date()): BellaFloreTheme {
  const hour = getMoscowHour(date);
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? "day" : "night";
}

export function readManualThemeOverride(): BellaFloreTheme | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(THEME_MANUAL_OVERRIDE_KEY);
  if (stored === "day" || stored === "night") {
    return stored;
  }

  return null;
}

export function resolveActiveTheme(date = new Date()): BellaFloreTheme {
  return readManualThemeOverride() ?? resolveAutoTheme(date);
}

export function applyDocumentTheme(theme: BellaFloreTheme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function setManualThemeOverride(theme: BellaFloreTheme) {
  window.localStorage.setItem(THEME_MANUAL_OVERRIDE_KEY, theme);
  applyDocumentTheme(theme);
}

export function clearManualThemeOverride() {
  window.localStorage.removeItem(THEME_MANUAL_OVERRIDE_KEY);
  applyDocumentTheme(resolveAutoTheme());
}
