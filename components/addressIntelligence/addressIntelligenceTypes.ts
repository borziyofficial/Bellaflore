// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for addressIntelligence.
//
// Назначение (RU): Определения типов для addressIntelligence.
// ==================================================
export type AddressIntelligenceStatus =
  | "idle"
  | "typing"
  | "suggestions_available"
  | "selected"
  | "needs_more_details"
  | "ambiguous"
  | "unsupported"
  | "error";

export type AddressSuggestionSource =
  | "local_pattern"
  | "geocoder"
  | "cache"
  | "mock";

export type AddressSuggestion = {
  id: string;
  label: string;
  fullAddress: string;
  city: string;
  districtLine?: string;
  street: string;
  house: string;
  entrance?: string;
  building?: string;
  corpus?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  confidence: number;
  source: AddressSuggestionSource;
  yandexUri?: string;
};

export type AddressIntelligenceResult = {
  rawInput: string;
  normalizedInput: string;
  suggestions: AddressSuggestion[];
  selectedSuggestion?: AddressSuggestion;
  status: AddressIntelligenceStatus;
  warnings: string[];
  errors: string[];
  updatedAt: string;
};

export type AddressSuggestionCacheEntry = {
  normalizedInput: string;
  suggestions: AddressSuggestion[];
  status: AddressIntelligenceStatus;
  cachedAt: string;
};
