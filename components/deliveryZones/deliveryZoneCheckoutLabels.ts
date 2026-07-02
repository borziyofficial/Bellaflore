// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Зоны доставки
//
// Purpose (EN): MKAD zone detection, pricing, and road-distance calculations.
//
// Назначение (RU): Определение зон МКАД, тарифы и расчёт дорожного расстояния.
// ==================================================
import { getDeliveryZoneCatalogEntry } from "@/components/deliveryZones/deliveryZoneConfig";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import { getRealDeliveryZoneStatusMessage } from "@/components/deliveryZones/realDeliveryZoneEngine";
import type {
  RealDeliveryZoneResult,
  RealDeliveryZoneStatus,
} from "@/components/deliveryZones/realDeliveryZoneTypes";

export const CHECKOUT_ZONE_PROMPT =
  "Введите адрес доставки, чтобы определить зону.";

export const CHECKOUT_MAP_UNAVAILABLE_MESSAGE =
  "Карта временно недоступна. Зона будет рассчитана по адресу.";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function formatCheckoutZoneDistanceLabel(
  maxDistanceFromBaseKm: number,
  isBaseZone: boolean,
): string {
  if (isBaseZone) {
    return "В пределах МКАД";
  }

  return `До ${maxDistanceFromBaseKm} км от МКАД`;
}

export function getCheckoutZoneLegendLabel(zoneId: DeliveryZoneId): string {
  const zone = getDeliveryZoneCatalogEntry(zoneId);

  if (!zone) {
    return "—";
  }

  return zone.title;
}

export function getCheckoutDeliveryZoneName(
  result: RealDeliveryZoneResult,
): string {
  if (result.selectedZoneId) {
    const catalogEntry = getDeliveryZoneCatalogEntry(result.selectedZoneId);
    return catalogEntry?.title ?? getCheckoutZoneLegendLabel(result.selectedZoneId);
  }

  return "—";
}

export function getCheckoutDeliveryAvailabilityLabel(
  status: RealDeliveryZoneStatus,
): string {
  switch (status) {
    case "available":
      return "Доставка доступна";
    case "outside_delivery_area":
    case "error":
      return "Доставка недоступна";
    case "unknown":
    default:
      return "Уточняется";
  }
}

export function isCheckoutDeliveryZoneResolved(
  result: RealDeliveryZoneResult,
): boolean {
  if (!result.address.trim()) {
    return false;
  }

  return (
    result.status === "available" ||
    result.status === "outside_delivery_area" ||
    (result.status === "error" &&
      result.latitude !== null &&
      result.longitude !== null)
  );
}

export function hasCheckoutAddressInput(
  result: RealDeliveryZoneResult,
): boolean {
  return result.address.trim().length > 0;
}

export function shouldShowCheckoutDeliveryMap(
  result: RealDeliveryZoneResult,
  liveAddressPreview?: {
    hasCoordinates: boolean;
    latitude: number | null;
    longitude: number | null;
  } | null,
): boolean {
  if (
    result.latitude !== null &&
    result.longitude !== null &&
    Number.isFinite(result.latitude) &&
    Number.isFinite(result.longitude)
  ) {
    return true;
  }

  if (
    liveAddressPreview?.hasCoordinates &&
    liveAddressPreview.latitude !== null &&
    liveAddressPreview.longitude !== null &&
    Number.isFinite(liveAddressPreview.latitude) &&
    Number.isFinite(liveAddressPreview.longitude)
  ) {
    return true;
  }

  return false;
}

const CHECKOUT_STATUS_MESSAGE_OVERRIDES: Record<string, string> = {
  "Enter a delivery address to detect the delivery zone.":
    CHECKOUT_ZONE_PROMPT,
  "Введите адрес доставки, чтобы определить зону.": CHECKOUT_ZONE_PROMPT,
  "Yandex map preview is unavailable. Showing static delivery zone rings.":
    CHECKOUT_MAP_UNAVAILABLE_MESSAGE,
};

export function getCheckoutDeliveryZoneStatusMessage(
  result: RealDeliveryZoneResult,
): string {
  const message = getRealDeliveryZoneStatusMessage(result);
  return CHECKOUT_STATUS_MESSAGE_OVERRIDES[message] ?? message;
}
