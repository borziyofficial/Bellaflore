// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Polygon zone engine
//
// Purpose (EN): Detect delivery zone by point-in-polygon against catalog rings.
//
// Назначение (RU): Определение зоны доставки через point-in-polygon.
// ==================================================
import { isPointInPolygon } from "@/components/deliveryZones/pointInPolygon";
import {
  getActiveDeliveryZones,
  type DeliveryZoneCatalogEntry,
  type DeliveryZoneCityId,
} from "@/components/deliveryZones/deliveryZonesCatalog";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

export type PolygonZoneDetectionResult = {
  zone: DeliveryZoneCatalogEntry | null;
  matchedZones: DeliveryZoneCatalogEntry[];
};

/**
 * Returns the innermost active zone whose polygon contains the point.
 * Nested rings expand outward; lower sortOrder = inner zone.
 */
export function detectDeliveryZoneByPolygon(
  point: GeoCoordinate,
  cityId: DeliveryZoneCityId = "moscow",
): PolygonZoneDetectionResult {
  const activeZones = getActiveDeliveryZones(cityId);
  const matchedZones = activeZones.filter((zone) =>
    isPointInPolygon(point, zone.polygonCoordinates),
  );

  if (matchedZones.length === 0) {
    return { zone: null, matchedZones: [] };
  }

  const innermostZone = [...matchedZones].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  )[0];

  return {
    zone: innermostZone ?? null,
    matchedZones,
  };
}

export function isPointInsideAnyActiveDeliveryZone(
  point: GeoCoordinate,
  cityId: DeliveryZoneCityId = "moscow",
): boolean {
  return detectDeliveryZoneByPolygon(point, cityId).zone !== null;
}
