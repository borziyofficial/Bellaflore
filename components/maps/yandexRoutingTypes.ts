// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for maps.
//
// Назначение (RU): Определения типов для maps.
// ==================================================
import type { TrafficDelayLevel } from "@/components/maps/providerEta";

export type YandexRouteStatus = "ready" | "incomplete" | "error" | "fallback";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type YandexRouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type YandexCourierRoute = {
  courierId: string;
  courierName: string;
  color: string;
  orderIds: string[];
  requestPoints: YandexRouteCoordinate[];
  routeCoordinates: YandexRouteCoordinate[];
  distanceMeters: number | null;
  durationSeconds: number | null;
  providerDistanceMeters: number | null;
  providerDurationSeconds: number | null;
  providerDurationWithTrafficSeconds: number | null;
  averageSpeedKmh: number | null;
  trafficDelaySeconds: number | null;
  trafficDelayLevel: TrafficDelayLevel;
  providerUpdatedAt: string | null;
  status: YandexRouteStatus;
  errorMessage?: string;
  updatedAt: string;
  fromCache?: boolean;
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getYandexRouteStatusLabel(status: YandexRouteStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "incomplete":
      return "Incomplete";
    case "fallback":
      return "Fallback";
    case "error":
      return "Error";
    default:
      return status;
  }
}

export function formatRouteDistanceMeters(distanceMeters: number | null): string {
  if (distanceMeters === null) {
    return "—";
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

export function formatRouteDurationSeconds(
  durationSeconds: number | null,
): string {
  if (durationSeconds === null) {
    return "—";
  }

  const totalMinutes = Math.max(1, Math.round(durationSeconds / 60));
  return `${totalMinutes} min`;
}
