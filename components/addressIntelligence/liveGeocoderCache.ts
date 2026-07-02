// ==================================================
// SECTION: ADDRESS INTELLIGENCE
// РАЗДЕЛ: Интеллект адресов
//
// Purpose (EN): Live address suggestions, normalization, and geocoder adapters.
//
// Назначение (RU): Подсказки адресов, нормализация и адаптеры геокодера.
// ==================================================
import type { LiveGeocoderCacheEntry } from "@/components/addressIntelligence/liveGeocoderTypes";

export const LIVE_GEOCODER_CACHE_STORAGE_KEY =
  "bellaflore_live_geocoder_suggestions_cache_v2";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const MAX_CACHE_ENTRIES = 50;

type LiveGeocoderCacheStore = Record<string, LiveGeocoderCacheEntry>;

function readCacheStore(): LiveGeocoderCacheStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(LIVE_GEOCODER_CACHE_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }

    return parsedValue as LiveGeocoderCacheStore;
  } catch {
    return {};
  }
}

function writeCacheStore(store: LiveGeocoderCacheStore): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      LIVE_GEOCODER_CACHE_STORAGE_KEY,
      JSON.stringify(store),
    );
  } catch {
    // Cache is optional.
  }
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getCachedLiveGeocoderSuggestions(
  normalizedInput: string,
): LiveGeocoderCacheEntry | null {
  if (!normalizedInput) {
    return null;
  }

  const cacheKey = normalizedInput.toLowerCase();
  const entry = readCacheStore()[cacheKey];

  if (!entry || !Array.isArray(entry.suggestions)) {
    return null;
  }

  return entry;
}

export function saveCachedLiveGeocoderSuggestions(
  entry: LiveGeocoderCacheEntry,
): void {
  if (!entry.normalizedInput) {
    return;
  }

  const cacheKey = entry.normalizedInput.toLowerCase();
  const store = readCacheStore();
  store[cacheKey] = entry;

  const entries = Object.entries(store).sort(
    (left, right) =>
      Date.parse(right[1].cachedAt) - Date.parse(left[1].cachedAt),
  );

  writeCacheStore(Object.fromEntries(entries.slice(0, MAX_CACHE_ENTRIES)));
}

export function clearLiveGeocoderSuggestionsCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(LIVE_GEOCODER_CACHE_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
