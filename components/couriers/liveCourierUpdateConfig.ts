// ==================================================
// SECTION: COURIERS
// РАЗДЕЛ: Курьеры
//
// Purpose (EN):
// Polling interval and refresh configuration for live courier updates.
//
// Назначение (RU):
// Интервалы опроса и конфигурация обновления live-позиций курьеров.
// ==================================================
export const LIVE_COURIER_UPDATE_CONFIG = {
  defaultRefreshMs: 30000,
  minRefreshMs: 15000,
  maxRefreshMs: 60000,
  staleAfterMs: 60000,
  offlineAfterMs: 300000,
} as const;

export const LIVE_COURIER_REFRESH_INTERVAL_OPTIONS = [
  { label: "15 sec", value: 15000 },
  { label: "30 sec", value: 30000 },
  { label: "60 sec", value: 60000 },
] as const;


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN):
// Exported type and interface definitions.
//
// Назначение (RU):
// Экспортируемые типы и интерфейсы.
// ==================================================
export type LiveCourierRefreshIntervalMs =
  (typeof LIVE_COURIER_REFRESH_INTERVAL_OPTIONS)[number]["value"];


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export function isLiveCourierRefreshIntervalMs(
  value: number,
): value is LiveCourierRefreshIntervalMs {
  return LIVE_COURIER_REFRESH_INTERVAL_OPTIONS.some(
    (option) => option.value === value,
  );
}

export function clampLiveCourierRefreshIntervalMs(
  value: number,
): LiveCourierRefreshIntervalMs {
  if (value <= LIVE_COURIER_UPDATE_CONFIG.minRefreshMs) {
    return LIVE_COURIER_UPDATE_CONFIG.minRefreshMs;
  }

  if (value >= LIVE_COURIER_UPDATE_CONFIG.maxRefreshMs) {
    return LIVE_COURIER_UPDATE_CONFIG.maxRefreshMs;
  }

  return LIVE_COURIER_UPDATE_CONFIG.defaultRefreshMs;
}
