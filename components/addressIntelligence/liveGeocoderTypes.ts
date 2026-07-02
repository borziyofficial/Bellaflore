// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for addressIntelligence.
//
// Назначение (RU): Определения типов для addressIntelligence.
// ==================================================
export type LiveGeocoderProvider = "yandex" | "fallback";

export type LiveGeocoderStatus =
  | "idle"
  | "loading"
  | "ready"
  | "no_results"
  | "provider_unavailable"
  | "error";

export type LiveGeocoderSuggestion = {
  id: string;
  label: string;
  fullAddress: string;
  city: string;
  districtLine?: string;
  street: string;
  house: string;
  building?: string;
  corpus?: string;
  entrance?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  confidence: number;
  provider: LiveGeocoderProvider;
  raw?: string;
  yandexUri?: string;
};

export type LiveGeocoderCacheEntry = {
  normalizedInput: string;
  suggestions: LiveGeocoderSuggestion[];
  status: LiveGeocoderStatus;
  provider: LiveGeocoderProvider;
  cachedAt: string;
};

export type LiveGeocoderSuggestionsSource =
  | LiveGeocoderProvider
  | "cache"
  | "local"
  | "mixed";

export type LiveGeocoderFetchResult = {
  status: LiveGeocoderStatus;
  suggestions: LiveGeocoderSuggestion[];
  errorMessage: string | null;
  provider: LiveGeocoderProvider;
};
