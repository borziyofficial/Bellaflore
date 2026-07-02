// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import {
  buildRoutePlanningPlan,
  type RoutePlanningCourierRoute,
  type RoutePlanningStop,
} from "@/components/admin/adminRoutePlanning";
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import { calculateStraightLineDistanceKm } from "@/components/maps/distanceCalculator";
import type {
  CourierRouteDistancePlan,
  DistanceLeg,
  RouteDistancePlan,
  RouteDistancePlanSummary,
} from "@/components/maps/distanceTypes";
import { estimateTravelMinutes } from "@/components/maps/etaCalculator";
import {
  buildMapsFoundationData,
  type GeocodingOverrides,
  type OrderMapPoint,
} from "@/components/maps/orderMapData";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function sumNullableNumbers(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0);
}

function buildDistanceLeg(
  fromStop: RoutePlanningStop,
  toStop: RoutePlanningStop,
  fromPoint: OrderMapPoint | undefined,
  toPoint: OrderMapPoint | undefined,
): DistanceLeg {
  const updatedAt = new Date().toISOString();
  const fromCoordinates = fromPoint?.coordinates ?? null;
  const toCoordinates = toPoint?.coordinates ?? null;

  if (!fromCoordinates || !toCoordinates) {
    return {
      fromOrderId: fromStop.order.orderId,
      toOrderId: toStop.order.orderId,
      fromAddress: fromStop.order.deliveryAddress.trim(),
      toAddress: toStop.order.deliveryAddress.trim(),
      distanceKm: null,
      estimatedMinutes: null,
      method: "straight_line",
      status: "missing_coordinates",
      updatedAt,
    };
  }

  const distanceKm = calculateStraightLineDistanceKm(
    fromCoordinates,
    toCoordinates,
  );

  return {
    fromOrderId: fromStop.order.orderId,
    toOrderId: toStop.order.orderId,
    fromAddress: fromStop.order.deliveryAddress.trim(),
    toAddress: toStop.order.deliveryAddress.trim(),
    distanceKm,
    estimatedMinutes: estimateTravelMinutes(distanceKm),
    method: "straight_line",
    status: "calculated",
    updatedAt,
  };
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildCourierRouteDistancePlan(
  route: RoutePlanningCourierRoute,
  pointsByOrderId: Map<string, OrderMapPoint>,
): CourierRouteDistancePlan {
  const legs: DistanceLeg[] = [];

  for (let index = 0; index < route.activeStops.length - 1; index += 1) {
    const fromStop = route.activeStops[index];
    const toStop = route.activeStops[index + 1];

    if (!fromStop || !toStop) {
      continue;
    }

    legs.push(
      buildDistanceLeg(
        fromStop,
        toStop,
        pointsByOrderId.get(fromStop.order.orderId),
        pointsByOrderId.get(toStop.order.orderId),
      ),
    );
  }

  const calculatedLegs = legs.filter((leg) => leg.status === "calculated");
  const missingCoordinateCount = legs.filter(
    (leg) => leg.status === "missing_coordinates",
  ).length;

  return {
    courierId: route.courierId,
    courierName: route.courierName,
    legs,
    totalDistanceKm: sumNullableNumbers(
      calculatedLegs
        .map((leg) => leg.distanceKm)
        .filter((distanceKm): distanceKm is number => distanceKm !== null),
    ),
    totalEstimatedMinutes: sumNullableNumbers(
      calculatedLegs
        .map((leg) => leg.estimatedMinutes)
        .filter(
          (estimatedMinutes): estimatedMinutes is number =>
            estimatedMinutes !== null,
        ),
    ),
    missingCoordinateCount,
  };
}

function buildRouteDistancePlanSummary(
  courierPlans: CourierRouteDistancePlan[],
): RouteDistancePlanSummary {
  const allLegs = courierPlans.flatMap((plan) => plan.legs);
  const calculatedLegs = allLegs.filter((leg) => leg.status === "calculated");

  return {
    courierCount: courierPlans.length,
    totalActiveLegs: allLegs.length,
    calculatedLegs: calculatedLegs.length,
    missingCoordinateLegs: allLegs.filter(
      (leg) => leg.status === "missing_coordinates",
    ).length,
    totalDistanceKm: sumNullableNumbers(
      calculatedLegs
        .map((leg) => leg.distanceKm)
        .filter((distanceKm): distanceKm is number => distanceKm !== null),
    ),
    totalEstimatedMinutes: sumNullableNumbers(
      calculatedLegs
        .map((leg) => leg.estimatedMinutes)
        .filter(
          (estimatedMinutes): estimatedMinutes is number =>
            estimatedMinutes !== null,
        ),
    ),
  };
}

export function buildRouteDistancePlan(
  orders: AdminOrderRecord[],
  geocodingOverrides?: GeocodingOverrides,
  referenceDate: Date = new Date(),
): RouteDistancePlan {
  const routePlan = buildRoutePlanningPlan(orders, referenceDate);
  const mapsData = buildMapsFoundationData(orders, geocodingOverrides);
  const pointsByOrderId = new Map(
    mapsData.points.map((point) => [point.orderId, point]),
  );

  const courierPlans = routePlan.courierRoutes.map((route) =>
    buildCourierRouteDistancePlan(route, pointsByOrderId),
  );

  return {
    courierPlans,
    summary: buildRouteDistancePlanSummary(courierPlans),
  };
}

export function formatDistanceKm(distanceKm: number | null): string {
  if (distanceKm === null) {
    return "—";
  }

  return `${distanceKm.toFixed(1)} km`;
}

export function getDistanceLegStatusLabel(
  status: DistanceLeg["status"],
): string {
  switch (status) {
    case "calculated":
      return "Calculated";
    case "missing_coordinates":
      return "Missing coordinates";
    case "error":
      return "Error";
    default:
      return status;
  }
}
