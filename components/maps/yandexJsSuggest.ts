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
import { buildRussianAddressQueryVariants } from "@/components/maps/latinAddressTransliteration";
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
    .map((geoObject, index): YandexSuggestItem | null => {
      const suggestion = mapJsGeoObjectToSuggestion(geoObject, index);
      if (!suggestion) {
        return null;
      }

      return {
        displayName: suggestion.label,
        value: suggestion.fullAddress,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        provider: suggestion.provider,
      } satisfies YandexSuggestItem;
    })
    .filter((item): item is YandexSuggestItem => item !== null);

  if (items.length === 0) {
    throw new Error("Yandex geocoder fallback returned no results.");
  }

  return items;
}

// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Distinguishes "every provider answered, nobody knows this address" from a
// real provider outage, so the dropdown can say "адрес не найден" instead of
// "сервис недоступен".
//
// Назначение (RU):
// Отличает «адрес не найден» от сбоя провайдера, чтобы подсказки показывали
// корректное сообщение.
// ==================================================
export class YandexSuggestNoResultsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YandexSuggestNoResultsError";
  }
}

export async function suggestWithYandexMapsSdk(
  query: string,
  options: YandexSuggestOptions & { signal?: AbortSignal } = {},
): Promise<YandexSuggestItem[]> {
  // Latin input is transliterated first ("Palekhskaya street 17" ->
  // "Палехская улица 17"); Cyrillic input yields a single unchanged variant.
  const queryVariants = buildRussianAddressQueryVariants(query).map(
    (variant) => normalizeAddressForYandexGeocoding(variant),
  );
  const orderedQueries = queryVariants.length > 0
    ? Array.from(new Set(queryVariants))
    : [normalizeAddressForYandexGeocoding(query)];
  const primaryQuery = orderedQueries[0];
  const errors: string[] = [];

  try {
    const outcome = await fetchYandexSuggestViaApiProxy(primaryQuery, {
      signal: options.signal,
    });
    if (outcome.items.length > 0) {
      return outcome.items;
    }

    // The proxy already tried Yandex Geosuggest for every query variant and
    // the OSM fallback. Running the SDK layers would add seconds of spinner
    // for an address that demonstrably does not exist.
    if (outcome.exhausted) {
      throw new YandexSuggestNoResultsError(
        "Yandex Geosuggest and fallback geocoder returned no results.",
      );
    }

    throw new Error("Yandex Geosuggest HTTP returned no results.");
  } catch (error) {
    if (error instanceof YandexSuggestNoResultsError) {
      throw error;
    }
    errors.push(formatSuggestError(error, "geosuggest-http"));
  }

  if (options.signal?.aborted) {
    throw new Error(errors.join(" | "));
  }

  for (const candidateQuery of orderedQueries) {
    try {
      return await suggestWithYandexJsApi(candidateQuery, options);
    } catch (error) {
      errors.push(formatSuggestError(error, "ymaps.suggest"));
    }

    if (options.signal?.aborted) {
      throw new Error(errors.join(" | "));
    }
  }

  try {
    return await suggestWithYandexGeocodeFallback(primaryQuery, options);
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
