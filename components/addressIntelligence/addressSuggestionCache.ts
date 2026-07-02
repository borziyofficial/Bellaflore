// ==================================================
// SECTION: ADDRESS INTELLIGENCE
// РАЗДЕЛ: Интеллект адресов
//
// Purpose (EN): Live address suggestions, normalization, and geocoder adapters.
//
// Назначение (RU): Подсказки адресов, нормализация и адаптеры геокодера.
// ==================================================
import type { AddressSuggestionCacheEntry } from "@/components/addressIntelligence/addressIntelligenceTypes";

export const ADDRESS_SUGGESTION_CACHE_STORAGE_KEY =
  "bellaflore_address_suggestions_cache_v1";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const MAX_CACHE_ENTRIES = 40;

type AddressSuggestionCacheStore = Record<string, AddressSuggestionCacheEntry>;

function readCacheStore(): AddressSuggestionCacheStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(
      ADDRESS_SUGGESTION_CACHE_STORAGE_KEY,
    );
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }

    return parsedValue as AddressSuggestionCacheStore;
  } catch {
    return {};
  }
}

function writeCacheStore(store: AddressSuggestionCacheStore): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ADDRESS_SUGGESTION_CACHE_STORAGE_KEY,
      JSON.stringify(store),
    );
  } catch {
    // Cache is optional; suggestions still work without persistence.
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
export function getCachedAddressSuggestions(
  normalizedInput: string,
): AddressSuggestionCacheEntry | null {
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

export function saveCachedAddressSuggestions(
  entry: AddressSuggestionCacheEntry,
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

  const trimmedStore = Object.fromEntries(entries.slice(0, MAX_CACHE_ENTRIES));
  writeCacheStore(trimmedStore);
}

export function clearAddressSuggestionCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(ADDRESS_SUGGESTION_CACHE_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
