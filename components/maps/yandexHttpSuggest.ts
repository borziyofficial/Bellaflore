// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Client fetch to BellaFlore Geosuggest proxy and HTTP response normalization.
//
// Назначение (RU):
// Клиентский запрос к прокси Geosuggest BellaFlore и нормализация HTTP-ответа.
// ==================================================
import type { YandexSuggestItem } from "@/components/maps/yandexMapsApi.types";
import { normalizeAddressForYandexGeocoding } from "@/components/maps/geocodingNormalize";

type YandexHttpSuggestText = {
  text?: string;
};

type YandexHttpSuggestResult = {
  title?: YandexHttpSuggestText;
  subtitle?: YandexHttpSuggestText;
  address?: {
    formatted_address?: string;
  };
  uri?: string;
};

type YandexHttpSuggestResponse = {
  results?: YandexHttpSuggestResult[];
  error?: string;
  yandexStatus?: number;
};

function mapHttpSuggestResultToItem(
  result: YandexHttpSuggestResult,
): YandexSuggestItem | null {
  const title = result.title?.text?.trim();
  if (!title) {
    return null;
  }

  const subtitle = result.subtitle?.text?.trim();
  const formattedAddress = result.address?.formatted_address?.trim();
  const value =
    formattedAddress ||
    (subtitle ? `${subtitle}, ${title}` : title);

  return {
    displayName: title,
    value,
    uri: result.uri?.trim() || undefined,
  };
}

export async function fetchYandexSuggestViaApiProxy(
  query: string,
  options?: { signal?: AbortSignal },
): Promise<YandexSuggestItem[]> {
  const biasedQuery = normalizeAddressForYandexGeocoding(query);
  const params = new URLSearchParams({
    text: biasedQuery,
  });

  const response = await fetch(`/api/yandex-suggest?${params.toString()}`, {
    method: "GET",
    signal: options?.signal,
    cache: "no-store",
  });

  const payload = (await response.json()) as YandexHttpSuggestResponse;

  if (!response.ok) {
    throw new Error(
      payload.error ?? `Yandex Geosuggest proxy failed (${response.status}).`,
    );
  }

  return (payload.results ?? [])
    .map((result) => mapHttpSuggestResultToItem(result))
    .filter((item): item is YandexSuggestItem => item !== null);
}
