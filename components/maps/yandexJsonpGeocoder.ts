// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Client-side JSONP geocode via official Yandex search/v2 endpoint.
//
// Назначение (RU):
// Клиентский JSONP-геокодер через официальный endpoint Yandex search/v2.
// ==================================================
import { getYandexGeocoderApiKey } from "@/components/maps/mapProviderConfig";
import type { YandexHttpGeocodeResult } from "@/components/maps/yandexHttpGeocoder";
import { readYandexJsApiSearchToken } from "@/components/maps/yandexSearchToken";

type YandexJsonpSearchResponse = {
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

function mapJsonpPayload(payload: YandexJsonpSearchResponse): YandexHttpGeocodeResult[] {
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

function fetchYandexSearchJsonp(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const callbackName = `bellafloreYandexJsonp_${Date.now()}_${Math.random()
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
      reject(new Error("Yandex search/v2 JSONP request failed."));
    };

    document.head.appendChild(script);

    window.setTimeout(() => {
      if ((window as unknown as Record<string, unknown>)[callbackName]) {
        cleanup();
        reject(new Error("Yandex search/v2 JSONP request timed out."));
      }
    }, 8000);
  });
}

export async function geocodeWithYandexSearchJsonp(
  query: string,
  options?: { uri?: string; results?: number },
): Promise<YandexHttpGeocodeResult[]> {
  if (typeof window === "undefined") {
    throw new Error("Yandex JSONP geocoder requires a browser environment.");
  }

  const apiKey = getYandexGeocoderApiKey();
  if (!apiKey) {
    throw new Error("Yandex Geocoder API key is not configured.");
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    format: "json",
    rspn: "0",
    lang: "ru_RU",
    results: String(options?.results ?? 1),
    type: "geo",
    properties: "addressdetails",
    geocoder_sco: "latlong",
    origin: "jsapi2Geocoder",
  });

  const token = readYandexJsApiSearchToken();
  if (token) {
    params.set("token", token);
  }

  if (options?.uri) {
    params.set("uri", options.uri);
  } else {
    params.set("text", query);
  }

  const url = `https://api-maps.yandex.ru/services/search/v2/?${params.toString()}`;
  const payload = (await fetchYandexSearchJsonp(url)) as YandexJsonpSearchResponse;
  const results = mapJsonpPayload(payload);

  if (results.length === 0) {
    throw new Error("Yandex search/v2 JSONP returned no results.");
  }

  return results;
}
