// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Last-resort geocoding via local Nominatim proxy when Yandex Geocoder fails.
//
// Назначение (RU):
// Резервное геокодирование через локальный Nominatim-прокси при сбое Yandex Geocoder.
// ==================================================
import type { YandexHttpGeocodeResult } from "@/components/maps/yandexHttpGeocoder";

type NominatimFallbackResponse = {
  results?: YandexHttpGeocodeResult[];
  error?: string;
};

export async function fetchAddressGeocodeFallback(
  query: string,
  options?: { signal?: AbortSignal },
): Promise<YandexHttpGeocodeResult[]> {
  const params = new URLSearchParams({
    q: query,
  });

  const response = await fetch(
    `/api/address-geocode-fallback?${params.toString()}`,
    {
      method: "GET",
      signal: options?.signal,
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as NominatimFallbackResponse;

  if (!response.ok) {
    return [];
  }

  return payload.results ?? [];
}
