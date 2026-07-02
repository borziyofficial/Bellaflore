// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Зоны доставки
//
// Purpose (EN): MKAD zone detection, pricing, and road-distance calculations.
//
// Назначение (RU): Определение зон МКАД, тарифы и расчёт дорожного расстояния.
// ==================================================
import { MKAD_POLYGON_COORDINATES } from "@/components/deliveryZones/mkadGeometry";
import { getNearestPointOnPolygonBoundary } from "@/components/deliveryZones/nearestPolygonPoint";
import { isPointInPolygon } from "@/components/deliveryZones/pointInPolygon";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

export type GeoPoint = GeoCoordinate;

/** @deprecated Use MKAD_POLYGON_COORDINATES from mkadGeometry.ts */
export const MKAD_BOUNDARY_POLYGON: GeoPoint[] = MKAD_POLYGON_COORDINATES;


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const KM_PER_DEGREE_LAT = 111.32;


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function isPointInsideBaseZone(point: GeoPoint): boolean {
  return isPointInPolygon(point, MKAD_POLYGON_COORDINATES);
}

export function getNearestMkadBoundaryPoint(point: GeoPoint): GeoPoint {
  return getNearestPointOnPolygonBoundary(point, MKAD_POLYGON_COORDINATES)
    .nearestPoint;
}

export function getApproxDistanceFromBaseZoneKm(point: GeoPoint): number {
  if (isPointInsideBaseZone(point)) {
    return 0;
  }

  return getNearestPointOnPolygonBoundary(point, MKAD_POLYGON_COORDINATES)
    .distanceKm;
}

export function getMkadBoundaryCentroid(): GeoPoint {
  const totals = MKAD_POLYGON_COORDINATES.reduce(
    (accumulator, polygonPoint) => ({
      latitude: accumulator.latitude + polygonPoint.latitude,
      longitude: accumulator.longitude + polygonPoint.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );

  return {
    latitude: totals.latitude / MKAD_POLYGON_COORDINATES.length,
    longitude: totals.longitude / MKAD_POLYGON_COORDINATES.length,
  };
}

/**
 * Dev/testing helper: returns a point approximately `distanceKm` north of the MKAD centroid.
 */
export function getPointNorthOfBaseZoneAtDistanceKm(distanceKm: number): GeoPoint {
  const centroid = getMkadBoundaryCentroid();

  return {
    latitude: centroid.latitude + distanceKm / KM_PER_DEGREE_LAT,
    longitude: centroid.longitude,
  };
}
