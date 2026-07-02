// ==================================================
// SECTION: COURIERS
// РАЗДЕЛ: Курьеры
//
// Purpose (EN):
// Type definitions for live route monitoring and ETA views.
//
// Назначение (RU):
// Типы live-мониторинга маршрутов и ETA-представлений.
// ==================================================
import type { CourierLocationSource } from "@/components/couriers/courierLocationTypes";

export type LiveRouteMovementStatus = "moving" | "stopped" | "unknown";


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
export type LiveRouteDeviationStatus =
  | "on_route"
  | "slight_deviation"
  | "off_route"
  | "unknown";

export type LiveRouteMonitoringLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  capturedAt: string;
  source: CourierLocationSource;
};

export type LiveRouteCourierMonitoring = {
  courierId: string;
  courierName: string;
  currentLocation: LiveRouteMonitoringLocation | null;
  activeRouteOrderIds: string[];
  nextOrderId: string | null;
  distanceToNextKm: number | null;
  estimatedMinutesToNext: number | null;
  movementStatus: LiveRouteMovementStatus;
  routeDeviationStatus: LiveRouteDeviationStatus;
  lastLocationAgeSeconds: number | null;
  warnings: string[];
  updatedAt: string;
};

export type LiveRouteMonitoringData = {
  couriers: LiveRouteCourierMonitoring[];
  updatedAt: string;
};


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
export function getLiveRouteMovementStatusLabel(
  status: LiveRouteMovementStatus,
): string {
  switch (status) {
    case "moving":
      return "Moving";
    case "stopped":
      return "Stopped";
    case "unknown":
    default:
      return "Unknown";
  }
}

export function getLiveRouteDeviationStatusLabel(
  status: LiveRouteDeviationStatus,
): string {
  switch (status) {
    case "on_route":
      return "On route";
    case "slight_deviation":
      return "Slight deviation";
    case "off_route":
      return "Off route";
    case "unknown":
    default:
      return "Unknown";
  }
}

export function formatLiveRouteDistanceKm(distanceKm: number | null): string {
  if (distanceKm === null || !Number.isFinite(distanceKm)) {
    return "—";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}
