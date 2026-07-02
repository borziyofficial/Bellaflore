// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import { loadConfiguredYandexMapsSdk } from "@/components/maps/loadYandexMapsSdk";
import {
  fetchYandexGeocodeByUriViaApiProxy,
  fetchYandexGeocodeViaApiProxy,
  fetchYandexRetrieveViaApiProxy,
} from "@/components/maps/yandexHttpGeocoder";
import { geocodeWithYandexGeocodeMapsJsonp } from "@/components/maps/yandexGeocodeMapsJsonp";
import { fetchAddressGeocodeFallback } from "@/components/maps/addressGeocodeFallback";
import type {
  YandexJsGeocodeGeoObject,
  YandexJsGeocodeResult,
  YandexMapsApi,
} from "@/components/maps/yandexMapsApi.types";

/** Moscow region bbox as [[southWestLat, southWestLon], [northEastLat, northEastLon]]. */
export const MOSCOW_REGION_BOUNDED_BY: [[number, number], [number, number]] = [
  [55.05, 35.05],
  [56.95, 39.2],
];

export type YandexJsGeocodeOptions = {
  results?: number;
  boundedBy?: [[number, number], [number, number]];
  strictBounds?: boolean;
  uri?: string;
};

export function getYandexMapsSdk(): Promise<YandexMapsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Yandex Maps SDK requires a browser environment"),
    );
  }

  return loadConfiguredYandexMapsSdk();
}

function buildGeoObjectCollection(
  items: Array<{
    formattedAddress: string;
    latitude: number;
    longitude: number;
    precision?: string;
  }>,
): YandexJsGeocodeResult {
  const geoObjects: YandexJsGeocodeGeoObject[] = items.map((item) => ({
    geometry: {
      getCoordinates: () => [item.latitude, item.longitude] as [number, number],
    },
    properties: {
      get: (key: string) => {
        if (key === "name") {
          return item.formattedAddress.split(", ").at(-1) ?? item.formattedAddress;
        }

        if (key === "description") {
          return item.formattedAddress;
        }

        if (key === "metaDataProperty.GeocoderMetaData") {
          return {
            precision: item.precision,
            text: item.formattedAddress,
            Address: {
              formatted: item.formattedAddress,
            },
          };
        }

        return undefined;
      },
    },
    getAddressLine: () => item.formattedAddress,
  }));

  return {
    geoObjects: {
      getLength: () => geoObjects.length,
      get: (index: number) => geoObjects[index] ?? null,
    },
  };
}

async function geocodeWithYandexHttpProxy(
  query: string,
  options: YandexJsGeocodeOptions,
): Promise<YandexJsGeocodeResult> {
  const errors: string[] = [];

  try {
    const geocodeMapsResults = await geocodeWithYandexGeocodeMapsJsonp(query, {
      uri: options.uri,
      results: options.results ?? 1,
    });

    if (geocodeMapsResults.length > 0) {
      return buildGeoObjectCollection(geocodeMapsResults);
    }
  } catch (error) {
    errors.push(formatGeocodeError(error, "geocode-maps-jsonp"));
  }

  const proxyResults = options.uri
    ? await fetchYandexGeocodeByUriViaApiProxy(options.uri)
    : await fetchYandexGeocodeViaApiProxy(query);

  if (proxyResults.length > 0) {
    return buildGeoObjectCollection(
      proxyResults.slice(0, options.results ?? 1),
    );
  }

  if (options.uri) {
    const retrieved = await fetchYandexRetrieveViaApiProxy(options.uri);
    if (retrieved) {
      return buildGeoObjectCollection([retrieved]);
    }
  }

  const fallbackResults = await fetchAddressGeocodeFallback(query);
  if (fallbackResults.length > 0) {
    return buildGeoObjectCollection(
      fallbackResults.slice(0, options.results ?? 1),
    );
  }

  if (errors.length > 0) {
    throw new Error(errors.join(" | "));
  }

  throw new Error("Yandex geocode returned no results.");
}

async function geocodeWithYandexJsApi(
  query: string,
  options: YandexJsGeocodeOptions,
): Promise<YandexJsGeocodeResult> {
  const ymaps = await getYandexMapsSdk();

  const raw = await new Promise<unknown>((resolve, reject) => {
    ymaps.ready(() => {
      void ymaps
        .geocode(query, {
          results: options.results ?? 1,
          boundedBy: options.boundedBy ?? MOSCOW_REGION_BOUNDED_BY,
          strictBounds: options.strictBounds ?? false,
        })
        .then(resolve)
        .catch(reject);
    });
  });

  if (raw instanceof Error) {
    throw raw;
  }

  return raw as YandexJsGeocodeResult;
}

export async function geocodeWithYandexMapsSdk(
  query: string,
  options: YandexJsGeocodeOptions = {},
): Promise<YandexJsGeocodeResult> {
  const errors: string[] = [];

  try {
    return await geocodeWithYandexHttpProxy(query, options);
  } catch (error) {
    errors.push(formatGeocodeError(error, "geocode-maps-http"));
  }

  try {
    return await geocodeWithYandexJsApi(query, options);
  } catch (error) {
    errors.push(formatGeocodeError(error, "ymaps.geocode"));
  }

  throw new Error(errors.join(" | "));
}

function formatGeocodeError(error: unknown, source: string): string {
  if (error instanceof Error) {
    return `${source}: ${error.message}`;
  }

  return `${source}: unknown error`;
}

export function iterateGeoObjects(
  result: YandexJsGeocodeResult,
): YandexJsGeocodeGeoObject[] {
  const items: YandexJsGeocodeGeoObject[] = [];
  const length = result.geoObjects.getLength();

  for (let index = 0; index < length; index += 1) {
    const geoObject = result.geoObjects.get(index);
    if (geoObject) {
      items.push(geoObject);
    }
  }

  return items;
}
