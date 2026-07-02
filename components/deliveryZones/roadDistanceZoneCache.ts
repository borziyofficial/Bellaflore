// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Зоны доставки
//
// Purpose (EN): MKAD zone detection, pricing, and road-distance calculations.
//
// Назначение (RU): Определение зон МКАД, тарифы и расчёт дорожного расстояния.
// ==================================================
import type { GeoCoordinate } from "@/components/maps/distanceTypes";
import type { RoadDistanceZoneResult } from "@/components/deliveryZones/roadDistanceZoneTypes";

export const ROAD_DISTANCE_ZONE_CACHE_STORAGE_KEY =
  "bellaflore_road_distance_zone_cache_v1";

type RoadDistanceZoneCacheStore = Record<string, RoadDistanceZoneResult>;


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function roundCoordinate(value: number): string {
  return value.toFixed(5);
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildRoadDistanceZoneCacheKey(
  fromBoundaryPoint: GeoCoordinate,
  toCustomerPoint: GeoCoordinate,
): string {
  return [
    roundCoordinate(fromBoundaryPoint.latitude),
    roundCoordinate(fromBoundaryPoint.longitude),
    "->",
    roundCoordinate(toCustomerPoint.latitude),
    roundCoordinate(toCustomerPoint.longitude),
  ].join(",");
}

function readCacheStore(): RoadDistanceZoneCacheStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(
      ROAD_DISTANCE_ZONE_CACHE_STORAGE_KEY,
    );
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }

    return parsedValue as RoadDistanceZoneCacheStore;
  } catch {
    return {};
  }
}

function writeCacheStore(store: RoadDistanceZoneCacheStore): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ROAD_DISTANCE_ZONE_CACHE_STORAGE_KEY,
    JSON.stringify(store),
  );
}

export function getCachedRoadDistanceZone(
  fromBoundaryPoint: GeoCoordinate,
  toCustomerPoint: GeoCoordinate,
): RoadDistanceZoneResult | null {
  const cacheKey = buildRoadDistanceZoneCacheKey(
    fromBoundaryPoint,
    toCustomerPoint,
  );

  return readCacheStore()[cacheKey] ?? null;
}

export function saveCachedRoadDistanceZone(
  result: RoadDistanceZoneResult,
): void {
  const cacheKey = buildRoadDistanceZoneCacheKey(
    result.fromBoundaryPoint,
    result.toCustomerPoint,
  );
  const store = readCacheStore();
  store[cacheKey] = result;
  writeCacheStore(store);
}

export function clearRoadDistanceZoneCache(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ROAD_DISTANCE_ZONE_CACHE_STORAGE_KEY);
}
