// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Official Yandex suggest() adapter for live checkout address autocomplete.
//
// Назначение (RU):
// Адаптер официального Yandex suggest() для живых подсказок адреса в оформлении.
// ==================================================
import { prioritizeYandexLiveSuggestions } from "@/components/addressIntelligence/yandexAddressPriority";
import type { LiveGeocoderFetchResult } from "@/components/addressIntelligence/liveGeocoderTypes";
import { isYandexSuggestEnabled } from "@/components/maps/mapProviderRegistry";
import { normalizeAddressForYandexGeocoding } from "@/components/maps/geocodingNormalize";
import { suggestWithYandexMapsSdk } from "@/components/maps/yandexJsSuggest";
import { mapYandexSuggestItemToSuggestion } from "@/components/maps/yandexSuggestMappers";

const MAX_SUGGESTIONS = 10;
const MIN_QUERY_LENGTH = 2;

export async function fetchYandexAddressSuggestions(
  input: string,
  options?: { signal?: AbortSignal },
): Promise<LiveGeocoderFetchResult> {
  const normalizedInput = normalizeAddressForYandexGeocoding(input);

  if (!normalizedInput || normalizedInput.length < MIN_QUERY_LENGTH) {
    return {
      status: "idle",
      suggestions: [],
      errorMessage: null,
      provider: "fallback",
    };
  }

  if (typeof window === "undefined") {
    return {
      status: "provider_unavailable",
      suggestions: [],
      errorMessage: "Yandex suggest requires a browser environment.",
      provider: "fallback",
    };
  }

  if (!isYandexSuggestEnabled()) {
    return {
      status: "provider_unavailable",
      suggestions: [],
      errorMessage: "Yandex GeoSuggest is not configured.",
      provider: "fallback",
    };
  }

  try {
    const items = await suggestWithYandexMapsSdk(normalizedInput, {
      results: MAX_SUGGESTIONS,
      signal: options?.signal,
    });

    if (options?.signal?.aborted) {
      return {
        status: "idle",
        suggestions: [],
        errorMessage: null,
        provider: "yandex",
      };
    }

    const suggestions = prioritizeYandexLiveSuggestions(
      items
        .map((item, index) => mapYandexSuggestItemToSuggestion(item, index))
        .filter((suggestion) => suggestion !== null),
    );

    if (suggestions.length === 0) {
      return {
        status: "no_results",
        suggestions: [],
        errorMessage: null,
        provider: "yandex",
      };
    }

    return {
      status: "ready",
      suggestions,
      errorMessage: null,
      provider: "yandex",
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        status: "idle",
        suggestions: [],
        errorMessage: null,
        provider: "yandex",
      };
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Yandex suggest request failed.";

    if (process.env.NODE_ENV !== "production") {
      console.warn("[yandex-suggest]", errorMessage);
    }

    return {
      status: "error",
      suggestions: [],
      errorMessage,
      provider: "yandex",
    };
  }
}
