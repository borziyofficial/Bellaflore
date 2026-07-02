// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Зоны доставки
//
// Purpose (EN): MKAD zone detection, pricing, and road-distance calculations.
//
// Назначение (RU): Определение зон МКАД, тарифы и расчёт дорожного расстояния.
// ==================================================
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

export type PolygonPoint = GeoCoordinate;


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type NearestPolygonBoundaryResult = {
  nearestPoint: PolygonPoint;
  distanceKm: number;
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const KM_PER_DEGREE_LAT = 111.32;

function toLocalKm(point: PolygonPoint, reference: PolygonPoint) {
  const lonScale =
    KM_PER_DEGREE_LAT *
    Math.cos(((reference.latitude + point.latitude) / 2) * (Math.PI / 180));

  return {
    x: (point.longitude - reference.longitude) * lonScale,
    y: (point.latitude - reference.latitude) * KM_PER_DEGREE_LAT,
  };
}

function distancePointToSegmentKm(
  point: PolygonPoint,
  segmentStart: PolygonPoint,
  segmentEnd: PolygonPoint,
): number {
  const localPoint = toLocalKm(point, point);
  const localStart = toLocalKm(segmentStart, point);
  const localEnd = toLocalKm(segmentEnd, point);

  const segmentX = localEnd.x - localStart.x;
  const segmentY = localEnd.y - localStart.y;
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;

  if (segmentLengthSquared === 0) {
    return Math.hypot(localPoint.x - localStart.x, localPoint.y - localStart.y);
  }

  const projectionRatio = Math.max(
    0,
    Math.min(
      1,
      ((localPoint.x - localStart.x) * segmentX +
        (localPoint.y - localStart.y) * segmentY) /
        segmentLengthSquared,
    ),
  );

  const closestX = localStart.x + projectionRatio * segmentX;
  const closestY = localStart.y + projectionRatio * segmentY;

  return Math.hypot(localPoint.x - closestX, localPoint.y - closestY);
}

function getClosestPointOnSegment(
  point: PolygonPoint,
  segmentStart: PolygonPoint,
  segmentEnd: PolygonPoint,
): PolygonPoint {
  const localPoint = toLocalKm(point, point);
  const localStart = toLocalKm(segmentStart, point);
  const localEnd = toLocalKm(segmentEnd, point);

  const segmentX = localEnd.x - localStart.x;
  const segmentY = localEnd.y - localStart.y;
  const segmentLengthSquared = segmentX ** 2 + segmentY ** 2;

  if (segmentLengthSquared === 0) {
    return segmentStart;
  }

  const projectionRatio = Math.max(
    0,
    Math.min(
      1,
      ((localPoint.x - localStart.x) * segmentX +
        (localPoint.y - localStart.y) * segmentY) /
        segmentLengthSquared,
    ),
  );

  const closestX = localStart.x + projectionRatio * segmentX;
  const closestY = localStart.y + projectionRatio * segmentY;
  const lonScale =
    KM_PER_DEGREE_LAT *
    Math.cos(((segmentStart.latitude + segmentEnd.latitude) / 2) * (Math.PI / 180));

  return {
    latitude: point.latitude + closestY / KM_PER_DEGREE_LAT,
    longitude: point.longitude + closestX / lonScale,
  };
}

/**
 * Finds the nearest point on a polygon boundary using segment projection.
 * Distance is approximate (local flat-earth projection in km).
 */

// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getNearestPointOnPolygonBoundary(
  point: PolygonPoint,
  polygon: PolygonPoint[],
): NearestPolygonBoundaryResult {
  if (polygon.length === 0) {
    return {
      nearestPoint: point,
      distanceKm: 0,
    };
  }

  if (polygon.length === 1) {
    return {
      nearestPoint: polygon[0],
      distanceKm: distancePointToSegmentKm(point, polygon[0], polygon[0]),
    };
  }

  let nearestPoint = polygon[0];
  let minDistanceKm = Number.POSITIVE_INFINITY;

  for (let index = 0; index < polygon.length; index += 1) {
    const segmentStart = polygon[index];
    const segmentEnd = polygon[(index + 1) % polygon.length];
    const segmentDistanceKm = distancePointToSegmentKm(
      point,
      segmentStart,
      segmentEnd,
    );

    if (segmentDistanceKm < minDistanceKm) {
      minDistanceKm = segmentDistanceKm;
      nearestPoint = getClosestPointOnSegment(point, segmentStart, segmentEnd);
    }
  }

  return {
    nearestPoint,
    distanceKm: Number.isFinite(minDistanceKm) ? minDistanceKm : 0,
  };
}
