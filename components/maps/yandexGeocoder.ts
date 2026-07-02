// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import type { GeocodingResult } from "@/components/maps/geocodingTypes";
import {
  normalizeAddressForYandexGeocoding,
  normalizeGeocodingAddress,
} from "@/components/maps/geocodingNormalize";
import { getYandexGeocoderApiKey } from "@/components/maps/mapProviderConfig";
import {
  geocodeWithYandexMapsSdk,
  iterateGeoObjects,
} from "@/components/maps/yandexJsGeocoder";
import {
  mapPrecisionToConfidence,
  normalizeJsGeoObject,
} from "@/components/maps/yandexGeocodeMappers";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function createGeocodingResult(
  partial: Omit<GeocodingResult, "updatedAt">,
): GeocodingResult {
  return {
    ...partial,
    updatedAt: new Date().toISOString(),
  };
}

async function geocodeYandexQuery(
  normalizedAddress: string,
  geocodeQuery: string,
  options?: { uri?: string },
): Promise<GeocodingResult> {
  if (typeof window === "undefined") {
    return createGeocodingResult({
      address: normalizedAddress,
      latitude: null,
      longitude: null,
      confidence: null,
      provider: "yandex",
      status: "pending",
    });
  }

  const apiKey = getYandexGeocoderApiKey();
  if (!apiKey) {
    return createGeocodingResult({
      address: normalizedAddress,
      latitude: null,
      longitude: null,
      confidence: null,
      provider: "yandex",
      status: "error",
    });
  }

  try {
    const result = await geocodeWithYandexMapsSdk(geocodeQuery, {
      results: 1,
      strictBounds: false,
      uri: options?.uri,
    });
    const geoObjects = iterateGeoObjects(result);
    const firstFeature = geoObjects[0];

    if (!firstFeature) {
      return createGeocodingResult({
        address: normalizedAddress,
        latitude: null,
        longitude: null,
        confidence: null,
        provider: "yandex",
        status: "not_found",
      });
    }

    const feature = normalizeJsGeoObject(firstFeature);
    if (!feature) {
      return createGeocodingResult({
        address: normalizedAddress,
        latitude: null,
        longitude: null,
        confidence: null,
        provider: "yandex",
        status: "error",
      });
    }

    const formattedAddress = feature.formattedAddress?.trim() || normalizedAddress;

    return createGeocodingResult({
      address: formattedAddress,
      latitude: feature.latitude,
      longitude: feature.longitude,
      confidence: mapPrecisionToConfidence(feature.precision),
      provider: "yandex",
      status: "found",
    });
  } catch {
    return createGeocodingResult({
      address: normalizedAddress,
      latitude: null,
      longitude: null,
      confidence: null,
      provider: "yandex",
      status: "error",
    });
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
export async function geocodeAddressYandex(
  address: string,
): Promise<GeocodingResult> {
  const normalizedAddress = normalizeGeocodingAddress(address);

  if (!normalizedAddress) {
    return createGeocodingResult({
      address: "",
      latitude: null,
      longitude: null,
      confidence: null,
      provider: "yandex",
      status: "not_found",
    });
  }

  if (typeof window === "undefined") {
    return createGeocodingResult({
      address: normalizedAddress,
      latitude: null,
      longitude: null,
      confidence: null,
      provider: "yandex",
      status: "pending",
    });
  }

  const apiKey = getYandexGeocoderApiKey();
  if (!apiKey) {
    return createGeocodingResult({
      address: normalizedAddress,
      latitude: null,
      longitude: null,
      confidence: null,
      provider: "yandex",
      status: "error",
    });
  }

  const geocodeQuery = normalizeAddressForYandexGeocoding(normalizedAddress);

  return geocodeYandexQuery(normalizedAddress, geocodeQuery);
}

export async function geocodeAddressYandexFromValue(
  yandexValue: string,
  options?: { uri?: string },
): Promise<GeocodingResult> {
  const normalizedAddress = normalizeGeocodingAddress(yandexValue);

  if (!normalizedAddress) {
    return createGeocodingResult({
      address: "",
      latitude: null,
      longitude: null,
      confidence: null,
      provider: "yandex",
      status: "not_found",
    });
  }

  return geocodeYandexQuery(normalizedAddress, normalizedAddress, options);
}
