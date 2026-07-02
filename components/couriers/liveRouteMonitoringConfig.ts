// ==================================================
// SECTION: COURIERS
// РАЗДЕЛ: Курьеры
//
// Purpose (EN):
// Configuration constants for live route monitoring panels.
//
// Назначение (RU):
// Константы конфигурации панелей live-мониторинга маршрутов.
// ==================================================
export const LIVE_ROUTE_MONITORING_CONFIG = {
  stoppedSpeedKmh: 3,
  stoppedAfterSeconds: 180,
  slightDeviationMeters: 300,
  offRouteMeters: 800,
  staleLocationSeconds: 300,
} as const;
