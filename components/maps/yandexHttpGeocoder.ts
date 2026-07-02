// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Client fetch to BellaFlore Yandex search/v2 geocode proxy.
//
// Назначение (RU):
// Клиентский запрос к прокси геокодера Yandex search/v2 BellaFlore.
// ==================================================
export type YandexHttpGeocodeResult = {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  precision?: string;
};

type YandexHttpGeocodeResponse = {
  results?: YandexHttpGeocodeResult[];
  error?: string;
  yandexStatus?: number;
};

export async function fetchYandexGeocodeViaApiProxy(
  query: string,
  options?: { signal?: AbortSignal; uri?: string | null },
): Promise<YandexHttpGeocodeResult[]> {
  const params = new URLSearchParams({
    geocode: query,
  });

  if (options?.uri) {
    params.set("uri", options.uri);
  }

  const response = await fetch(`/api/yandex-geocode?${params.toString()}`, {
    method: "GET",
    signal: options?.signal,
    cache: "no-store",
  });

  const payload = (await response.json()) as YandexHttpGeocodeResponse;

  if (!response.ok) {
    return [];
  }

  return payload.results ?? [];
}

export async function fetchYandexGeocodeByUriViaApiProxy(
  uri: string,
  options?: { signal?: AbortSignal },
): Promise<YandexHttpGeocodeResult[]> {
  const params = new URLSearchParams({
    uri,
  });

  const response = await fetch(`/api/yandex-geocode?${params.toString()}`, {
    method: "GET",
    signal: options?.signal,
    cache: "no-store",
  });

  const payload = (await response.json()) as YandexHttpGeocodeResponse;

  if (!response.ok) {
    return [];
  }

  return payload.results ?? [];
}

export async function fetchYandexRetrieveViaApiProxy(
  uri: string,
  options?: { signal?: AbortSignal },
): Promise<YandexHttpGeocodeResult | null> {
  const params = new URLSearchParams({
    uri,
  });

  const response = await fetch(`/api/yandex-retrieve?${params.toString()}`, {
    method: "GET",
    signal: options?.signal,
    cache: "no-store",
  });

  const payload = (await response.json()) as {
    result?: YandexHttpGeocodeResult | null;
    error?: string;
  };

  if (!response.ok) {
    return null;
  }

  return payload.result ?? null;
}
