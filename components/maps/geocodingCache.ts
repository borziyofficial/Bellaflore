// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import type { GeocodingResult } from "@/components/maps/geocodingTypes";

export const GEOCODING_CACHE_STORAGE_KEY = "bellaflore_geocoding_cache_v1";

type GeocodingCacheStore = Record<string, GeocodingResult>;


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function readCacheStore(): GeocodingCacheStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(GEOCODING_CACHE_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }

    return parsedValue as GeocodingCacheStore;
  } catch {
    return {};
  }
}

function writeCacheStore(store: GeocodingCacheStore): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(GEOCODING_CACHE_STORAGE_KEY, JSON.stringify(store));
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function readGeocodingCacheEntry(
  addressKey: string,
): GeocodingResult | null {
  if (!addressKey) {
    return null;
  }

  const cachedResult = readCacheStore()[addressKey];
  if (!cachedResult) {
    return null;
  }

  return cachedResult;
}

export const GEOCODING_CACHE_UPDATED_EVENT = "bellaflore:geocoding-cache-updated";

export function writeGeocodingCacheEntry(
  addressKey: string,
  result: GeocodingResult,
): void {
  if (!addressKey) {
    return;
  }

  const store = readCacheStore();
  store[addressKey] = result;
  writeCacheStore(store);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(GEOCODING_CACHE_UPDATED_EVENT));
  }
}

export function readAllGeocodingCacheEntries(): GeocodingCacheStore {
  return readCacheStore();
}

export function mergeGeocodingCacheEntries(
  entries: GeocodingCacheStore,
): GeocodingCacheStore {
  const store = readCacheStore();

  for (const [addressKey, result] of Object.entries(entries)) {
    store[addressKey] = result;
  }

  writeCacheStore(store);
  return store;
}
