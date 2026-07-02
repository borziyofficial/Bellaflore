// ==================================================
// SECTION: COURIER INTELLIGENCE
// РАЗДЕЛ: Route foundation
// ==================================================
import { calculateStraightLineDistanceKm } from "@/components/maps/distanceCalculator";
import type {
  CourierGeoPosition,
  CourierRoutePlan,
  CourierRouteStop,
} from "@/components/courierIntelligence/courierIntelligenceTypes";

const AVERAGE_SPEED_KMH = 28;
const STOP_SERVICE_MINUTES = 8;

export type RouteStopInput = {
  orderId: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
};

function toCoordinate(
  latitude?: number | null,
  longitude?: number | null,
): { latitude: number; longitude: number } | null {
  if (latitude == null || longitude == null) {
    return null;
  }

  return { latitude, longitude };
}

function estimateLegMinutes(distanceKm: number): number {
  return Math.round((distanceKm / AVERAGE_SPEED_KMH) * 60 + STOP_SERVICE_MINUTES);
}

function nearestNeighborSequence(
  origin: CourierGeoPosition | null,
  stops: RouteStopInput[],
): RouteStopInput[] {
  const remaining = [...stops];
  const ordered: RouteStopInput[] = [];
  let current = origin;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < remaining.length; index += 1) {
      const stop = remaining[index];
      const stopCoordinate = toCoordinate(stop.latitude, stop.longitude);

      if (!current || !stopCoordinate) {
        bestIndex = index;
        bestDistance = 0;
        break;
      }

      const distance = calculateStraightLineDistanceKm(current, stopCoordinate);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    const [nextStop] = remaining.splice(bestIndex, 1);
    ordered.push(nextStop);
    const nextCoordinate = toCoordinate(nextStop.latitude, nextStop.longitude);
    current = nextCoordinate
      ? {
          latitude: nextCoordinate.latitude,
          longitude: nextCoordinate.longitude,
          capturedAt: new Date().toISOString(),
          source: "manual_mock",
        }
      : current;
  }

  return ordered;
}

export function buildSingleOrderRoute(
  courierId: string,
  stop: RouteStopInput,
  origin?: CourierGeoPosition | null,
): CourierRoutePlan {
  const stops: CourierRouteStop[] = [
    {
      stopId: `STOP-${stop.orderId}`,
      orderId: stop.orderId,
      address: stop.address,
      latitude: stop.latitude ?? null,
      longitude: stop.longitude ?? null,
      sequence: 1,
      etaMinutes: null,
    },
  ];

  let totalDistanceKm: number | null = null;
  let totalEtaMinutes: number | null = null;

  const destination = toCoordinate(stop.latitude, stop.longitude);
  if (origin && destination) {
    totalDistanceKm = calculateStraightLineDistanceKm(origin, destination);
    totalEtaMinutes = estimateLegMinutes(totalDistanceKm);
    stops[0] = { ...stops[0], etaMinutes: totalEtaMinutes };
  }

  return {
    routeId: `ROUTE-${courierId}-${stop.orderId}`,
    courierId,
    stops,
    totalDistanceKm,
    totalEtaMinutes,
    optimized: false,
    createdAt: new Date().toISOString(),
  };
}

export function buildMultiOrderRoute(
  courierId: string,
  stopInputs: RouteStopInput[],
  origin?: CourierGeoPosition | null,
  optimize = true,
): CourierRoutePlan {
  const orderedStops = optimize
    ? nearestNeighborSequence(origin ?? null, stopInputs)
    : stopInputs;

  let runningOrigin = origin ?? null;
  let totalDistanceKm = 0;
  let totalEtaMinutes = 0;
  let hasDistance = false;

  const stops: CourierRouteStop[] = orderedStops.map((stop, index) => {
    const destination = toCoordinate(stop.latitude, stop.longitude);
    let etaMinutes: number | null = null;

    if (runningOrigin && destination) {
      const legDistance = calculateStraightLineDistanceKm(runningOrigin, destination);
      const legMinutes = estimateLegMinutes(legDistance);
      totalDistanceKm += legDistance;
      totalEtaMinutes += legMinutes;
      etaMinutes = legMinutes;
      hasDistance = true;
      runningOrigin = {
        latitude: destination.latitude,
        longitude: destination.longitude,
        capturedAt: new Date().toISOString(),
        source: "manual_mock",
      };
    }

    return {
      stopId: `STOP-${stop.orderId}`,
      orderId: stop.orderId,
      address: stop.address,
      latitude: stop.latitude ?? null,
      longitude: stop.longitude ?? null,
      sequence: index + 1,
      etaMinutes,
    };
  });

  return {
    routeId: `ROUTE-${courierId}-${Date.now()}`,
    courierId,
    stops,
    totalDistanceKm: hasDistance ? Number(totalDistanceKm.toFixed(2)) : null,
    totalEtaMinutes: hasDistance ? totalEtaMinutes : null,
    optimized: optimize,
    createdAt: new Date().toISOString(),
  };
}

export function estimateRouteArrivalMinutes(route: CourierRoutePlan): number | null {
  return route.totalEtaMinutes;
}
