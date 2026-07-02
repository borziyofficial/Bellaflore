// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import {
  calculateAverageSpeedKmh,
  calculateTrafficDelay,
  getTrafficDelayLevel,
  type TrafficDelayLevel,
} from "@/components/maps/providerEta";
import type { YandexCourierRoute } from "@/components/maps/yandexRoutingTypes";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function enrichCourierRouteWithProviderEta(
  route: YandexCourierRoute,
): YandexCourierRoute {
  const providerDistanceMeters =
    route.providerDistanceMeters ?? route.distanceMeters;
  const providerDurationSeconds =
    route.providerDurationSeconds ?? route.durationSeconds;
  const providerDurationWithTrafficSeconds =
    route.providerDurationWithTrafficSeconds ??
    providerDurationSeconds ??
    route.durationSeconds;

  const trafficDelaySeconds = calculateTrafficDelay(
    providerDurationSeconds,
    providerDurationWithTrafficSeconds,
  );
  const averageSpeedKmh = calculateAverageSpeedKmh(
    providerDistanceMeters,
    providerDurationWithTrafficSeconds ?? providerDurationSeconds,
  );
  const trafficDelayLevel: TrafficDelayLevel = getTrafficDelayLevel(
    trafficDelaySeconds,
    providerDurationSeconds,
  );

  return {
    ...route,
    providerDistanceMeters,
    providerDurationSeconds,
    providerDurationWithTrafficSeconds,
    averageSpeedKmh,
    trafficDelaySeconds,
    trafficDelayLevel,
    providerUpdatedAt: route.providerUpdatedAt ?? route.updatedAt,
  };
}
