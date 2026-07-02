// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for deliveryZones.
//
// Назначение (RU): Определения типов для deliveryZones.
// ==================================================
export type DeliveryZoneId =
  | "base"
  | "7km"
  | "14km"
  | "21km"
  | "28km"
  | "38km"
  | "48km";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type DeliveryZoneDefinition = {
  zoneId: DeliveryZoneId;
  label: string;
  color: string;
  maxDistanceFromBaseKm: number;
  priceRub: number;
  isBaseZone: boolean;
  sortOrder: number;
};

export type DeliveryZoneCalculationStatus =
  | "available"
  | "outside_delivery_area"
  | "unknown";

export type DeliveryZoneCalculationResult = {
  zone: DeliveryZoneDefinition | null;
  deliveryPriceRub: number | null;
  distanceFromBaseKm: number | null;
  status: DeliveryZoneCalculationStatus;
  statusMessage: string;
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getDeliveryZoneStatusLabel(
  status: DeliveryZoneCalculationStatus,
): string {
  switch (status) {
    case "available":
      return "Available";
    case "outside_delivery_area":
      return "Outside delivery area";
    case "unknown":
    default:
      return "Unknown";
  }
}
