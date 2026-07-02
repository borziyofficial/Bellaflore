// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import type { GeocodingResult } from "@/components/maps/geocodingTypes";

const MOCK_MOSCOW_COORDINATES = {
  latitude: 55.7558,
  longitude: 37.6173,
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const MOSCOW_ADDRESS_PATTERN = /(moscow|москва)/i;

function createGeocodingResult(
  partial: Omit<GeocodingResult, "updatedAt">,
): GeocodingResult {
  return {
    ...partial,
    updatedAt: new Date().toISOString(),
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
export function geocodeAddressMock(address: string): GeocodingResult {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) {
    return createGeocodingResult({
      address: "",
      latitude: null,
      longitude: null,
      confidence: null,
      provider: "mock",
      status: "not_found",
    });
  }

  if (MOSCOW_ADDRESS_PATTERN.test(normalizedAddress)) {
    return createGeocodingResult({
      address: normalizedAddress,
      latitude: MOCK_MOSCOW_COORDINATES.latitude,
      longitude: MOCK_MOSCOW_COORDINATES.longitude,
      confidence: 0.86,
      provider: "mock",
      status: "found",
    });
  }

  return createGeocodingResult({
    address: normalizedAddress,
    latitude: null,
    longitude: null,
    confidence: null,
    provider: "mock",
    status: "pending",
  });
}
