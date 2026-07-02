// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import {
  readGeocodingCacheEntry,
  writeGeocodingCacheEntry,
} from "@/components/maps/geocodingCache";
import { normalizeGeocodingAddress } from "@/components/maps/geocodingNormalize";
import { geocodeAddressYandex } from "@/components/maps/yandexGeocoder";
import {
  getNeedsGeocodingMapPoints,
  type GeocodingOverrides,
  type OrderMapPoint,
} from "@/components/maps/orderMapData";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export async function geocodePendingMapPoints(
  points: OrderMapPoint[],
): Promise<GeocodingOverrides> {
  const targets = getNeedsGeocodingMapPoints(points);
  const results: GeocodingOverrides = {};

  for (const point of targets) {
    const addressKey = normalizeGeocodingAddress(point.address);
    if (!addressKey) {
      continue;
    }

    const cachedResult = readGeocodingCacheEntry(addressKey);
    if (cachedResult) {
      results[addressKey] = {
        ...cachedResult,
        fromCache: true,
      };
      continue;
    }

    const geocodingResult = await geocodeAddressYandex(point.address);
    writeGeocodingCacheEntry(addressKey, geocodingResult);
    results[addressKey] = geocodingResult;
  }

  return results;
}
