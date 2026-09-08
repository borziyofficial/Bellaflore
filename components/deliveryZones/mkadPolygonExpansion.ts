// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Раздутие полигона МКАД наружу
//
// Purpose (EN): Shared helper that expands the real MKAD polygon outward by a
// fixed distance using a proper geometric polygon buffer/offset (edges are
// pushed outward along their own normals and re-joined via a robust
// self-intersection-free union — see the `polygon-offset` package), so both
// zone detection/pricing (deliveryZonesCatalog.ts) and the map display
// (deliveryZoneMapRingGeometry.ts) draw/measure the exact same shape.
//
// A previous version scaled each vertex radially from a single centroid.
// That degenerates for a non-convex ring like MKAD: at larger offsets it
// produces self-intersecting "teeth" at concave stretches and drifts toward
// a near-circular outline instead of following the real MKAD contour. The
// buffer/offset approach here keeps the outline faithful to MKAD at every
// distance and never self-intersects.
//
// Назначение (RU): Общая функция раздутия реального полигона МКАД наружу на
// фиксированное расстояние через настоящий геометрический buffer/offset
// (рёбра сдвигаются наружу вдоль своих нормалей и объединяются устойчивым
// алгоритмом без самопересечений — пакет `polygon-offset`), чтобы определение
// зоны/тариф и отображение на карте использовали одну и ту же геометрию.
//
// Предыдущая версия масштабировала каждую вершину радиально от одного
// центроида. Для невыпуклого контура вроде МКАД это вырождается: на больших
// расстояниях появляются самопересечения ("зубцы") на вогнутых участках, а
// форма стремится к окружности вместо реального контура МКАД. Buffer/offset
// сохраняет форму МКАД на любом расстоянии и никогда не самопересекается.
// ==================================================
import Offset from "polygon-offset";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

const KM_PER_DEGREE_LAT = 111.32;

/** Odd number of segments used to round convex corners of the buffer. */
const BUFFER_ARC_SEGMENTS = 5;

type LocalPoint = [number, number];

function toLocalKm(
  point: GeoCoordinate,
  centroid: GeoCoordinate,
  lonScale: number,
): LocalPoint {
  return [
    (point.longitude - centroid.longitude) * lonScale,
    (point.latitude - centroid.latitude) * KM_PER_DEGREE_LAT,
  ];
}

function fromLocalKm(
  [x, y]: LocalPoint,
  centroid: GeoCoordinate,
  lonScale: number,
): GeoCoordinate {
  return {
    latitude: centroid.latitude + y / KM_PER_DEGREE_LAT,
    longitude: centroid.longitude + x / lonScale,
  };
}

function ringAreaAbs(ring: LocalPoint[]): number {
  let area = 0;
  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index]!;
    const [x2, y2] = ring[(index + 1) % ring.length]!;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
}

/** Picks the largest-by-area ring in case the offset ever yields more than
 * one disjoint polygon (not expected for MKAD's real shape at these
 * distances, but kept as a safety net so a pathological input degrades
 * gracefully instead of picking an arbitrary fragment). */
function pickPrimaryRing(rings: LocalPoint[][]): LocalPoint[] | null {
  if (rings.length === 0) {
    return null;
  }

  return rings.reduce((largest, candidate) =>
    ringAreaAbs(candidate) > ringAreaAbs(largest) ? candidate : largest,
  );
}

/**
 * Expands `polygon` outward by `offsetKm` using a real polygon buffer/offset
 * (not radial vertex scaling): every edge is pushed outward along its own
 * normal by `offsetKm`, convex corners are rounded, and the result is
 * unioned into a single simple (non self-intersecting) ring. Falls back to
 * an unmodified copy of `polygon` if the buffer computation cannot produce a
 * usable ring (defensive — should not happen for MKAD's real geometry).
 */
export function expandPolygonOutward(
  polygon: GeoCoordinate[],
  offsetKm: number,
  centroid: GeoCoordinate,
): GeoCoordinate[] {
  if (offsetKm <= 0 || polygon.length < 3) {
    return polygon.map((point) => ({ ...point }));
  }

  const lonScale =
    KM_PER_DEGREE_LAT * Math.cos((centroid.latitude * Math.PI) / 180);

  const localPoints = polygon.map((point) =>
    toLocalKm(point, centroid, lonScale),
  );

  try {
    const buffered = new Offset(localPoints)
      .arcSegments(BUFFER_ARC_SEGMENTS)
      .margin(offsetKm);

    const primaryRing = pickPrimaryRing(buffered);

    if (!primaryRing || primaryRing.length < 3) {
      throw new Error("polygon-offset returned no usable ring");
    }

    return primaryRing.map((point) => fromLocalKm(point, centroid, lonScale));
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        "[deliveryZones] expandPolygonOutward: buffer failed, using unmodified polygon as a fallback.",
        error,
      );
    }

    return polygon.map((point) => ({ ...point }));
  }
}
