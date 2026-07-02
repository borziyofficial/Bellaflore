// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for deliveryZones.
//
// Назначение (RU): Определения типов для deliveryZones.
// ==================================================
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";

export type DeliveryPriceSource = "zone_engine" | "fallback" | "manual";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type DeliveryPriceStatus =
  | "ready"
  | "unknown"
  | "outside_delivery_area"
  | "error";

export type DeliveryPriceResult = {
  deliveryZoneId: DeliveryZoneId | null;
  deliveryZoneLabel: string | null;
  deliveryPriceRub: number | null;
  distanceFromBaseKm: number | null;
  roadDistanceKm: number | null;
  roadDurationMinutes: number | null;
  source: DeliveryPriceSource;
  status: DeliveryPriceStatus;
  warnings: string[];
  calculatedAt: string;
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getDeliveryPriceStatusLabel(
  status: DeliveryPriceStatus,
): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "outside_delivery_area":
      return "Outside delivery area";
    case "error":
      return "Error";
    case "unknown":
    default:
      return "Unknown";
  }
}

export function getDeliveryPriceUnavailableMessage(
  status: DeliveryPriceStatus,
): string | null {
  switch (status) {
    case "outside_delivery_area":
      return "Доставка по этому адресу недоступна.";
    case "unknown":
      return "Рассчитается после адреса";
    case "error":
      return "Не удалось рассчитать стоимость доставки.";
    case "ready":
    default:
      return null;
  }
}
