// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import type { GeocodingResult } from "@/components/maps/geocodingTypes";
import { readGeocodingCacheEntry } from "@/components/maps/geocodingCache";
import { normalizeGeocodingAddress } from "@/components/maps/geocodingNormalize";
import { geocodeAddressMock } from "@/components/maps/mockGeocoder";
import { isYandexGeocodingEnabled } from "@/components/maps/mapProviderRegistry";

function createPendingYandexResult(address: string): GeocodingResult {
  return {
    address,
    latitude: null,
    longitude: null,
    confidence: null,
    provider: "yandex",
    status: "pending",
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
export function geocodeAddress(
  address: string,
  options?: {
    override?: GeocodingResult;
  },
): GeocodingResult {
  if (options?.override) {
    return options.override;
  }

  const normalizedAddress = normalizeGeocodingAddress(address);

  if (!normalizedAddress) {
    return isYandexGeocodingEnabled()
      ? {
          address: "",
          latitude: null,
          longitude: null,
          confidence: null,
          provider: "yandex",
          status: "not_found",
          updatedAt: new Date().toISOString(),
        }
      : geocodeAddressMock(address);
  }

  if (isYandexGeocodingEnabled()) {
    const cachedResult = readGeocodingCacheEntry(normalizedAddress);
    if (cachedResult) {
      return {
        ...cachedResult,
        fromCache: true,
      };
    }

    return createPendingYandexResult(normalizedAddress);
  }

  return geocodeAddressMock(address);
}

export { geocodeAddressYandex } from "@/components/maps/yandexGeocoder";
