// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Зоны доставки
//
// Purpose (EN): MKAD zone detection, pricing, and road-distance calculations.
//
// Назначение (RU): Определение зон МКАД, тарифы и расчёт дорожного расстояния.
// ==================================================
import type {
  DeliveryPriceResult,
  DeliveryPriceSource,
  DeliveryPriceStatus,
} from "@/components/deliveryZones/deliveryPriceTypes";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function mapZoneStatusToPriceStatus(
  zoneStatus: RealDeliveryZoneResult["status"],
): DeliveryPriceStatus {
  switch (zoneStatus) {
    case "available":
      return "ready";
    case "outside_delivery_area":
      return "outside_delivery_area";
    case "error":
      return "error";
    case "unknown":
    default:
      return "unknown";
  }
}

function resolveDeliveryPriceSource(
  realZoneResult: RealDeliveryZoneResult,
): DeliveryPriceSource {
  const usesApproxFallback = realZoneResult.warnings.some(
    (warning) =>
      warning.toLowerCase().includes("approximate") ||
      warning.toLowerCase().includes("unavailable") ||
      warning.toLowerCase().includes("failed"),
  );

  if (
    realZoneResult.distanceSource === "approx" &&
    usesApproxFallback &&
    !realZoneResult.isInsideBaseZone
  ) {
    return "fallback";
  }

  return "zone_engine";
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function resolveDeliveryPriceFromZone(
  realZoneResult: RealDeliveryZoneResult,
): DeliveryPriceResult {
  const status = mapZoneStatusToPriceStatus(realZoneResult.status);
  const source = resolveDeliveryPriceSource(realZoneResult);
  const warnings = [...realZoneResult.warnings];

  if (status === "ready") {
    if (
      realZoneResult.deliveryPriceRub === null ||
      !realZoneResult.selectedZoneId
    ) {
      return {
        deliveryZoneId: null,
        deliveryZoneLabel: null,
        deliveryPriceRub: null,
        distanceFromBaseKm: realZoneResult.distanceFromBaseKm,
        roadDistanceKm: realZoneResult.roadDistanceKm,
        roadDurationMinutes: realZoneResult.roadDurationMinutes,
        source,
        status: "unknown",
        warnings: [
          ...warnings,
          "Delivery zone price is unavailable for this address.",
        ],
        calculatedAt: new Date().toISOString(),
      };
    }

    return {
      deliveryZoneId: realZoneResult.selectedZoneId,
      deliveryZoneLabel: realZoneResult.selectedZoneLabel,
      deliveryPriceRub: realZoneResult.deliveryPriceRub,
      distanceFromBaseKm: realZoneResult.distanceFromBaseKm,
      roadDistanceKm: realZoneResult.roadDistanceKm,
      roadDurationMinutes: realZoneResult.roadDurationMinutes,
      source,
      status: "ready",
      warnings,
      calculatedAt: new Date().toISOString(),
    };
  }

  if (status === "outside_delivery_area") {
    warnings.unshift("Delivery is unavailable for this address.");
  }

  if (status === "unknown") {
    warnings.unshift(
      "Delivery price is unavailable until the address zone is confirmed.",
    );
  }

  return {
    deliveryZoneId: realZoneResult.selectedZoneId,
    deliveryZoneLabel: realZoneResult.selectedZoneLabel,
    deliveryPriceRub: null,
    distanceFromBaseKm: realZoneResult.distanceFromBaseKm,
    roadDistanceKm: realZoneResult.roadDistanceKm,
    roadDurationMinutes: realZoneResult.roadDurationMinutes,
    source,
    status,
    warnings,
    calculatedAt: new Date().toISOString(),
  };
}

export function canSubmitCheckoutWithDeliveryPrice(
  deliveryPriceResult: DeliveryPriceResult,
): boolean {
  return deliveryPriceResult.status === "ready";
}

export function calculateCheckoutGrandTotal(
  bouquetsTotalRub: number,
  deliveryPriceResult: DeliveryPriceResult,
): number {
  if (
    deliveryPriceResult.status !== "ready" ||
    deliveryPriceResult.deliveryPriceRub === null
  ) {
    return bouquetsTotalRub;
  }

  return bouquetsTotalRub + deliveryPriceResult.deliveryPriceRub;
}
