// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
export type TrafficDelayLevel = "none" | "low" | "medium" | "high";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function calculateTrafficDelay(
  durationSeconds: number | null | undefined,
  durationWithTrafficSeconds: number | null | undefined,
): number | null {
  if (
    durationSeconds === null ||
    durationSeconds === undefined ||
    durationWithTrafficSeconds === null ||
    durationWithTrafficSeconds === undefined
  ) {
    return null;
  }

  return Math.max(0, durationWithTrafficSeconds - durationSeconds);
}

export function calculateAverageSpeedKmh(
  distanceMeters: number | null | undefined,
  durationSeconds: number | null | undefined,
): number | null {
  if (
    distanceMeters === null ||
    distanceMeters === undefined ||
    durationSeconds === null ||
    durationSeconds === undefined ||
    durationSeconds <= 0
  ) {
    return null;
  }

  const distanceKm = distanceMeters / 1000;
  const durationHours = durationSeconds / 3600;

  return distanceKm / durationHours;
}

export function getTrafficDelayLevel(
  delaySeconds: number | null | undefined,
  baseDurationSeconds: number | null | undefined,
): TrafficDelayLevel {
  if (delaySeconds === null || delaySeconds === undefined || delaySeconds <= 0) {
    return "none";
  }

  const delayMinutes = delaySeconds / 60;
  const delayPercent =
    baseDurationSeconds && baseDurationSeconds > 0
      ? (delaySeconds / baseDurationSeconds) * 100
      : 0;

  if (delayMinutes >= 15 || delayPercent >= 20) {
    return "high";
  }

  if (delayMinutes >= 8 || delayPercent >= 12) {
    return "medium";
  }

  if (delayMinutes >= 3 || delayPercent >= 5) {
    return "low";
  }

  return "none";
}

export function formatProviderEta(
  durationSeconds: number | null | undefined,
): string {
  if (durationSeconds === null || durationSeconds === undefined) {
    return "—";
  }

  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));
  return `${totalMinutes} min`;
}

export function formatAverageSpeedKmh(
  averageSpeedKmh: number | null | undefined,
): string {
  if (averageSpeedKmh === null || averageSpeedKmh === undefined) {
    return "—";
  }

  return `${averageSpeedKmh.toFixed(1)} km/h`;
}

export function formatTrafficDelaySeconds(
  delaySeconds: number | null | undefined,
): string {
  if (delaySeconds === null || delaySeconds === undefined) {
    return "—";
  }

  if (delaySeconds < 60) {
    return `${Math.round(delaySeconds)} sec`;
  }

  return formatProviderEta(delaySeconds);
}

export function getTrafficDelayLevelLabel(level: TrafficDelayLevel): string {
  switch (level) {
    case "none":
      return "None";
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    default:
      return level;
  }
}

export function isTrafficDelayOverFifteenMinutes(
  delaySeconds: number | null | undefined,
): boolean {
  return delaySeconds !== null && delaySeconds !== undefined && delaySeconds >= 900;
}

export function isTrafficDelayOverTwentyPercent(
  delaySeconds: number | null | undefined,
  baseDurationSeconds: number | null | undefined,
): boolean {
  if (
    delaySeconds === null ||
    delaySeconds === undefined ||
    baseDurationSeconds === null ||
    baseDurationSeconds === undefined ||
    baseDurationSeconds <= 0
  ) {
    return false;
  }

  return delaySeconds / baseDurationSeconds >= 0.2;
}
