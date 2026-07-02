// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Зоны доставки
//
// Purpose (EN): MKAD zone detection, pricing, and road-distance calculations.
//
// Назначение (RU): Определение зон МКАД, тарифы и расчёт дорожного расстояния.
// ==================================================
import {
  DELIVERY_ZONE_DEFINITIONS,
  DELIVERY_ZONE_MAX_DISTANCE_KM,
} from "@/components/deliveryZones/deliveryZoneConfig";
import { DELIVERY_UNAVAILABLE_MESSAGE } from "@/components/deliveryZones/deliveryIntelligenceMessages";
import type {
  DeliveryZoneCalculationResult,
  DeliveryZoneDefinition,
} from "@/components/deliveryZones/deliveryZoneTypes";
import { calculateStraightLineDistanceKm } from "@/components/maps/distanceCalculator";
import { readGeocodingCacheEntry } from "@/components/maps/geocodingCache";
import { normalizeGeocodingAddress } from "@/components/maps/geocodingNormalize";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const MOSCOW_BASE_CENTER = {
  latitude: 55.7558,
  longitude: 37.6173,
};

const MOCK_DISTANCE_KM_PATTERN =
  /mockDistanceKm\s*[:=]\s*(\d+(?:[.,]\d+)?)/i;

function buildAvailableResult(
  zone: DeliveryZoneDefinition,
  distanceFromBaseKm: number,
): DeliveryZoneCalculationResult {
  return {
    zone,
    deliveryPriceRub: zone.priceRub,
    distanceFromBaseKm,
    status: "available",
    statusMessage: `${zone.label} · ${zone.priceRub.toLocaleString("ru-RU")} ₽`,
  };
}

function buildOutsideResult(
  distanceFromBaseKm: number,
): DeliveryZoneCalculationResult {
  return {
    zone: null,
    deliveryPriceRub: null,
    distanceFromBaseKm,
    status: "outside_delivery_area",
    statusMessage: DELIVERY_UNAVAILABLE_MESSAGE,
  };
}

function buildUnknownResult(message: string): DeliveryZoneCalculationResult {
  return {
    zone: null,
    deliveryPriceRub: null,
    distanceFromBaseKm: null,
    status: "unknown",
    statusMessage: message,
  };
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function calculateDeliveryZoneByDistance(
  distanceFromBaseKm: number,
): DeliveryZoneCalculationResult {
  if (!Number.isFinite(distanceFromBaseKm) || distanceFromBaseKm < 0) {
    return buildUnknownResult("Distance from base zone is unavailable.");
  }

  if (distanceFromBaseKm > DELIVERY_ZONE_MAX_DISTANCE_KM) {
    return buildOutsideResult(distanceFromBaseKm);
  }

  if (distanceFromBaseKm === 0) {
    const baseZone = DELIVERY_ZONE_DEFINITIONS.find((zone) => zone.isBaseZone);
    if (!baseZone) {
      return buildUnknownResult("Base delivery zone is not configured.");
    }

    return buildAvailableResult(baseZone, 0);
  }

  const matchedZone = DELIVERY_ZONE_DEFINITIONS.find(
    (zone) =>
      !zone.isBaseZone && distanceFromBaseKm <= zone.maxDistanceFromBaseKm,
  );

  if (!matchedZone) {
    return buildOutsideResult(distanceFromBaseKm);
  }

  return buildAvailableResult(matchedZone, distanceFromBaseKm);
}

function parseMockDistanceKm(address: string): number | null {
  const match = address.match(MOCK_DISTANCE_KM_PATTERN);
  if (!match?.[1]) {
    return null;
  }

  const parsedDistance = Number(match[1].replace(",", "."));
  return Number.isFinite(parsedDistance) ? parsedDistance : null;
}

function isMoscowBaseAddress(address: string): boolean {
  const normalizedAddress = address.toLowerCase().replace(/ё/g, "е");

  return (
    normalizedAddress.includes("москва") ||
    normalizedAddress.includes("moscow") ||
    normalizedAddress.includes("внутри мкад") ||
    normalizedAddress.includes("мкад") ||
    normalizedAddress.includes("цао") ||
    normalizedAddress.includes("сао") ||
    normalizedAddress.includes("свао") ||
    normalizedAddress.includes("вао") ||
    normalizedAddress.includes("ювао") ||
    normalizedAddress.includes("юао") ||
    normalizedAddress.includes("юзао") ||
    normalizedAddress.includes("зао") ||
    normalizedAddress.includes("сзао")
  );
}

function resolveDistanceFromGeocodingCache(address: string): number | null {
  const normalizedAddress = normalizeGeocodingAddress(address);
  if (!normalizedAddress) {
    return null;
  }

  const cachedGeocoding = readGeocodingCacheEntry(normalizedAddress);
  if (
    cachedGeocoding?.status !== "found" ||
    cachedGeocoding.latitude === null ||
    cachedGeocoding.longitude === null
  ) {
    return null;
  }

  return calculateStraightLineDistanceKm(MOSCOW_BASE_CENTER, {
    latitude: cachedGeocoding.latitude,
    longitude: cachedGeocoding.longitude,
  });
}

export function resolveDeliveryZoneFromAddress(
  address: string,
): DeliveryZoneCalculationResult {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) {
    return buildUnknownResult(
      "Enter a delivery address to preview the delivery zone.",
    );
  }

  const mockDistanceKm = parseMockDistanceKm(normalizedAddress);
  if (mockDistanceKm !== null) {
    return calculateDeliveryZoneByDistance(mockDistanceKm);
  }

  if (isMoscowBaseAddress(normalizedAddress)) {
    return calculateDeliveryZoneByDistance(0);
  }

  const geocodedDistanceKm = resolveDistanceFromGeocodingCache(normalizedAddress);
  if (geocodedDistanceKm !== null) {
    return calculateDeliveryZoneByDistance(geocodedDistanceKm);
  }

  return buildUnknownResult(
    "Delivery zone preview is unavailable for this address yet.",
  );
}
