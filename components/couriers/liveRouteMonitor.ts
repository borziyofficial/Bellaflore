// ==================================================
// SECTION: COURIERS
// РАЗДЕЛ: Курьеры
//
// Purpose (EN):
// Live route monitoring engine — stop progress, delays, and alerts.
//
// Назначение (RU):
// Движок live-мониторинга маршрутов — прогресс остановок, задержки и алерты.
// ==================================================
import type { LiveCourierMapMarker } from "@/components/couriers/liveCourierMapData";
import { LIVE_ROUTE_MONITORING_CONFIG } from "@/components/couriers/liveRouteMonitoringConfig";
import type {
  LiveRouteCourierMonitoring,
  LiveRouteDeviationStatus,
  LiveRouteMonitoringData,
  LiveRouteMonitoringLocation,
  LiveRouteMovementStatus,
} from "@/components/couriers/liveRouteMonitoringTypes";
import { calculateStraightLineDistanceKm } from "@/components/maps/distanceCalculator";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";
import type { RouteDistancePlan } from "@/components/maps/distanceTypes";
import { estimateTravelMinutes } from "@/components/maps/etaCalculator";
import type { OrderMapPoint } from "@/components/maps/orderMapData";
import type { CourierRouteLine, RouteLinePoint } from "@/components/maps/routeLineTypes";
import type { YandexCourierRoute } from "@/components/maps/yandexRoutingTypes";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN):
// Exported type and interface definitions.
//
// Назначение (RU):
// Экспортируемые типы и интерфейсы.
// ==================================================
export type BuildLiveRouteMonitoringParams = {
  liveCouriers: LiveCourierMapMarker[];
  routeLines: CourierRouteLine[];
  realRoutes: YandexCourierRoute[];
  routeDistancePlan: RouteDistancePlan;
  geocodedPoints: OrderMapPoint[];
  now?: Date;
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN):
// Private helper functions used within this module.
//
// Назначение (RU):
// Приватные вспомогательные функции модуля.
// ==================================================
function resolveMovementStatus(
  speedMetersPerSecond: number | null,
): LiveRouteMovementStatus {
  if (speedMetersPerSecond === null || !Number.isFinite(speedMetersPerSecond)) {
    return "unknown";
  }

  const speedKmh = speedMetersPerSecond * 3.6;

  if (speedKmh <= LIVE_ROUTE_MONITORING_CONFIG.stoppedSpeedKmh) {
    return "stopped";
  }

  return "moving";
}

function resolveRoutePolyline(
  routeLine: CourierRouteLine | undefined,
  realRoute: YandexCourierRoute | undefined,
): RouteLinePoint[] {
  if (
    realRoute?.status === "ready" &&
    realRoute.routeCoordinates.length >= 2
  ) {
    return realRoute.routeCoordinates.map((coordinate, index) => ({
      orderId: realRoute.orderIds[index] ?? `route-point-${index}`,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    }));
  }

  return routeLine?.points ?? [];
}

function distancePointToSegmentKm(
  point: GeoCoordinate,
  segmentStart: GeoCoordinate,
  segmentEnd: GeoCoordinate,
): number {
  let minimumDistanceKm = Number.POSITIVE_INFINITY;

  for (let step = 0; step <= 20; step += 1) {
    const ratio = step / 20;
    const samplePoint: GeoCoordinate = {
      latitude:
        segmentStart.latitude +
        ratio * (segmentEnd.latitude - segmentStart.latitude),
      longitude:
        segmentStart.longitude +
        ratio * (segmentEnd.longitude - segmentStart.longitude),
    };

    minimumDistanceKm = Math.min(
      minimumDistanceKm,
      calculateStraightLineDistanceKm(point, samplePoint),
    );
  }

  return minimumDistanceKm;
}

function minDistanceToPolylineKm(
  point: GeoCoordinate,
  polyline: RouteLinePoint[],
): number | null {
  if (polyline.length === 0) {
    return null;
  }

  if (polyline.length === 1) {
    const firstPoint = polyline[0];
    if (!firstPoint) {
      return null;
    }

    return calculateStraightLineDistanceKm(point, firstPoint);
  }

  let minimumDistanceKm = Number.POSITIVE_INFINITY;

  for (let index = 0; index < polyline.length - 1; index += 1) {
    const segmentStart = polyline[index];
    const segmentEnd = polyline[index + 1];

    if (!segmentStart || !segmentEnd) {
      continue;
    }

    minimumDistanceKm = Math.min(
      minimumDistanceKm,
      distancePointToSegmentKm(point, segmentStart, segmentEnd),
    );
  }

  return Number.isFinite(minimumDistanceKm) ? minimumDistanceKm : null;
}

function resolveRouteDeviationStatus(
  point: GeoCoordinate | null,
  polyline: RouteLinePoint[],
): LiveRouteDeviationStatus {
  if (!point || polyline.length < 2) {
    return "unknown";
  }

  const distanceMeters = (minDistanceToPolylineKm(point, polyline) ?? 0) * 1000;

  if (distanceMeters <= LIVE_ROUTE_MONITORING_CONFIG.slightDeviationMeters) {
    return "on_route";
  }

  if (distanceMeters <= LIVE_ROUTE_MONITORING_CONFIG.offRouteMeters) {
    return "slight_deviation";
  }

  return "off_route";
}

function resolveNextOrderId(
  routeLine: CourierRouteLine | undefined,
  pointsByOrderId: Map<string, OrderMapPoint>,
): string | null {
  if (!routeLine || routeLine.orderIds.length === 0) {
    return null;
  }

  for (const orderId of routeLine.orderIds) {
    const mapPoint = pointsByOrderId.get(orderId);

    if (mapPoint?.coordinates) {
      return orderId;
    }
  }

  return routeLine.orderIds[0] ?? null;
}

function toMonitoringLocation(
  liveCourier: LiveCourierMapMarker,
): LiveRouteMonitoringLocation {
  return {
    latitude: liveCourier.latitude,
    longitude: liveCourier.longitude,
    accuracy: liveCourier.accuracy,
    heading: liveCourier.heading,
    speed: liveCourier.speed,
    capturedAt: liveCourier.capturedAt,
    source: liveCourier.source,
  };
}

function buildCourierMonitoringRecord(params: {
  courierId: string;
  courierName: string;
  liveCourier: LiveCourierMapMarker | undefined;
  routeLine: CourierRouteLine | undefined;
  realRoute: YandexCourierRoute | undefined;
  pointsByOrderId: Map<string, OrderMapPoint>;
  nowMs: number;
}): LiveRouteCourierMonitoring {
  const {
    courierId,
    courierName,
    liveCourier,
    routeLine,
    realRoute,
    pointsByOrderId,
    nowMs,
  } = params;
  const updatedAt = new Date(nowMs).toISOString();
  const activeRouteOrderIds = routeLine?.orderIds ?? [];
  const currentLocation = liveCourier ? toMonitoringLocation(liveCourier) : null;
  const lastLocationAgeSeconds = liveCourier?.ageSeconds ?? null;
  const nextOrderId = resolveNextOrderId(routeLine, pointsByOrderId);
  const nextOrderPoint =
    nextOrderId !== null ? pointsByOrderId.get(nextOrderId) : undefined;
  const warnings: string[] = [];

  if (
    lastLocationAgeSeconds !== null &&
    lastLocationAgeSeconds >= LIVE_ROUTE_MONITORING_CONFIG.staleLocationSeconds
  ) {
    warnings.push("Live GPS is stale");
  }

  let distanceToNextKm: number | null = null;
  let estimatedMinutesToNext: number | null = null;

  if (currentLocation && nextOrderPoint?.coordinates) {
    distanceToNextKm = calculateStraightLineDistanceKm(
      currentLocation,
      nextOrderPoint.coordinates,
    );
    estimatedMinutesToNext = estimateTravelMinutes(distanceToNextKm);
  }

  const movementStatus = resolveMovementStatus(liveCourier?.speed ?? null);

  if (
    movementStatus === "stopped" &&
    lastLocationAgeSeconds !== null &&
    lastLocationAgeSeconds >= LIVE_ROUTE_MONITORING_CONFIG.stoppedAfterSeconds
  ) {
    warnings.push("Courier appears stopped for an extended period");
  }

  const routePolyline = resolveRoutePolyline(routeLine, realRoute);
  const routeDeviationStatus = resolveRouteDeviationStatus(
    currentLocation,
    routePolyline,
  );

  if (routeDeviationStatus === "slight_deviation") {
    warnings.push("Courier has slight route deviation");
  }

  if (routeDeviationStatus === "off_route") {
    warnings.push("Courier is off route");
  }

  return {
    courierId,
    courierName,
    currentLocation,
    activeRouteOrderIds,
    nextOrderId,
    distanceToNextKm,
    estimatedMinutesToNext,
    movementStatus,
    routeDeviationStatus,
    lastLocationAgeSeconds,
    warnings,
    updatedAt,
  };
}

function collectCourierIds(
  routeLines: CourierRouteLine[],
  liveCouriers: LiveCourierMapMarker[],
): string[] {
  const courierIds = new Set<string>();

  for (const routeLine of routeLines) {
    if (routeLine.courierId.trim()) {
      courierIds.add(routeLine.courierId);
    }
  }

  for (const liveCourier of liveCouriers) {
    if (liveCourier.courierId.trim()) {
      courierIds.add(liveCourier.courierId);
    }
  }

  return [...courierIds].sort((firstId, secondId) =>
    firstId.localeCompare(secondId, "ru"),
  );
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export function buildLiveRouteMonitoringData(
  params: BuildLiveRouteMonitoringParams,
): LiveRouteMonitoringData {
  const nowMs = (params.now ?? new Date()).getTime();
  const pointsByOrderId = new Map(
    params.geocodedPoints.map((point) => [point.orderId, point]),
  );
  const routeLineByCourierId = new Map(
    params.routeLines.map((routeLine) => [routeLine.courierId, routeLine]),
  );
  const realRouteByCourierId = new Map(
    params.realRoutes.map((route) => [route.courierId, route]),
  );
  const liveCourierById = new Map(
    params.liveCouriers.map((courier) => [courier.courierId, courier]),
  );
  const courierNameById = new Map<string, string>();

  for (const routeLine of params.routeLines) {
    courierNameById.set(routeLine.courierId, routeLine.courierName);
  }

  for (const liveCourier of params.liveCouriers) {
    courierNameById.set(liveCourier.courierId, liveCourier.courierName);
  }

  for (const plan of params.routeDistancePlan.courierPlans) {
    courierNameById.set(plan.courierId, plan.courierName);
  }

  const couriers = collectCourierIds(params.routeLines, params.liveCouriers).map(
    (courierId) =>
      buildCourierMonitoringRecord({
        courierId,
        courierName: courierNameById.get(courierId) ?? courierId,
        liveCourier: liveCourierById.get(courierId),
        routeLine: routeLineByCourierId.get(courierId),
        realRoute: realRouteByCourierId.get(courierId),
        pointsByOrderId,
        nowMs,
      }),
  );

  return {
    couriers,
    updatedAt: new Date(nowMs).toISOString(),
  };
}
