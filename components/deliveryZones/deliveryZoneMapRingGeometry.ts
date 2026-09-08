// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Кольца зон на карте — реальная геометрия МКАД
//
// Purpose (EN): Build the polygon rings the map draws for each zone using the
// same real-MKAD-polygon expansion as zone detection/pricing
// (mkadPolygonExpansion.ts / deliveryZonesCatalog.ts) — not circles — so the
// map shows the exact shape actually used to assign zones and price.
//
// Назначение (RU): Кольца зон для карты строятся тем же раздутием реального
// полигона МКАД, что и определение зоны/тариф, а не окружностями — карта
// показывает ту же форму, что используется для расчёта.
// ==================================================
import { MKAD_POLYGON_COORDINATES } from "@/components/deliveryZones/mkadGeometry";
import { getMkadBoundaryCentroid } from "@/components/deliveryZones/mkadBoundary";
import { expandPolygonOutward } from "@/components/deliveryZones/mkadPolygonExpansion";
import { reversePolygonRing } from "@/components/deliveryZones/deliveryZoneMapVisualFoundation";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

/**
 * Map display bands — outer distance (km from MKAD) per non-base zone.
 * Kept in sync by hand with deliveryZonesCatalog.ts `maxDistanceFromBaseKm`;
 * both ultimately expand the same MKAD_POLYGON_COORDINATES by the same
 * offsets via expandPolygonOutward, so map shape and pricing shape match.
 */
export const DELIVERY_ZONE_MAP_DISTANCE_BANDS: Array<{
  zoneId: DeliveryZoneId;
  outerDistanceKm: number;
}> = [
  { zoneId: "7km", outerDistanceKm: 7 },
  { zoneId: "14km", outerDistanceKm: 16 },
  { zoneId: "21km", outerDistanceKm: 26 },
  { zoneId: "28km", outerDistanceKm: 41 },
  { zoneId: "38km", outerDistanceKm: 56 },
  { zoneId: "48km", outerDistanceKm: 71 },
];

/**
 * Ring coordinates for a zone, built from the real MKAD polygon (not a
 * circle): the outer boundary is MKAD expanded outward by the zone's outer
 * distance; the inner boundary (the "hole" that turns the shape into a ring
 * instead of a filled disc) is MKAD expanded outward by the previous band's
 * outer distance — 0 for the first band, i.e. the MKAD line itself.
 *
 * The base zone (inside MKAD) has no inner hole: it returns the MKAD
 * polygon itself as a single filled ring.
 */
export function buildDeliveryZoneMapRingCoordinates(
  zoneId: DeliveryZoneId,
): GeoCoordinate[][] | null {
  if (zoneId === "base") {
    return [MKAD_POLYGON_COORDINATES.map((point) => ({ ...point }))];
  }

  const bandIndex = DELIVERY_ZONE_MAP_DISTANCE_BANDS.findIndex(
    (entry) => entry.zoneId === zoneId,
  );

  if (bandIndex === -1) {
    return null;
  }

  const band = DELIVERY_ZONE_MAP_DISTANCE_BANDS[bandIndex]!;
  const innerDistanceKm =
    bandIndex > 0
      ? DELIVERY_ZONE_MAP_DISTANCE_BANDS[bandIndex - 1]!.outerDistanceKm
      : 0;

  const center = getMkadBoundaryCentroid();

  const outerRing = expandPolygonOutward(
    MKAD_POLYGON_COORDINATES,
    band.outerDistanceKm,
    center,
  );
  const innerRing = expandPolygonOutward(
    MKAD_POLYGON_COORDINATES,
    innerDistanceKm,
    center,
  );

  return [outerRing, reversePolygonRing(innerRing)];
}
