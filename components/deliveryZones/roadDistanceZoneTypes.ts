// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for deliveryZones.
//
// Назначение (RU): Определения типов для deliveryZones.
// ==================================================
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

export type RoadDistanceStatus =
  | "ready"
  | "unavailable"
  | "missing_coordinates"
  | "provider_error"
  | "fallback_to_approx";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type RoadDistanceProvider = "yandex" | "fallback";

export type RoadDistanceZoneResult = {
  fromBoundaryPoint: GeoCoordinate;
  toCustomerPoint: GeoCoordinate;
  roadDistanceKm: number | null;
  roadDurationMinutes: number | null;
  provider: RoadDistanceProvider;
  status: RoadDistanceStatus;
  errorMessage?: string;
  calculatedAt: string;
};

export type CalculateYandexRoadDistanceParams = {
  fromBoundaryPoint: GeoCoordinate;
  toCustomerPoint: GeoCoordinate;
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getRoadDistanceStatusLabel(status: RoadDistanceStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "unavailable":
      return "Unavailable";
    case "missing_coordinates":
      return "Missing coordinates";
    case "provider_error":
      return "Provider error";
    case "fallback_to_approx":
    default:
      return "Approximate fallback";
  }
}

export function formatRoadDurationMinutes(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) {
    return "—";
  }

  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return remainingMinutes > 0 ? `${hours} h ${remainingMinutes} min` : `${hours} h`;
}
