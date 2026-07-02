// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for maps.
//
// Назначение (RU): Определения типов для maps.
// ==================================================
export type MapProviderId = "mock" | "yandex" | "twoGis" | "google";

export type MapProviderCapability =
  | "geocoding"
  | "mapPreview"
  | "routing"
  | "eta"
  | "traffic";

export type MapProviderCapabilities = Record<MapProviderCapability, boolean>;

export type MapProviderConfig = {
  configuredProvider: MapProviderId;
  effectiveProvider: MapProviderId;
  apiKeyConfigured: boolean;
  usesMockFallback: boolean;
};

export type MapProviderStatusSnapshot = {
  config: MapProviderConfig;
  capabilities: MapProviderCapabilities;
  realProviderEnabled: boolean;
};
