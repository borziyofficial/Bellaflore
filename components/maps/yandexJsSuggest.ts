// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Official Yandex suggest() with HTTP proxy and geocoder fallbacks.
//
// Назначение (RU):
// Официальный suggest() Yandex с HTTP-прокси и резервным геокодером.
// ==================================================
import { fetchYandexSuggestViaApiProxy } from "@/components/maps/yandexHttpSuggest";
import { loadConfiguredYandexMapsSdk } from "@/components/maps/loadYandexMapsSdk";
import { normalizeAddressForYandexGeocoding } from "@/components/maps/geocodingNormalize";
import {
  geocodeWithYandexMapsSdk,
  iterateGeoObjects,
} from "@/components/maps/yandexJsGeocoder";
import { mapJsGeoObjectToSuggestion } from "@/components/maps/yandexGeocodeMappers";
import type {
  YandexSuggestItem,
  YandexSuggestOptions,
} from "@/components/maps/yandexMapsApi.types";

/** Moscow region bias bbox — prioritizes local results without blocking others. */
export const MOSCOW_SUGGEST_BIAS_BOUNDED_BY: [[number, number], [number, number]] =
  [
    [55.05, 35.05],
    [56.95, 39.2],
  ];

function normalizeYandexSuggestItems(raw: unknown): YandexSuggestItem[] {
  if (raw instanceof Error) {
    throw raw;
  }

  if (!Array.isArray(raw)) {
    throw new Error("Unexpected Yandex suggest response.");
  }

  return raw.filter(
    (item): item is YandexSuggestItem =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as YandexSuggestItem).displayName === "string" &&
      typeof (item as YandexSuggestItem).value === "string",
  );
}

async function suggestWithYandexJsApi(
  query: string,
  options: YandexSuggestOptions,
): Promise<YandexSuggestItem[]> {
  const ymaps = await loadConfiguredYandexMapsSdk();

  const raw = await new Promise<unknown>((resolve, reject) => {
    ymaps.ready(() => {
      if (!ymaps.suggest) {
        reject(new Error("Yandex Maps SDK suggest() is unavailable."));
        return;
      }

      void ymaps
        .suggest(query, {
          results: options.results ?? 10,
          boundedBy: options.boundedBy ?? MOSCOW_SUGGEST_BIAS_BOUNDED_BY,
          provider: options.provider ?? "yandex#map",
        })
        .then(resolve)
        .catch(reject);
    });
  });

  const items = normalizeYandexSuggestItems(raw);
  if (items.length === 0) {
    throw new Error("Yandex suggest returned no results.");
  }

  return items;
}

async function suggestWithYandexGeocodeFallback(
  query: string,
  options: YandexSuggestOptions,
): Promise<YandexSuggestItem[]> {
  const geocodeQuery = normalizeAddressForYandexGeocoding(query);
  const result = await geocodeWithYandexMapsSdk(geocodeQuery, {
    results: options.results ?? 10,
    strictBounds: false,
  });

  const items = iterateGeoObjects(result)
    .map((geoObject, index) => {
      const suggestion = mapJsGeoObjectToSuggestion(geoObject, index);
      if (!suggestion) {
        return null;
      }

      return {
        displayName: suggestion.label,
        value: suggestion.fullAddress,
      } satisfies YandexSuggestItem;
    })
    .filter((item): item is YandexSuggestItem => item !== null);

  if (items.length === 0) {
    throw new Error("Yandex geocoder fallback returned no results.");
  }

  return items;
}

export async function suggestWithYandexMapsSdk(
  query: string,
  options: YandexSuggestOptions & { signal?: AbortSignal } = {},
): Promise<YandexSuggestItem[]> {
  const biasedQuery = normalizeAddressForYandexGeocoding(query);
  const errors: string[] = [];

  try {
    const items = await fetchYandexSuggestViaApiProxy(biasedQuery, {
      signal: options.signal,
    });
    if (items.length > 0) {
      return items;
    }
    throw new Error("Yandex Geosuggest HTTP returned no results.");
  } catch (error) {
    errors.push(formatSuggestError(error, "geosuggest-http"));
  }

  try {
    return await suggestWithYandexJsApi(biasedQuery, options);
  } catch (error) {
    errors.push(formatSuggestError(error, "ymaps.suggest"));
  }

  try {
    return await suggestWithYandexGeocodeFallback(biasedQuery, options);
  } catch (error) {
    errors.push(formatSuggestError(error, "ymaps.geocode"));
  }

  throw new Error(errors.join(" | "));
}

function formatSuggestError(error: unknown, source: string): string {
  if (error instanceof Error) {
    return `${source}: ${error.message}`;
  }

  return `${source}: unknown error`;
}
