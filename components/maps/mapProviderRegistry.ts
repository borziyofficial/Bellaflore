// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import {
  getYandexGeoSuggestApiKey,
  getYandexGeocoderApiKey,
  getYandexMapsApiKey,
  readMapProviderConfig,
} from "@/components/maps/mapProviderConfig";
import type {
  MapProviderCapabilities,
  MapProviderConfig,
  MapProviderId,
  MapProviderStatusSnapshot,
} from "@/components/maps/mapProviderTypes";

const PROVIDER_CAPABILITIES: Record<MapProviderId, MapProviderCapabilities> = {
  mock: {
    geocoding: true,
    mapPreview: true,
    routing: false,
    eta: false,
    traffic: false,
  },
  yandex: {
    geocoding: true,
    mapPreview: true,
    routing: true,
    eta: true,
    traffic: true,
  },
  twoGis: {
    geocoding: true,
    mapPreview: true,
    routing: true,
    eta: true,
    traffic: true,
  },
  google: {
    geocoding: true,
    mapPreview: true,
    routing: true,
    eta: true,
    traffic: true,
  },
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getMapProviderConfig(): MapProviderConfig {
  return readMapProviderConfig();
}

export function getActiveMapProvider(): MapProviderId {
  return readMapProviderConfig().configuredProvider;
}

export function getEffectiveMapProvider(): MapProviderId {
  return readMapProviderConfig().effectiveProvider;
}

export function getMapProviderCapabilities(
  providerId?: MapProviderId,
): MapProviderCapabilities {
  const resolvedProviderId = providerId ?? getActiveMapProvider();
  return PROVIDER_CAPABILITIES[resolvedProviderId];
}

export function isRealMapProviderEnabled(): boolean {
  const config = readMapProviderConfig();
  return config.configuredProvider !== "mock" && config.apiKeyConfigured;
}

export function isYandexMapsPreviewEnabled(): boolean {
  return getYandexMapsApiKey().length > 0;
}

export function isYandexGeocodingEnabled(): boolean {
  return getYandexGeocoderApiKey().length > 0;
}

export function isYandexSuggestEnabled(): boolean {
  return getYandexGeoSuggestApiKey().length > 0;
}

/** Delivery/checkout/home maps mount Yandex SDK only after user opens the map. */
export function isDeliveryMapSdkLazyLoadEnabled(): boolean {
  return true;
}

export function getMapProviderStatusSnapshot(): MapProviderStatusSnapshot {
  const config = readMapProviderConfig();

  return {
    config,
    capabilities: getMapProviderCapabilities(config.configuredProvider),
    realProviderEnabled: isRealMapProviderEnabled(),
  };
}
