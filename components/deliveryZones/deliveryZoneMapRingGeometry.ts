// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Map-only concentric distance rings (display geometry)
//
// TODO(production-geometry): Replace with admin editable polygon / GeoJSON
// when the polygon editor is ready. Zone detection still uses catalog polygons.
// ==================================================
import { MKAD_POLYGON_COORDINATES } from "@/components/deliveryZones/mkadGeometry";
import { getMkadBoundaryCentroid } from "@/components/deliveryZones/mkadBoundary";
import { reversePolygonRing } from "@/components/deliveryZones/deliveryZoneMapVisualFoundation";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

const KM_PER_DEGREE_LAT = 111.32;
const RING_SEGMENT_COUNT = 72;

/** Map display only — do not use for pricing / zone detection. */
export const DELIVERY_ZONE_MAP_DISTANCE_BANDS: Array<{
  zoneId: DeliveryZoneId;
  outerDistanceKm: number;
}> = [
  { zoneId: "7km", outerDistanceKm: 7 },
  { zoneId: "14km", outerDistanceKm: 14 },
  { zoneId: "21km", outerDistanceKm: 21 },
  { zoneId: "28km", outerDistanceKm: 28 },
  { zoneId: "38km", outerDistanceKm: 38 },
  { zoneId: "48km", outerDistanceKm: 48 },
];

function lonScaleAtLatitude(latitude: number): number {
  return KM_PER_DEGREE_LAT * Math.cos((latitude * Math.PI) / 180);
}

function distanceKmFromCentroid(
  center: GeoCoordinate,
  point: GeoCoordinate,
): number {
  const lonScale = lonScaleAtLatitude(center.latitude);
  const deltaX = (point.longitude - center.longitude) * lonScale;
  const deltaY = (point.latitude - center.latitude) * KM_PER_DEGREE_LAT;
  return Math.hypot(deltaX, deltaY);
}

function getMkadReferenceRadiusKm(center: GeoCoordinate): number {
  const distances = MKAD_POLYGON_COORDINATES.map((vertex) =>
    distanceKmFromCentroid(center, vertex),
  );
  const total = distances.reduce((sum, value) => sum + value, 0);
  return total / distances.length;
}

function sampleCircleRing(
  center: GeoCoordinate,
  radiusKm: number,
  segments: number,
): GeoCoordinate[] {
  const lonScale = lonScaleAtLatitude(center.latitude);
  const points: GeoCoordinate[] = [];

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const deltaX = Math.cos(angle) * radiusKm;
    const deltaY = Math.sin(angle) * radiusKm;

    points.push({
      latitude: center.latitude + deltaY / KM_PER_DEGREE_LAT,
      longitude: center.longitude + deltaX / lonScale,
    });
  }

  return points;
}

function buildDistanceBandRingCoordinates(
  center: GeoCoordinate,
  mkadRadiusKm: number,
  innerDistanceKm: number,
  outerDistanceKm: number,
): GeoCoordinate[][] {
  const outerRing = sampleCircleRing(
    center,
    mkadRadiusKm + outerDistanceKm,
    RING_SEGMENT_COUNT,
  );
  const innerRing = sampleCircleRing(
    center,
    mkadRadiusKm + innerDistanceKm,
    RING_SEGMENT_COUNT,
  );

  return [outerRing, reversePolygonRing(innerRing)];
}

export function buildDeliveryZoneMapRingCoordinates(
  zoneId: DeliveryZoneId,
): GeoCoordinate[][] | null {
  if (zoneId === "base") {
    return null;
  }

  const band = DELIVERY_ZONE_MAP_DISTANCE_BANDS.find(
    (entry) => entry.zoneId === zoneId,
  );

  if (!band) {
    return null;
  }

  const center = getMkadBoundaryCentroid();
  const mkadRadiusKm = getMkadReferenceRadiusKm(center);
  const bandIndex = DELIVERY_ZONE_MAP_DISTANCE_BANDS.findIndex(
    (entry) => entry.zoneId === zoneId,
  );
  const innerDistanceKm =
    bandIndex > 0
      ? DELIVERY_ZONE_MAP_DISTANCE_BANDS[bandIndex - 1]!.outerDistanceKm
      : 0;

  return buildDistanceBandRingCoordinates(
    center,
    mkadRadiusKm,
    innerDistanceKm,
    band.outerDistanceKm,
  );
}
