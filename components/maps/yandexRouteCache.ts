// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import type { YandexCourierRoute } from "@/components/maps/yandexRoutingTypes";
import type { CourierRouteLine } from "@/components/maps/routeLineTypes";

export const YANDEX_ROUTE_CACHE_STORAGE_KEY = "bellaflore_yandex_route_cache_v1";

type YandexRouteCacheStore = Record<string, YandexCourierRoute>;


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function readCacheStore(): YandexRouteCacheStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(YANDEX_ROUTE_CACHE_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }

    return parsedValue as YandexRouteCacheStore;
  } catch {
    return {};
  }
}

function writeCacheStore(store: YandexRouteCacheStore): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    YANDEX_ROUTE_CACHE_STORAGE_KEY,
    JSON.stringify(store),
  );
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildYandexRouteCacheKey(routeLine: CourierRouteLine): string {
  const coordinatesHash = routeLine.points
    .map(
      (point) =>
        `${point.orderId}:${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`,
    )
    .join("|");

  return `${routeLine.courierId}:${routeLine.orderIds.join(",")}:${coordinatesHash}`;
}

export function readYandexRouteCacheEntry(
  cacheKey: string,
): YandexCourierRoute | null {
  if (!cacheKey) {
    return null;
  }

  return readCacheStore()[cacheKey] ?? null;
}

export function writeYandexRouteCacheEntry(
  cacheKey: string,
  route: YandexCourierRoute,
): void {
  if (!cacheKey) {
    return;
  }

  const store = readCacheStore();
  store[cacheKey] = route;
  writeCacheStore(store);
}
