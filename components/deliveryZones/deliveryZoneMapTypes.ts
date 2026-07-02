// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for deliveryZones.
//
// Назначение (RU): Определения типов для deliveryZones.
// ==================================================
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type { RealDeliveryZoneStatus } from "@/components/deliveryZones/realDeliveryZoneTypes";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

export type DeliveryZoneMapAvailability =
  | "available"
  | "outside_delivery_area"
  | "unknown";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type DeliveryZoneMapLegendItem = {
  zoneId: DeliveryZoneId;
  label: string;
  color: string;
  priceRub: number;
  maxDistanceFromBaseKm: number;
  availability: DeliveryZoneMapAvailability;
  isSelected: boolean;
  isBaseZone: boolean;
};

export type DeliveryZoneMapLayer = {
  zoneId: DeliveryZoneId;
  label: string;
  color: string;
  borderColor: string;
  priceRub: number;
  maxDistanceFromBaseKm: number;
  polygonCoordinates: GeoCoordinate[];
  ringCoordinates: GeoCoordinate[][];
  strokeWidth: number;
  fillOpacity: number;
  strokeOpacity: number;
  isSelected: boolean;
  sortOrder: number;
};

export type DeliveryZoneMapMarker = {
  latitude: number;
  longitude: number;
  label: string;
};

export type DeliveryZoneMapModel = {
  center: GeoCoordinate;
  defaultZoom: number;
  layers: DeliveryZoneMapLayer[];
  legend: DeliveryZoneMapLegendItem[];
  marker: DeliveryZoneMapMarker | null;
  selectedZoneId: DeliveryZoneId | null;
  zoneStatus: RealDeliveryZoneStatus;
  usesYandexMap: boolean;
};

export type BuildDeliveryZoneMapModelParams = {
  selectedZoneId: DeliveryZoneId | null;
  zoneStatus?: RealDeliveryZoneStatus;
  marker?: DeliveryZoneMapMarker | null;
  usesYandexMap?: boolean;
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getDeliveryZoneMapAvailabilityLabel(
  availability: DeliveryZoneMapAvailability,
): string {
  switch (availability) {
    case "available":
      return "Available";
    case "outside_delivery_area":
      return "Outside delivery area";
    case "unknown":
    default:
      return "Unknown";
  }
}

export function mapRealZoneStatusToMapAvailability(
  status: RealDeliveryZoneStatus,
): DeliveryZoneMapAvailability {
  switch (status) {
    case "available":
      return "available";
    case "outside_delivery_area":
      return "outside_delivery_area";
    case "error":
    case "unknown":
    default:
      return "unknown";
  }
}
