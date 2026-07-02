// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Client-side JSONP geocode via geocode-maps.yandex.ru/1.x.
//
// Назначение (RU):
// Клиентский JSONP-геокодер через geocode-maps.yandex.ru/1.x.
// ==================================================
import { getYandexGeocoderApiKey } from "@/components/maps/mapProviderConfig";
import type { YandexHttpGeocodeResult } from "@/components/maps/yandexHttpGeocoder";

type YandexGeocodeMapsJsonpResponse = {
  response?: {
    GeoObjectCollection?: {
      featureMember?: Array<{
        GeoObject?: {
          metaDataProperty?: {
            GeocoderMetaData?: {
              precision?: string;
              text?: string;
              Address?: { formatted?: string };
            };
          };
          Point?: { pos?: string };
        };
      }>;
    };
  };
};

function mapGeocodeMapsPayload(
  payload: YandexGeocodeMapsJsonpResponse,
): YandexHttpGeocodeResult[] {
  const members =
    payload.response?.GeoObjectCollection?.featureMember?.filter(Boolean) ?? [];

  const results: YandexHttpGeocodeResult[] = [];

  for (const member of members) {
    const geoObject = member.GeoObject;
    const meta = geoObject?.metaDataProperty?.GeocoderMetaData;
    const pos = geoObject?.Point?.pos?.trim();

    if (!meta || !pos) {
      continue;
    }

    const [longitudeRaw, latitudeRaw] = pos.split(/\s+/);
    const latitude = Number.parseFloat(latitudeRaw ?? "");
    const longitude = Number.parseFloat(longitudeRaw ?? "");

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      continue;
    }

    const formattedAddress =
      meta.Address?.formatted?.trim() || meta.text?.trim() || "";

    if (!formattedAddress) {
      continue;
    }

    const result: YandexHttpGeocodeResult = {
      formattedAddress,
      latitude,
      longitude,
    };

    if (meta.precision) {
      result.precision = meta.precision;
    }

    results.push(result);
  }

  return results;
}

function fetchYandexGeocodeMapsJsonp(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const callbackName = `bellafloreYandexGeocodeJsonp_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const cleanup = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      script.remove();
    };

    const script = document.createElement("script");
    script.async = true;
    script.src = `${url}${url.includes("?") ? "&" : "?"}callback=${callbackName}`;

    (window as unknown as Record<string, unknown>)[callbackName] = (
      payload: unknown,
    ) => {
      cleanup();
      resolve(payload);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Yandex Geocode Maps JSONP request failed."));
    };

    document.head.appendChild(script);

    window.setTimeout(() => {
      if ((window as unknown as Record<string, unknown>)[callbackName]) {
        cleanup();
        reject(new Error("Yandex Geocode Maps JSONP request timed out."));
      }
    }, 8000);
  });
}

function readGeocodeMapsApiKey(): string {
  return getYandexGeocoderApiKey();
}

export async function geocodeWithYandexGeocodeMapsJsonp(
  query: string,
  options?: { uri?: string; results?: number },
): Promise<YandexHttpGeocodeResult[]> {
  if (typeof window === "undefined") {
    throw new Error("Yandex Geocode Maps JSONP requires a browser environment.");
  }

  const apiKey = readGeocodeMapsApiKey();
  if (!apiKey) {
    throw new Error("Yandex Geocoder API key is not configured.");
  }

  const errors: string[] = [];
  const endpoints = [
    "https://geocode-maps.yandex.ru/v1/",
    "https://geocode-maps.yandex.ru/1.x/",
  ];

  for (const endpoint of endpoints) {
    const params = new URLSearchParams({
      apikey: apiKey,
      format: "json",
      lang: "ru_RU",
      results: String(options?.results ?? 1),
    });

    if (options?.uri) {
      params.set("uri", options.uri);
    } else {
      params.set("geocode", query);
    }

    const url = `${endpoint}?${params.toString()}`;

    try {
      const payload = (await fetchYandexGeocodeMapsJsonp(
        url,
      )) as YandexGeocodeMapsJsonpResponse;
      const results = mapGeocodeMapsPayload(payload);

      if (results.length > 0) {
        return results;
      }

      errors.push(`${endpoint}: empty response`);
    } catch (error) {
      errors.push(
        error instanceof Error ? error.message : `${endpoint}: unknown error`,
      );
    }
  }

  throw new Error(errors.join(" | "));
}
