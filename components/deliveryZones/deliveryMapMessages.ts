// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Карта — сообщение о недоступности
// ==================================================

import {
  getYandexGeoSuggestApiKey,
  getYandexGeocoderApiKey,
  getYandexMapsApiKey,
} from "@/components/maps/mapProviderConfig";

export const MAP_LOAD_ERROR_MESSAGE =
  "Карта недоступна — введите адрес, доставка рассчитается автоматически.";

export function resolveYandexMapUnavailableReason(): string {
  if (!getYandexMapsApiKey()) {
    return "NEXT_PUBLIC_YANDEX_MAPS_API_KEY не настроен в .env.local";
  }

  return "Проверьте ключ Yandex Maps и ограничения Referer в кабинете разработчика.";
}

export function resolveYandexSuggestUnavailableReason(): string {
  if (!getYandexGeoSuggestApiKey()) {
    return "NEXT_PUBLIC_YANDEX_GEOSUGGEST_API_KEY не настроен в .env.local";
  }

  return "Сервис подсказок Yandex GeoSuggest недоступен.";
}

export function resolveYandexGeocoderUnavailableReason(): string {
  if (!getYandexGeocoderApiKey()) {
    return "NEXT_PUBLIC_YANDEX_GEOCODER_API_KEY не настроен в .env.local";
  }

  return "Сервис геокодирования Yandex недоступен.";
}
