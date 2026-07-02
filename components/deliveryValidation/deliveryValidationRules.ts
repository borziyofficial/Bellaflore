// ==================================================
// SECTION: DELIVERY VALIDATION
// РАЗДЕЛ: Валидация доставки
//
// Purpose (EN):
// Rule engine checks for geocoding, zones, and checkout eligibility.
//
// Назначение (RU):
// Правила проверки геокодирования, зон и возможности оформления заказа.
// ==================================================
import type {
  DeliveryValidationInput,
  DeliveryValidationIssue,
  DeliveryValidationIssueCode,
} from "@/components/deliveryValidation/deliveryValidationTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN):
// Private helper functions used within this module.
//
// Назначение (RU):
// Приватные вспомогательные функции модуля.
// ==================================================
const MOSCOW_REGION_PATTERN =
  /(moscow|москва|московск(?:ая|ой)\s+обл(?:асть)?|подмосков|московская\s+обл)/i;

const UNSUPPORTED_REGION_PATTERN = /validationUnsupported/i;
const AMBIGUOUS_ADDRESS_PATTERN = /(validationAmbiguous|ambiguousMatch)/i;
const NO_HOUSE_PATTERN = /validationNoHouse/i;
const COORD_MISMATCH_PATTERN = /validationCoordMismatch/i;

const MOSCOW_MO_BOUNDS = {
  minLatitude: 55.05,
  maxLatitude: 56.95,
  minLongitude: 35.05,
  maxLongitude: 39.2,
};

function stripMockDistanceTokens(address: string): string {
  return address.replace(/mockDistanceKm\s*[:=]\s*[\d.,]+/gi, "").trim();
}

function stripValidationTestTokens(address: string): string {
  return address
    .replace(/validation(?:Ambiguous|NoHouse|Unsupported|CoordMismatch)/gi, "")
    .replace(/ambiguousMatch/gi, "")
    .trim();
}


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
export function addressHasHouseNumber(address: string): boolean {
  if (NO_HOUSE_PATTERN.test(address)) {
    return false;
  }

  const normalized = stripValidationTestTokens(stripMockDistanceTokens(address));

  if (!normalized) {
    return false;
  }

  const housePatterns = [
    /(?:^|[,\s])(?:д\.?|дом|стр\.?|к\.?|корп\.?|building|bldg\.?)\s*\d+[a-zA-Zа-яА-ЯёЁ]?(?:\s*[-/]\s*\d+)?(?:[,\s]|$)/i,
    /,\s*\d+[a-zA-Zа-яА-ЯёЁ]?(?:\s*[-/]\s*\d+)?(?:[,\s]|$)/,
    /\b\d+[a-zA-Zа-яА-ЯёЁ]?\s*(?:к\.?\s*\d+|стр\.?\s*\d+|корп\.?\s*\d+)?(?:[,\s]|$)/i,
  ];

  return housePatterns.some((pattern) => pattern.test(normalized));
}

export function isAddressAmbiguous(address: string): boolean {
  return AMBIGUOUS_ADDRESS_PATTERN.test(address);
}

export function isExplicitUnsupportedRegion(address: string): boolean {
  return UNSUPPORTED_REGION_PATTERN.test(address);
}

export function isUnsupportedRegionAddress(
  address: string,
  latitude: number | null,
  longitude: number | null,
): boolean {
  if (isExplicitUnsupportedRegion(address)) {
    return true;
  }

  if (latitude === null || longitude === null) {
    return false;
  }

  return !isCoordinateInsideSupportedRegion(latitude, longitude);
}

export function isCoordinateInsideSupportedRegion(
  latitude: number,
  longitude: number,
): boolean {
  return (
    latitude >= MOSCOW_MO_BOUNDS.minLatitude &&
    latitude <= MOSCOW_MO_BOUNDS.maxLatitude &&
    longitude >= MOSCOW_MO_BOUNDS.minLongitude &&
    longitude <= MOSCOW_MO_BOUNDS.maxLongitude
  );
}

export function hasAddressCoordinateMismatch(
  address: string,
  latitude: number | null,
  longitude: number | null,
): boolean {
  if (COORD_MISMATCH_PATTERN.test(address)) {
    return true;
  }

  if (latitude === null || longitude === null) {
    return false;
  }

  const mentionsSupportedRegion = MOSCOW_REGION_PATTERN.test(
    stripValidationTestTokens(stripMockDistanceTokens(address)),
  );
  const coordinatesInRegion = isCoordinateInsideSupportedRegion(
    latitude,
    longitude,
  );

  return mentionsSupportedRegion && !coordinatesInRegion;
}

function createIssue(
  code: DeliveryValidationIssueCode,
  blocking: boolean,
  safeWarning = false,
): DeliveryValidationIssue {
  return { code, blocking, safeWarning };
}

export function runDeliveryValidationRules(
  input: DeliveryValidationInput,
): DeliveryValidationIssue[] {
  const { address, geocoding, realZoneResult } = input;
  const trimmedAddress = address.trim();
  const issues: DeliveryValidationIssue[] = [];

  if (!trimmedAddress) {
    issues.push(createIssue("address_empty", true));
    return issues;
  }

  if (isExplicitUnsupportedRegion(trimmedAddress)) {
    issues.push(createIssue("unsupported_region", true));
    return issues;
  }

  if (geocoding.status === "pending") {
    issues.push(createIssue("geocoding_pending", true));
    return issues;
  }

  if (geocoding.status === "not_found" || geocoding.status === "error") {
    issues.push(createIssue("geocoder_failed", true));
    return issues;
  }

  if (geocoding.latitude === null || geocoding.longitude === null) {
    issues.push(createIssue("coordinates_missing", true));
    return issues;
  }

  if (!addressHasHouseNumber(trimmedAddress)) {
    issues.push(createIssue("house_number_missing", true));
  }

  if (isAddressAmbiguous(trimmedAddress)) {
    issues.push(createIssue("address_ambiguous", true));
  }

  if (
    isUnsupportedRegionAddress(
      trimmedAddress,
      geocoding.latitude,
      geocoding.longitude,
    )
  ) {
    issues.push(createIssue("unsupported_region", true));
  }

  if (
    hasAddressCoordinateMismatch(
      trimmedAddress,
      geocoding.latitude,
      geocoding.longitude,
    )
  ) {
    issues.push(createIssue("address_coordinate_mismatch", true));
  }

  if (realZoneResult.status === "outside_delivery_area") {
    issues.push(createIssue("outside_delivery_area", true));
  } else if (realZoneResult.status === "unknown") {
    issues.push(createIssue("zone_not_detected", true));
  } else if (realZoneResult.status === "error") {
    issues.push(createIssue("zone_not_detected", true));
  } else if (realZoneResult.status !== "available") {
    issues.push(createIssue("zone_not_detected", true));
  }

  const roadDistanceUnavailable =
    realZoneResult.roadDistanceStatus === "unavailable" ||
    realZoneResult.roadDistanceStatus === "provider_error" ||
    realZoneResult.roadDistanceStatus === "fallback_to_approx" ||
    (realZoneResult.distanceSource === "approx" &&
      !realZoneResult.isInsideBaseZone &&
      realZoneResult.roadDistanceKm === null);

  if (roadDistanceUnavailable && realZoneResult.status === "available") {
    issues.push(createIssue("road_distance_fallback", false, true));
  }

  return issues;
}
