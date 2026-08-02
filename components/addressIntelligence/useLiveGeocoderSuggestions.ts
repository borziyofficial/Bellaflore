// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Debounced live Yandex suggest hook for checkout address autocomplete.
//
// Назначение (RU):
// Хук с debounce для живых подсказок Yandex suggest при вводе адреса.
// ==================================================
"use client";

import { buildAddressIntelligence } from "@/components/addressIntelligence/addressIntelligenceEngine";
import { normalizeAddressInput } from "@/components/addressIntelligence/addressNormalizer";
import type { AddressSuggestion } from "@/components/addressIntelligence/addressIntelligenceTypes";
import type { AddressIntelligenceStatus } from "@/components/addressIntelligence/addressIntelligenceTypes";
import {
  getCachedLiveGeocoderSuggestions,
  saveCachedLiveGeocoderSuggestions,
} from "@/components/addressIntelligence/liveGeocoderCache";
import {
  getLiveGeocoderSecondaryMessage,
  getLiveGeocoderUxMessage,
  mapLiveGeocoderSuggestionToAddressSuggestion,
  mergeLiveAndLocalSuggestions,
  resolveLiveGeocoderSource,
} from "@/components/addressIntelligence/liveGeocoderMessages";
import type {
  LiveGeocoderStatus,
  LiveGeocoderSuggestionsSource,
} from "@/components/addressIntelligence/liveGeocoderTypes";
import { prioritizeYandexAddressSuggestions } from "@/components/addressIntelligence/yandexAddressPriority";
import { fetchYandexAddressSuggestions } from "@/components/addressIntelligence/yandexLiveGeocoderAdapter";
import { isYandexSuggestEnabled } from "@/components/maps/mapProviderRegistry";
import { useEffect, useMemo, useRef, useState } from "react";

const LIVE_GEOCODER_DEBOUNCE_MS = 280;
const MIN_QUERY_LENGTH = 2;
// Hard ceiling on how long the suggestion dropdown stays in a "loading"
// state before falling back to a definitive error. The HTTP proxy and SDK
// calls underneath have their own timeouts too, but this guarantees
// "Ищем адрес…" can never spin forever regardless of how many fallback
// layers are attempted internally.
const LIVE_GEOCODER_OVERALL_TIMEOUT_MS = 9_000;

function withOverallTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => T,
): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timerId = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(onTimeout());
    }, timeoutMs);

    promise.then((value) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timerId);
      resolve(value);
    });
  });
}

type FetchGeocoderState = {
  queryKey: string;
  status: LiveGeocoderStatus;
  errorMessage: string | null;
  source: LiveGeocoderSuggestionsSource;
  liveSuggestions: AddressSuggestion[];
};

export type UseLiveGeocoderSuggestionsResult = {
  suggestions: AddressSuggestion[];
  status: LiveGeocoderStatus;
  errorMessage: string | null;
  source: LiveGeocoderSuggestionsSource;
  isLoading: boolean;
  isQueryReady: boolean;
  uxMessage: string | null;
  secondaryMessage: string | null;
  localWarnings: string[];
  localErrors: string[];
  intelligenceStatus: AddressIntelligenceStatus;
};

export function useLiveGeocoderSuggestions(
  input: string,
): UseLiveGeocoderSuggestionsResult {
  const yandexEnabled = isYandexSuggestEnabled();
  const [debouncedInput, setDebouncedInput] = useState(input);
  const [fetchState, setFetchState] = useState<FetchGeocoderState | null>(null);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedInput(input);
    }, LIVE_GEOCODER_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [input]);

  const normalizedInput = useMemo(
    () => normalizeAddressInput(debouncedInput).normalizedInput,
    [debouncedInput],
  );
  const isQueryReady = normalizedInput.length >= MIN_QUERY_LENGTH;

  const cachedEntry = useMemo(() => {
    if (!isQueryReady) {
      return null;
    }

    const entry = getCachedLiveGeocoderSuggestions(normalizedInput);
    if (!entry) {
      return null;
    }

    return entry;
  }, [isQueryReady, normalizedInput]);

  const cachedLiveSuggestions = useMemo(
    () =>
      cachedEntry?.suggestions.map(mapLiveGeocoderSuggestionToAddressSuggestion) ??
      [],
    [cachedEntry],
  );

  const localIntelligence = useMemo(
    () => buildAddressIntelligence(debouncedInput),
    [debouncedInput],
  );

  useEffect(() => {
    if (!yandexEnabled || !isQueryReady || cachedLiveSuggestions.length > 0) {
      return;
    }

    const queryKey = normalizedInput;
    const requestSequence = ++requestSequenceRef.current;
    const abortController = new AbortController();
    let cancelled = false;

    void Promise.resolve().then(() => {
      if (cancelled || requestSequence !== requestSequenceRef.current) {
        return;
      }

      setFetchState({
        queryKey,
        status: "loading",
        errorMessage: null,
        source: "yandex",
        liveSuggestions: [],
      });
    });

    void withOverallTimeout(
      fetchYandexAddressSuggestions(queryKey, {
        signal: abortController.signal,
      }),
      LIVE_GEOCODER_OVERALL_TIMEOUT_MS,
      () => {
        abortController.abort();
        return {
          status: "error" as const,
          suggestions: [],
          // null falls through to the existing Russian default message
          // ("Сервис подсказок временно недоступен") in getLiveGeocoderUxMessage.
          errorMessage: null,
          provider: "yandex" as const,
        };
      },
    ).then((result) => {
      if (cancelled || requestSequence !== requestSequenceRef.current) {
        return;
      }

      if (result.status === "idle") {
        return;
      }

      const mappedLiveSuggestions = prioritizeYandexAddressSuggestions(
        result.suggestions.map(mapLiveGeocoderSuggestionToAddressSuggestion),
      );

      if (result.status === "ready" && mappedLiveSuggestions.length > 0) {
        saveCachedLiveGeocoderSuggestions({
          normalizedInput: queryKey,
          suggestions: result.suggestions,
          status: result.status,
          provider: result.provider,
          cachedAt: new Date().toISOString(),
        });
      }

      setFetchState({
        queryKey,
        status: result.status,
        errorMessage: result.errorMessage,
        source: result.provider,
        liveSuggestions: mappedLiveSuggestions,
      });
    });

    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [
    cachedLiveSuggestions.length,
    isQueryReady,
    normalizedInput,
    yandexEnabled,
  ]);

  const activeFetchState =
    fetchState?.queryKey === normalizedInput ? fetchState : null;

  const liveSuggestions = useMemo(() => {
    if (!yandexEnabled || !isQueryReady) {
      return [];
    }

    if (cachedLiveSuggestions.length > 0) {
      return prioritizeYandexAddressSuggestions(cachedLiveSuggestions);
    }

    return activeFetchState?.liveSuggestions ?? [];
  }, [
    activeFetchState?.liveSuggestions,
    cachedLiveSuggestions,
    isQueryReady,
    yandexEnabled,
  ]);

  const status: LiveGeocoderStatus = !yandexEnabled
    ? "provider_unavailable"
    : !isQueryReady
      ? "idle"
      : cachedLiveSuggestions.length > 0
        ? "ready"
        : (activeFetchState?.status ?? "idle");

  const errorMessage = isQueryReady
    ? cachedLiveSuggestions.length > 0
      ? null
      : (activeFetchState?.errorMessage ?? null)
    : null;

  const source: LiveGeocoderSuggestionsSource = !yandexEnabled
    ? "fallback"
    : !isQueryReady
      ? "fallback"
      : cachedLiveSuggestions.length > 0
        ? "cache"
        : (activeFetchState?.source ?? "fallback");

  const suggestions = useMemo(() => {
    if (yandexEnabled) {
      return prioritizeYandexAddressSuggestions(liveSuggestions);
    }

    return prioritizeYandexAddressSuggestions(
      mergeLiveAndLocalSuggestions([], localIntelligence.suggestions),
    );
  }, [liveSuggestions, localIntelligence.suggestions, yandexEnabled]);

  const resolvedSource = resolveLiveGeocoderSource(
    liveSuggestions.length,
    0,
    source === "cache",
    source,
  );

  const uxMessage = getLiveGeocoderUxMessage({
    status,
    suggestionCount: suggestions.length,
    source: resolvedSource,
    hasLocalFallback: false,
    errorMessage,
  });
  const secondaryMessage =
    getLiveGeocoderSecondaryMessage({
      status,
      source: resolvedSource,
      hasLocalFallback: false,
    }) ?? (status === "error" ? errorMessage : null);

  return {
    suggestions,
    status,
    errorMessage,
    source: resolvedSource,
    isLoading: status === "loading",
    isQueryReady,
    uxMessage,
    secondaryMessage,
    localWarnings: yandexEnabled ? localIntelligence.warnings : [],
    localErrors: yandexEnabled ? localIntelligence.errors : [],
    intelligenceStatus: yandexEnabled
      ? localIntelligence.status
      : "needs_more_details",
  };
}
