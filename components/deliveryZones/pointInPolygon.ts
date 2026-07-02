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

/**
 * Ray-casting point-in-polygon test for a simple closed polygon ring.
 */

// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function isPointInPolygon(
  point: PolygonPoint,
  polygon: PolygonPoint[],
): boolean {
  if (polygon.length < 3) {
    return false;
  }

  let isInside = false;

  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];

    const intersects =
      current.longitude > point.longitude !== next.longitude > point.longitude &&
      point.latitude <
        ((next.latitude - current.latitude) *
          (point.longitude - current.longitude)) /
          (next.longitude - current.longitude) +
          current.latitude;

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}
