// ==================================================
// SECTION: CONFIG
// РАЗДЕЛ: Каталог зон доставки
//
// Purpose (EN):
// Single-source delivery zone catalog: prices, polygons, ETA, activation
// flags. Consumed live (at call time, never cached at import) by checkout,
// zone detection/pricing, the Yandex map, and Admin — see
// applyDeliveryZoneOverrides()/rebuildDeliveryZoneCatalogEntries() below for
// how Admin-saved changes (lib/deliveryZonesDb.ts) flow into this same
// array in place.
//
// Назначение (RU):
// Единый каталог зон доставки: цены, полигоны, ETA, флаги активности.
// Используется "вживую" (в момент вызова, без кеширования при импорте)
// checkout'ом, определением/тарифом зоны, картой Yandex и админкой — см.
// applyDeliveryZoneOverrides()/rebuildDeliveryZoneCatalogEntries() ниже —
// так изменения из админки (lib/deliveryZonesDb.ts) попадают в этот же
// массив на месте.
// ==================================================
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import { MKAD_POLYGON_COORDINATES } from "@/components/deliveryZones/mkadGeometry";
import { expandPolygonOutward } from "@/components/deliveryZones/mkadPolygonExpansion";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

export type DeliveryZoneCityId = "moscow";

export type DeliveryZoneCatalogEntry = {
  zoneId: DeliveryZoneId;
  /** Display title, e.g. «Зона 2». */
  title: string;
  /** Legacy / map label. */
  label: string;
  color: string;
  /** Map fill opacity (0–1). Admin-editable; defaults to DEFAULT_DELIVERY_ZONE_FILL_OPACITY. */
  fillOpacity: number;
  priceRub: number;
  estimatedTime: string;
  isActive: boolean;
  isBaseZone: boolean;
  maxDistanceFromBaseKm: number;
  sortOrder: number;
  polygonCoordinates: GeoCoordinate[];
  cityId: DeliveryZoneCityId;
};

/** Editable fields an administrator can change per zone (Admin → Delivery zones). */
export type DeliveryZoneMetaOverride = {
  title: string;
  label: string;
  color: string;
  fillOpacity: number;
  priceRub: number;
  estimatedTime: string;
  isActive: boolean;
  /**
   * Real outer boundary of this zone, in km from the base (MKAD) polygon.
   * This is now the single source of truth for zone geometry/detection —
   * see rebuildDeliveryZoneCatalogEntries() below. Ignored for the base
   * zone, which is always 0 (inside MKAD has no km boundary).
   */
  maxDistanceFromBaseKm: number;
};

export const DEFAULT_DELIVERY_ZONE_FILL_OPACITY = 0.22;

type ZoneShapeDefinition = {
  zoneId: DeliveryZoneId;
  isBaseZone: boolean;
  sortOrder: number;
  cityId: DeliveryZoneCityId;
};

// Zone IDs, base/non-base flag, sort order and city stay code-defined (they
// are structural/stable — orders and the public API key off zoneId). The
// real km boundary is NOT here any more: it comes from meta.maxDistanceFromBaseKm
// (DEFAULT_DELIVERY_ZONE_META, or an admin-saved override applied via
// rebuildDeliveryZoneCatalogEntries() below) — this is what makes Admin ->
// Delivery zones the real single source of truth for geometry.
const ZONE_SHAPE_DEFINITIONS: ZoneShapeDefinition[] = [
  { zoneId: "base", isBaseZone: true, sortOrder: 1, cityId: "moscow" },
  { zoneId: "7km", isBaseZone: false, sortOrder: 2, cityId: "moscow" },
  { zoneId: "14km", isBaseZone: false, sortOrder: 3, cityId: "moscow" },
  { zoneId: "21km", isBaseZone: false, sortOrder: 4, cityId: "moscow" },
  { zoneId: "28km", isBaseZone: false, sortOrder: 5, cityId: "moscow" },
  { zoneId: "38km", isBaseZone: false, sortOrder: 6, cityId: "moscow" },
  { zoneId: "48km", isBaseZone: false, sortOrder: 7, cityId: "moscow" },
];

export const DEFAULT_DELIVERY_ZONE_META: Record<DeliveryZoneId, DeliveryZoneMetaOverride> = {
  base: {
    title: "Зона 1",
    label: "В пределах МКАД",
    color: "#2FA84F",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 790,
    estimatedTime: "1–1.5 ч",
    isActive: true,
    maxDistanceFromBaseKm: 0,
  },
  "7km": {
    title: "Зона 2",
    label: "0–7 км от МКАД",
    color: "#F5C518",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 1290,
    estimatedTime: "1.5–2 ч",
    isActive: true,
    maxDistanceFromBaseKm: 7,
  },
  "14km": {
    title: "Зона 3",
    label: "7–16 км от МКАД",
    color: "#F2994A",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 1990,
    estimatedTime: "2–2.5 ч",
    isActive: true,
    maxDistanceFromBaseKm: 16,
  },
  "21km": {
    title: "Зона 4",
    label: "16–26 км от МКАД",
    color: "#EB5757",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 2690,
    estimatedTime: "2.5–3 ч",
    isActive: true,
    maxDistanceFromBaseKm: 26,
  },
  "28km": {
    title: "Зона 5",
    label: "26–41 км от МКАД",
    color: "#9B59B6",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 3990,
    estimatedTime: "3–3.5 ч",
    isActive: true,
    maxDistanceFromBaseKm: 41,
  },
  "38km": {
    title: "Зона 6",
    label: "41–60 км от МКАД",
    color: "#3B82F6",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 4590,
    estimatedTime: "3.5–4 ч",
    isActive: true,
    maxDistanceFromBaseKm: 60,
  },
  "48km": {
    title: "Зона 7",
    label: "60–100 км от МКАД",
    color: "#374151",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 5990,
    estimatedTime: "4–5 ч",
    isActive: true,
    maxDistanceFromBaseKm: 100,
  },
};

function computePolygonCentroid(polygon: GeoCoordinate[]): GeoCoordinate {
  const totals = polygon.reduce(
    (accumulator, point) => ({
      latitude: accumulator.latitude + point.latitude,
      longitude: accumulator.longitude + point.longitude,
    }),
    { latitude: 0, longitude: 0 },
  );
  return {
    latitude: totals.latitude / polygon.length,
    longitude: totals.longitude / polygon.length,
  };
}

function buildZonePolygon(
  basePolygon: GeoCoordinate[],
  maxDistanceFromBaseKm: number,
  isBaseZone: boolean,
  centroid: GeoCoordinate,
): GeoCoordinate[] {
  if (isBaseZone) {
    return basePolygon.map((point) => ({ ...point }));
  }

  return expandPolygonOutward(basePolygon, maxDistanceFromBaseKm, centroid);
}

export function rebuildDeliveryZoneCatalogEntries(
  basePolygon: GeoCoordinate[],
  metaByZoneId: Partial<Record<DeliveryZoneId, DeliveryZoneMetaOverride>> = {},
): DeliveryZoneCatalogEntry[] {
  const centroid = computePolygonCentroid(basePolygon);

  return ZONE_SHAPE_DEFINITIONS.map((shape) => {
    const meta = metaByZoneId[shape.zoneId] ?? DEFAULT_DELIVERY_ZONE_META[shape.zoneId];
    // The real, editable outer boundary always comes from meta (DB-backed
    // when admin-saved, DEFAULT_DELIVERY_ZONE_META otherwise) — never from
    // a hardcoded shape constant. Zone 1/base is always exactly 0 (inside
    // MKAD has no km boundary) regardless of what meta carries.
    const maxDistanceFromBaseKm = shape.isBaseZone ? 0 : meta.maxDistanceFromBaseKm;
    return {
      zoneId: shape.zoneId,
      title: meta.title,
      label: meta.label,
      color: meta.color,
      fillOpacity: meta.fillOpacity,
      priceRub: meta.priceRub,
      estimatedTime: meta.estimatedTime,
      isActive: meta.isActive,
      isBaseZone: shape.isBaseZone,
      maxDistanceFromBaseKm,
      sortOrder: shape.sortOrder,
      cityId: shape.cityId,
      polygonCoordinates: buildZonePolygon(
        basePolygon,
        maxDistanceFromBaseKm,
        shape.isBaseZone,
        centroid,
      ),
    };
  });
}

function buildDefaultDeliveryZoneCatalog(): DeliveryZoneCatalogEntry[] {
  return rebuildDeliveryZoneCatalogEntries(
    MKAD_POLYGON_COORDINATES,
    DEFAULT_DELIVERY_ZONE_META,
  );
}

export const DELIVERY_ZONES_CATALOG: DeliveryZoneCatalogEntry[] =
  buildDefaultDeliveryZoneCatalog();

export function applyDeliveryZoneOverrides(
  entries: DeliveryZoneCatalogEntry[],
): void {
  if (entries.length !== ZONE_SHAPE_DEFINITIONS.length) {
    return;
  }
  DELIVERY_ZONES_CATALOG.length = 0;
  DELIVERY_ZONES_CATALOG.push(...entries);
}

export function resetDeliveryZonesCatalogToDefault(): void {
  applyDeliveryZoneOverrides(buildDefaultDeliveryZoneCatalog());
}

export function getActiveDeliveryZones(
  cityId: DeliveryZoneCityId = "moscow",
): DeliveryZoneCatalogEntry[] {
  return DELIVERY_ZONES_CATALOG.filter(
    (zone) => zone.isActive && zone.cityId === cityId,
  );
}

/**
 * The maximum deliverable distance (km from the base/MKAD polygon), derived
 * live from the actual (possibly admin/DB-hydrated) catalog's active zones
 * — never an independent hardcoded constant. This is what
 * calculateDeliveryZoneByDistance() uses to decide "outside delivery area",
 * so it always matches whatever the furthest active zone's boundary
 * currently is in Admin -> Delivery zones.
 */
export function getDeliveryZoneMaxDistanceKm(
  cityId: DeliveryZoneCityId = "moscow",
): number {
  const activeZones = getActiveDeliveryZones(cityId);
  if (activeZones.length === 0) {
    return 0;
  }
  return activeZones.reduce(
    (max, zone) => Math.max(max, zone.maxDistanceFromBaseKm),
    0,
  );
}

export function getDeliveryZoneCatalogEntry(
  zoneId: DeliveryZoneId,
): DeliveryZoneCatalogEntry | null {
  return DELIVERY_ZONES_CATALOG.find((zone) => zone.zoneId === zoneId) ?? null;
}

export function getDeliveryZonesForCity(
  cityId: DeliveryZoneCityId = "moscow",
): DeliveryZoneCatalogEntry[] {
  return DELIVERY_ZONES_CATALOG.filter((zone) => zone.cityId === cityId);
}
