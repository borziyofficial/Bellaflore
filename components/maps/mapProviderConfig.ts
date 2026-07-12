// ==================================================
// SECTION: CONFIG
// РАЗДЕЛ: Конфигурация
//
// Purpose (EN): Configuration constants for maps.
//
// Назначение (RU): Константы конфигурации для maps.
// ==================================================
import type {
  MapProviderConfig,
  MapProviderCapability,
  MapProviderId,
} from "@/components/maps/mapProviderTypes";

const DEFAULT_PROVIDER: MapProviderId = "mock";

function readFirstEnvKey(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function normalizeProviderId(rawValue: string | undefined): MapProviderId {
  if (!rawValue?.trim()) {
    return DEFAULT_PROVIDER;
  }

  const normalized = rawValue.trim().toLowerCase();

  if (normalized === "mock") {
    return "mock";
  }

  if (normalized === "yandex") {
    return "yandex";
  }

  if (
    normalized === "twogis" ||
    normalized === "2gis" ||
    normalized === "two_gis"
  ) {
    return "twoGis";
  }

  if (normalized === "google") {
    return "google";
  }

  return DEFAULT_PROVIDER;
}

function readUnifiedYandexApiKey(): string {
  return readFirstEnvKey(
    "NEXT_PUBLIC_YANDEX_MAPS_API_KEY",
    "YANDEX_MAPS_API_KEY",
    "NEXT_PUBLIC_YANDEX_GEOCODER_API_KEY",
    "YANDEX_GEOCODER_API_KEY",
    "NEXT_PUBLIC_YANDEX_GEOSUGGEST_API_KEY",
    "YANDEX_GEOSUGGEST_API_KEY",
    "NEXT_PUBLIC_MAP_API_KEY",
    "YANDEX_API_KEY",
  );
}

function readConfiguredProviderId(): MapProviderId {
  const explicitProvider = normalizeProviderId(process.env.NEXT_PUBLIC_MAP_PROVIDER);
  if (explicitProvider !== DEFAULT_PROVIDER) {
    return explicitProvider;
  }

  if (readUnifiedYandexApiKey().length > 0) {
    return "yandex";
  }

  return DEFAULT_PROVIDER;
}

function readProviderApiKey(provider: MapProviderId): string {
  if (provider === "yandex") {
    return readUnifiedYandexApiKey();
  }

  return readFirstEnvKey("NEXT_PUBLIC_MAP_API_KEY", "MAP_API_KEY");
}

// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getYandexMapsApiKey(): string {
  return readFirstEnvKey(
    "NEXT_PUBLIC_YANDEX_MAPS_API_KEY",
    "YANDEX_MAPS_API_KEY",
    "NEXT_PUBLIC_MAP_API_KEY",
    "YANDEX_API_KEY",
  ) || readUnifiedYandexApiKey();
}

// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
// ==================================================
export function getYandexGeoSuggestApiKey(): string {
  return (
    readFirstEnvKey(
      "NEXT_PUBLIC_YANDEX_GEOSUGGEST_API_KEY",
      "YANDEX_GEOSUGGEST_API_KEY",
    ) || getYandexMapsApiKey()
  );
}

export function getYandexGeocoderApiKey(): string {
  return (
    readFirstEnvKey(
      "NEXT_PUBLIC_YANDEX_GEOCODER_API_KEY",
      "YANDEX_GEOCODER_API_KEY",
    ) || getYandexMapsApiKey()
  );
}

export function readMapProviderConfig(): MapProviderConfig {
  const configuredProvider = readConfiguredProviderId();
  const apiKeyConfigured = readProviderApiKey(configuredProvider).length > 0;
  const usesMockFallback =
    configuredProvider !== "mock" && !apiKeyConfigured;
  const effectiveProvider = usesMockFallback
    ? DEFAULT_PROVIDER
    : configuredProvider;

  return {
    configuredProvider,
    effectiveProvider,
    apiKeyConfigured,
    usesMockFallback,
  };
}

export function getMapProviderLabel(providerId: MapProviderId): string {
  switch (providerId) {
    case "mock":
      return "Mock";
    case "yandex":
      return "Yandex Maps";
    case "twoGis":
      return "2GIS";
    case "google":
      return "Google Maps";
    default:
      return providerId;
  }
}

export function getMapProviderCapabilityLabel(
  capability: MapProviderCapability,
): string {
  switch (capability) {
    case "geocoding":
      return "Geocoding";
    case "mapPreview":
      return "Map preview";
    case "routing":
      return "Routing";
    case "eta":
      return "ETA";
    case "traffic":
      return "Traffic";
    default:
      return capability;
  }
}
