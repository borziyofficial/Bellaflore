// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for deliveryZones.
//
// Назначение (RU): Определения типов для deliveryZones.
// ==================================================
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type { RoadDistanceStatus } from "@/components/deliveryZones/roadDistanceZoneTypes";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

export type DeliveryZoneDetectionMode = "polygon" | "road_distance" | "hybrid";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type RealDeliveryZoneDistanceSource = "none" | "approx" | "road";

export type RealDeliveryZoneStatus =
  | "available"
  | "outside_delivery_area"
  | "unknown"
  | "error";

export type RealDeliveryZoneResult = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  isInsideBaseZone: boolean;
  distanceFromBaseKm: number | null;
  selectedZoneId: DeliveryZoneId | null;
  selectedZoneLabel: string | null;
  deliveryPriceRub: number | null;
  status: RealDeliveryZoneStatus;
  detectionMode: DeliveryZoneDetectionMode;
  provider: string;
  warnings: string[];
  calculatedAt: string;
  distanceSource: RealDeliveryZoneDistanceSource;
  boundaryPoint: GeoCoordinate | null;
  roadDistanceKm: number | null;
  roadDurationMinutes: number | null;
  roadDistanceStatus: RoadDistanceStatus | null;
};

export type DetectRealDeliveryZoneParams = {
  address: string;
  latitude: number | null;
  longitude: number | null;
  detectionMode?: DeliveryZoneDetectionMode;
  provider?: string;
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getRealDeliveryZoneStatusLabel(
  status: RealDeliveryZoneStatus,
): string {
  switch (status) {
    case "available":
      return "Available";
    case "outside_delivery_area":
      return "Outside delivery area";
    case "error":
      return "Error";
    case "unknown":
    default:
      return "Unknown";
  }
}

export function getDeliveryZoneDetectionModeLabel(
  mode: DeliveryZoneDetectionMode,
): string {
  switch (mode) {
    case "polygon":
      return "Polygon (MKAD geometry)";
    case "road_distance":
      return "Road distance";
    case "hybrid":
    default:
      return "Hybrid (MKAD + road distance)";
  }
}
