// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
const CITY_AVERAGE_SPEED_KMH = 25;
const MIN_ETA_MINUTES = 10;
const ETA_ROUND_MINUTES = 5;

export function estimateTravelMinutes(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    return MIN_ETA_MINUTES;
  }

  const rawMinutes = (distanceKm / CITY_AVERAGE_SPEED_KMH) * 60;
  const withMinimum = Math.max(MIN_ETA_MINUTES, rawMinutes);

  return Math.round(withMinimum / ETA_ROUND_MINUTES) * ETA_ROUND_MINUTES;
}

export function formatEstimatedMinutes(minutes: number | null): string {
  if (minutes === null) {
    return "—";
  }

  return `${minutes} min`;
}
