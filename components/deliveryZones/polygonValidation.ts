// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Валидация полигона зоны 1
//
// Purpose (EN): Shared, universal (client + server safe) validation for an
// admin-edited Zone 1 (MKAD) polygon — used both by the Admin map editor
// (immediate feedback while dragging/adding/removing points) and by the
// server-side save path (lib/deliveryZonesDb.ts), so both sides agree on
// what counts as a usable polygon.
//
// Назначение (RU): Общая проверка (безопасна и на клиенте, и на сервере)
// отредактированного полигона Zone 1 (МКАД) — используется и в редакторе
// карты в админке (мгновенная обратная связь), и при сохранении на сервере
// (lib/deliveryZonesDb.ts), чтобы обе стороны одинаково понимали, что такое
// пригодный полигон.
// ==================================================
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

export const MIN_ZONE_POLYGON_POINTS = 4;
export const MAX_ZONE_POLYGON_POINTS = 500;

export type PolygonValidationResult =
  | { valid: true }
  | { valid: false; reason: string };

function segmentsIntersect(
  p1: GeoCoordinate,
  p2: GeoCoordinate,
  p3: GeoCoordinate,
  p4: GeoCoordinate,
): boolean {
  const cross = (
    origin: GeoCoordinate,
    a: GeoCoordinate,
    b: GeoCoordinate,
  ) =>
    (a.longitude - origin.longitude) * (b.latitude - origin.latitude) -
    (a.latitude - origin.latitude) * (b.longitude - origin.longitude);

  const d1 = cross(p3, p4, p1);
  const d2 = cross(p3, p4, p2);
  const d3 = cross(p1, p2, p3);
  const d4 = cross(p1, p2, p4);

  return (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  );
}

function ringHasSelfIntersections(ring: GeoCoordinate[]): boolean {
  const n = ring.length;
  for (let i = 0; i < n; i += 1) {
    const a1 = ring[i]!;
    const a2 = ring[(i + 1) % n]!;
    for (let j = i + 1; j < n; j += 1) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) {
        continue;
      }
      const b1 = ring[j]!;
      const b2 = ring[(j + 1) % n]!;
      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  return false;
}

function isFiniteCoordinate(point: unknown): point is GeoCoordinate {
  if (!point || typeof point !== "object") {
    return false;
  }
  const candidate = point as Partial<GeoCoordinate>;
  return (
    typeof candidate.latitude === "number" &&
    typeof candidate.longitude === "number" &&
    Number.isFinite(candidate.latitude) &&
    Number.isFinite(candidate.longitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180
  );
}

/**
 * Validates a candidate Zone 1 polygon: enough points, all points are
 * finite valid coordinates, and the ring does not self-intersect (which
 * would make point-in-polygon zone detection and the Yandex map polygon
 * unreliable/undrawable).
 */
export function validateZonePolygon(
  points: GeoCoordinate[],
): PolygonValidationResult {
  if (!Array.isArray(points)) {
    return { valid: false, reason: "Полигон должен быть массивом точек." };
  }
  if (points.length < MIN_ZONE_POLYGON_POINTS) {
    return {
      valid: false,
      reason: `Нужно минимум ${MIN_ZONE_POLYGON_POINTS} точки, чтобы описать замкнутую зону.`,
    };
  }
  if (points.length > MAX_ZONE_POLYGON_POINTS) {
    return {
      valid: false,
      reason: `Слишком много точек (максимум ${MAX_ZONE_POLYGON_POINTS}).`,
    };
  }
  if (!points.every(isFiniteCoordinate)) {
    return {
      valid: false,
      reason: "Координаты точки указаны некорректно.",
    };
  }
  if (ringHasSelfIntersections(points)) {
    return {
      valid: false,
      reason:
        "Границы полигона пересекают сами себя — исправьте самопересечение перед сохранением.",
    };
  }
  return { valid: true };
}
