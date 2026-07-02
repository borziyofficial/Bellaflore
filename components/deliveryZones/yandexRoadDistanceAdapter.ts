// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Зоны доставки
//
// Purpose (EN): MKAD zone detection, pricing, and road-distance calculations.
//
// Назначение (RU): Определение зон МКАД, тарифы и расчёт дорожного расстояния.
// ==================================================
import {
  getCachedRoadDistanceZone,
  saveCachedRoadDistanceZone,
} from "@/components/deliveryZones/roadDistanceZoneCache";
import type {
  CalculateYandexRoadDistanceParams,
  RoadDistanceZoneResult,
} from "@/components/deliveryZones/roadDistanceZoneTypes";
import { requestYandexRouteBetweenPoints } from "@/components/maps/yandexRouteAdapter";
import { isYandexMapsPreviewEnabled } from "@/components/maps/mapProviderRegistry";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function buildRoadDistanceResult(
  partial: Omit<RoadDistanceZoneResult, "calculatedAt">,
): RoadDistanceZoneResult {
  return {
    ...partial,
    calculatedAt: new Date().toISOString(),
  };
}

function isValidCoordinate(point: {
  latitude: number;
  longitude: number;
}): boolean {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude)
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
export async function calculateYandexRoadDistanceFromBoundary(
  params: CalculateYandexRoadDistanceParams,
): Promise<RoadDistanceZoneResult> {
  const { fromBoundaryPoint, toCustomerPoint } = params;

  if (
    !isValidCoordinate(fromBoundaryPoint) ||
    !isValidCoordinate(toCustomerPoint)
  ) {
    return buildRoadDistanceResult({
      fromBoundaryPoint,
      toCustomerPoint,
      roadDistanceKm: null,
      roadDurationMinutes: null,
      provider: "fallback",
      status: "missing_coordinates",
      errorMessage: "Boundary or customer coordinates are missing.",
    });
  }

  const cachedResult = getCachedRoadDistanceZone(
    fromBoundaryPoint,
    toCustomerPoint,
  );
  if (cachedResult) {
    return cachedResult;
  }

  if (!isYandexMapsPreviewEnabled()) {
    return buildRoadDistanceResult({
      fromBoundaryPoint,
      toCustomerPoint,
      roadDistanceKm: null,
      roadDurationMinutes: null,
      provider: "fallback",
      status: "fallback_to_approx",
      errorMessage: "Yandex routing provider or API key is unavailable.",
    });
  }

  try {
    const routeMetrics = await requestYandexRouteBetweenPoints(
      fromBoundaryPoint,
      toCustomerPoint,
      { includeTraffic: true },
    );

    if (
      routeMetrics.distanceMeters === null ||
      !Number.isFinite(routeMetrics.distanceMeters)
    ) {
      return buildRoadDistanceResult({
        fromBoundaryPoint,
        toCustomerPoint,
        roadDistanceKm: null,
        roadDurationMinutes: null,
        provider: "fallback",
        status: "fallback_to_approx",
        errorMessage: "Yandex routing returned no road distance.",
      });
    }

    const durationSeconds =
      routeMetrics.durationWithTrafficSeconds ??
      routeMetrics.durationSeconds;

    const result = buildRoadDistanceResult({
      fromBoundaryPoint,
      toCustomerPoint,
      roadDistanceKm: routeMetrics.distanceMeters / 1000,
      roadDurationMinutes:
        durationSeconds !== null && Number.isFinite(durationSeconds)
          ? durationSeconds / 60
          : null,
      provider: "yandex",
      status: "ready",
    });

    saveCachedRoadDistanceZone(result);
    return result;
  } catch (error) {
    return buildRoadDistanceResult({
      fromBoundaryPoint,
      toCustomerPoint,
      roadDistanceKm: null,
      roadDurationMinutes: null,
      provider: "fallback",
      status: "provider_error",
      errorMessage:
        error instanceof Error
          ? error.message
          : "Yandex routing request failed.",
    });
  }
}
