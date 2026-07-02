// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import {
  formatAverageSpeedKmh,
  formatProviderEta,
  formatTrafficDelaySeconds,
  getTrafficDelayLevelLabel,
  isTrafficDelayOverFifteenMinutes,
  isTrafficDelayOverTwentyPercent,
  type TrafficDelayLevel,
} from "@/components/maps/providerEta";
import type { CourierRouteDistancePlan } from "@/components/maps/distanceTypes";
import { formatEstimatedMinutes } from "@/components/maps/etaCalculator";
import type { CourierRouteLine } from "@/components/maps/routeLineTypes";
import { formatRouteDistanceMeters } from "@/components/maps/yandexRoutingTypes";
import type { YandexCourierRoute } from "@/components/maps/yandexRoutingTypes";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type CourierTrafficEtaView = {
  courierId: string;
  courierName: string;
  color: string;
  roadRoute?: YandexCourierRoute;
  localEtaMinutes: number | null;
  warnings: string[];
  etaWithoutTrafficLabel: string;
  etaWithTrafficLabel: string;
  usesLocalFallback: boolean;
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function buildCourierWarnings(
  roadRoute: YandexCourierRoute | undefined,
  hasBuildableRoute: boolean,
): string[] {
  const warnings: string[] = [];

  if (!hasBuildableRoute) {
    warnings.push("Not enough geocoded points for a road route.");
    return warnings;
  }

  if (!roadRoute || roadRoute.status !== "ready") {
    warnings.push("Road route is missing or not ready.");
  }

  if (roadRoute?.status === "fallback") {
    warnings.push("Provider traffic data is unavailable.");
  }

  if (
    isTrafficDelayOverFifteenMinutes(roadRoute?.trafficDelaySeconds)
  ) {
    warnings.push("Traffic delay exceeds 15 minutes.");
  }

  if (
    isTrafficDelayOverTwentyPercent(
      roadRoute?.trafficDelaySeconds,
      roadRoute?.providerDurationSeconds,
    )
  ) {
    warnings.push("Traffic delay exceeds 20% of base ETA.");
  }

  return warnings;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildCourierTrafficEtaViews(
  routeLines: CourierRouteLine[],
  realRouteLines: Record<string, YandexCourierRoute>,
  courierDistancePlans: CourierRouteDistancePlan[],
): CourierTrafficEtaView[] {
  const distancePlanByCourierId = new Map(
    courierDistancePlans.map((plan) => [plan.courierId, plan]),
  );

  return routeLines.map((routeLine) => {
    const roadRoute = realRouteLines[routeLine.courierId];
    const distancePlan = distancePlanByCourierId.get(routeLine.courierId);
    const localEtaMinutes = distancePlan?.totalEstimatedMinutes ?? null;
    const providerDurationSeconds =
      roadRoute?.providerDurationSeconds ?? roadRoute?.durationSeconds ?? null;
    const providerDurationWithTrafficSeconds =
      roadRoute?.providerDurationWithTrafficSeconds ??
      providerDurationSeconds;
    const usesLocalFallback =
      roadRoute?.status !== "ready" ||
      providerDurationSeconds === null;

    return {
      courierId: routeLine.courierId,
      courierName: routeLine.courierName,
      color: routeLine.color,
      roadRoute,
      localEtaMinutes,
      warnings: buildCourierWarnings(roadRoute, routeLine.points.length >= 2),
      etaWithoutTrafficLabel: usesLocalFallback
        ? formatEstimatedMinutes(localEtaMinutes)
        : formatProviderEta(providerDurationSeconds),
      etaWithTrafficLabel: usesLocalFallback
        ? formatEstimatedMinutes(localEtaMinutes)
        : formatProviderEta(providerDurationWithTrafficSeconds),
      usesLocalFallback,
    };
  });
}

export function getTrafficDelayLevelClass(
  level: TrafficDelayLevel | undefined,
): string {
  switch (level) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    case "none":
    default:
      return "none";
  }
}

export {
  formatAverageSpeedKmh,
  formatProviderEta,
  formatRouteDistanceMeters,
  formatTrafficDelaySeconds,
  getTrafficDelayLevelLabel,
};
