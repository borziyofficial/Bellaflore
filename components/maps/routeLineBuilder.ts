// ==================================================
// SECTION: MAPS
// РАЗДЕЛ: Карты
//
// Purpose (EN): Geocoding, routing, ETA, and Yandex Maps provider integration.
//
// Назначение (RU): Геокодирование, маршруты, ETA и интеграция с Yandex Maps.
// ==================================================
import type { RoutePlanningCourierRoute } from "@/components/admin/adminRoutePlanning";
import { getCourierMapColor } from "@/components/maps/courierMapColors";
import type { CourierRouteDistancePlan } from "@/components/maps/distanceTypes";
import type { OrderMapPoint } from "@/components/maps/orderMapData";
import type {
  CourierRouteLine,
  RouteLineCourierFilter,
  RouteLinePoint,
  RouteLineStatus,
} from "@/components/maps/routeLineTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function resolveRouteLineStatus(
  orderIds: string[],
  points: RouteLinePoint[],
  missingCoordinateOrderIds: string[],
): RouteLineStatus {
  if (orderIds.length === 0) {
    return "empty";
  }

  if (missingCoordinateOrderIds.length > 0) {
    return "incomplete";
  }

  if (points.length < 2) {
    return "empty";
  }

  return "ready";
}

function buildSingleCourierRouteLine(
  route: RoutePlanningCourierRoute,
  pointsByOrderId: Map<string, OrderMapPoint>,
): CourierRouteLine {
  const orderIds = route.activeStops.map((stop) => stop.order.orderId);
  const missingCoordinateOrderIds: string[] = [];
  const points: RouteLinePoint[] = [];

  for (const orderId of orderIds) {
    const mapPoint = pointsByOrderId.get(orderId);
    const coordinates = mapPoint?.coordinates;

    if (!coordinates) {
      missingCoordinateOrderIds.push(orderId);
      continue;
    }

    points.push({
      orderId,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    });
  }

  return {
    courierId: route.courierId,
    courierName: route.courierName,
    color: getCourierMapColor(route.courierId),
    points,
    orderIds,
    missingCoordinateOrderIds,
    status: resolveRouteLineStatus(orderIds, points, missingCoordinateOrderIds),
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
export function buildCourierRouteLines(
  routeDistancePlans: CourierRouteDistancePlan[],
  mapPoints: OrderMapPoint[],
  courierRoutes: RoutePlanningCourierRoute[],
): CourierRouteLine[] {
  const pointsByOrderId = new Map(
    mapPoints.map((point) => [point.orderId, point]),
  );
  const plannedCourierIds = new Set(
    routeDistancePlans.map((plan) => plan.courierId),
  );

  return courierRoutes
    .filter(
      (route) =>
        plannedCourierIds.size === 0 || plannedCourierIds.has(route.courierId),
    )
    .map((route) => buildSingleCourierRouteLine(route, pointsByOrderId));
}

export function filterCourierRouteLines(
  routeLines: CourierRouteLine[],
  courierFilter: RouteLineCourierFilter,
): CourierRouteLine[] {
  if (courierFilter === "all") {
    return routeLines;
  }

  if (courierFilter === "unassigned") {
    return routeLines.filter((line) => line.courierId === "unassigned");
  }

  return routeLines.filter((line) => line.courierId === courierFilter);
}
