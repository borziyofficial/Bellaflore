// ==================================================
// SECTION: MESSAGES
// РАЗДЕЛ: Сообщения
//
// Purpose (EN): User-facing and log message strings for addressIntelligence.
//
// Назначение (RU): Пользовательские и служебные сообщения для addressIntelligence.
// ==================================================
import type { AddressSuggestion } from "@/components/addressIntelligence/addressIntelligenceTypes";
import type {
  LiveGeocoderSuggestion,
  LiveGeocoderSuggestionsSource,
} from "@/components/addressIntelligence/liveGeocoderTypes";
import type { LiveGeocoderStatus } from "@/components/addressIntelligence/liveGeocoderTypes";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function mapLiveGeocoderSuggestionToAddressSuggestion(
  suggestion: LiveGeocoderSuggestion,
): AddressSuggestion {
  return {
    id: suggestion.id,
    label: suggestion.label,
    fullAddress: suggestion.fullAddress,
    city: suggestion.city,
    districtLine: suggestion.districtLine,
    street: suggestion.street,
    house: suggestion.house,
    building: suggestion.building,
    corpus: suggestion.corpus,
    entrance: suggestion.entrance,
    landmark: suggestion.landmark,
    latitude: suggestion.latitude,
    longitude: suggestion.longitude,
    confidence: suggestion.confidence,
    source: suggestion.provider === "yandex" ? "geocoder" : "mock",
    yandexUri: suggestion.yandexUri,
  };
}

export function mergeLiveAndLocalSuggestions(
  liveSuggestions: AddressSuggestion[],
  localSuggestions: AddressSuggestion[],
): AddressSuggestion[] {
  const seen = new Set<string>();
  const merged: AddressSuggestion[] = [];

  for (const suggestion of [...liveSuggestions, ...localSuggestions]) {
    const key = suggestion.fullAddress.trim().toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(suggestion);
  }

  return merged;
}

export function resolveLiveGeocoderSource(
  liveCount: number,
  localCount: number,
  fromCache: boolean,
  provider: LiveGeocoderSuggestionsSource,
): LiveGeocoderSuggestionsSource {
  if (fromCache) {
    return "cache";
  }

  if (liveCount > 0 && localCount > 0) {
    return "mixed";
  }

  if (liveCount > 0) {
    return provider === "fallback" ? "fallback" : "yandex";
  }

  if (localCount > 0) {
    return "local";
  }

  return provider;
}

export function getLiveGeocoderUxMessage(params: {
  status: LiveGeocoderStatus;
  suggestionCount: number;
  source: LiveGeocoderSuggestionsSource;
  hasLocalFallback: boolean;
  errorMessage?: string | null;
}): string | null {
  const { status, suggestionCount, source } = params;

  if (status === "loading") {
    return "Ищем адрес...";
  }

  if (status === "provider_unavailable") {
    return "Сервис подсказок временно недоступен";
  }

  if (status === "error") {
    // The raw message is a chain of internal provider failures
    // ("geosuggest-http: ... | ymaps.suggest: ..."), which must never reach
    // the customer — they get an actionable sentence instead.
    return "Не удалось получить подсказки. Введите адрес полностью или выберите точку на карте";
  }

  if (source === "mixed" && suggestionCount > 0) {
    return "Выберите подходящий адрес";
  }

  if (status === "ready" && suggestionCount > 0) {
    return "Выберите подходящий адрес";
  }

  // Providers answered and none of them knows this address. Saying so
  // explicitly stops the dropdown from looking like it is still working.
  if (status === "no_results" || (status !== "idle" && suggestionCount === 0)) {
    return "Адрес не найден. Уточните улицу и номер дома или выберите точку на карте";
  }

  return null;
}

export function getLiveGeocoderSecondaryMessage(params: {
  status: LiveGeocoderStatus;
  source: LiveGeocoderSuggestionsSource;
  hasLocalFallback: boolean;
}): string | null {
  if (
    (params.status === "provider_unavailable" || params.status === "error") &&
    params.hasLocalFallback
  ) {
    return "Показаны локальные подсказки";
  }

  if (params.source === "local" && params.status !== "provider_unavailable") {
    return null;
  }

  return null;
}
