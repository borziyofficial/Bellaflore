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
};

/** Default per-zone map fill opacity — matches the previous global constant
 * so nothing visually changes until an admin edits a zone's opacity. */
export const DEFAULT_DELIVERY_ZONE_FILL_OPACITY = 0.22;

/**
 * Fixed shape of the 7 zones: which zoneId is the base zone, its sort order,
 * and its outer distance band from MKAD (0/7/16/26/41/56/71 km). This part
 * is NOT admin-editable (see task spec) — only each zone's metadata
 * (title/label/color/opacity/price/time/active) and the base polygon are.
 */
type ZoneShapeDefinition = {
  zoneId: DeliveryZoneId;
  isBaseZone: boolean;
  maxDistanceFromBaseKm: number;
  sortOrder: number;
  cityId: DeliveryZoneCityId;
};

const ZONE_SHAPE_DEFINITIONS: ZoneShapeDefinition[] = [
  { zoneId: "base", isBaseZone: true, maxDistanceFromBaseKm: 0, sortOrder: 1, cityId: "moscow" },
  { zoneId: "7km", isBaseZone: false, maxDistanceFromBaseKm: 7, sortOrder: 2, cityId: "moscow" },
  { zoneId: "14km", isBaseZone: false, maxDistanceFromBaseKm: 16, sortOrder: 3, cityId: "moscow" },
  { zoneId: "21km", isBaseZone: false, maxDistanceFromBaseKm: 26, sortOrder: 4, cityId: "moscow" },
  { zoneId: "28km", isBaseZone: false, maxDistanceFromBaseKm: 41, sortOrder: 5, cityId: "moscow" },
  { zoneId: "38km", isBaseZone: false, maxDistanceFromBaseKm: 56, sortOrder: 6, cityId: "moscow" },
  { zoneId: "48km", isBaseZone: false, maxDistanceFromBaseKm: 71, sortOrder: 7, cityId: "moscow" },
];

/** Built-in default metadata — used until an admin overrides a zone, and as the seed written to the DB on first use. */
export const DEFAULT_DELIVERY_ZONE_META: Record<DeliveryZoneId, DeliveryZoneMetaOverride> = {
  base: {
    title: "Зона 1",
    label: "В пределах МКАД",
    color: "#2FA84F",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 790,
    estimatedTime: "1–1.5 ч",
    isActive: true,
  },
  "7km": {
    title: "Зона 2",
    label: "До 7 км от МКАД",
    color: "#F5C518",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 1290,
    estimatedTime: "1.5–2 ч",
    isActive: true,
  },
  "14km": {
    title: "Зона 3",
    label: "7–16 км от МКАД",
    color: "#F2994A",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 1990,
    estimatedTime: "2–2.5 ч",
    isActive: true,
  },
  "21km": {
    title: "Зона 4",
    label: "16–26 км от МКАД",
    color: "#EB5757",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 2690,
    estimatedTime: "2.5–3 ч",
    isActive: true,
  },
  "28km": {
    title: "Зона 5",
    label: "26–41 км от МКАД",
    color: "#9B59B6",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 3990,
    estimatedTime: "3–3.5 ч",
    isActive: true,
  },
  "38km": {
    title: "Зона 6",
    label: "41–56 км от МКАД",
    color: "#3B82F6",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 4590,
    estimatedTime: "3.5–4 ч",
    isActive: true,
  },
  "48km": {
    title: "Зона 7",
    label: "56–71 км от МКАД",
    color: "#374151",
    fillOpacity: DEFAULT_DELIVERY_ZONE_FILL_OPACITY,
    priceRub: 5990,
    estimatedTime: "4–5 ч",
    isActive: true,
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

/**
 * Rebuilds all 7 catalog entries from a base (Zone 1) polygon and per-zone
 * metadata overrides. Zones 2–7 are always derived from `basePolygon` via
 * the same robust buffer/offset used everywhere else (mkadPolygonExpansion)
 * — there is no separate/parallel way to store or compute their shape.
 */
export function rebuildDeliveryZoneCatalogEntries(
  basePolygon: GeoCoordinate[],
  metaByZoneId: Partial<Record<DeliveryZoneId, DeliveryZoneMetaOverride>> = {},
): DeliveryZoneCatalogEntry[] {
  const centroid = computePolygonCentroid(basePolygon);

  return ZONE_SHAPE_DEFINITIONS.map((shape) => {
    const meta = metaByZoneId[shape.zoneId] ?? DEFAULT_DELIVERY_ZONE_META[shape.zoneId];
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
      maxDistanceFromBaseKm: shape.maxDistanceFromBaseKm,
      sortOrder: shape.sortOrder,
      cityId: shape.cityId,
      polygonCoordinates: buildZonePolygon(
        basePolygon,
        shape.maxDistanceFromBaseKm,
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

/**
 * Source of truth for Bellaflore delivery zones (Moscow). This is a stable
 * array reference whose *contents* get replaced in place by
 * applyDeliveryZoneOverrides() — every reader below (and every consumer
 * across checkout/pricing/map/admin) reads it at call time, so an
 * admin-saved change is visible everywhere immediately, with no separate
 * cache to fall out of sync.
 */
export const DELIVERY_ZONES_CATALOG: DeliveryZoneCatalogEntry[] =
  buildDefaultDeliveryZoneCatalog();

/**
 * Replaces the catalog's contents in place (same array reference). Used by
 * the delivery-zones DB hydration layer (server: lib/deliveryZonesDb.ts;
 * client: components/deliveryZones/deliveryZonesClientHydration.ts) after
 * reading admin-saved zones. A no-op on an empty/invalid list, so a bad
 * fetch can never blank out the catalog.
 */
export function applyDeliveryZoneOverrides(
  entries: DeliveryZoneCatalogEntry[],
): void {
  if (entries.length !== ZONE_SHAPE_DEFINITIONS.length) {
    return;
  }
  DELIVERY_ZONES_CATALOG.length = 0;
  DELIVERY_ZONES_CATALOG.push(...entries);
}

/** Testing/rollback helper — restores the built-in default catalog. */
export function resetDeliveryZonesCatalogToDefault(): void {
  applyDeliveryZoneOverrides(buildDefaultDeliveryZoneCatalog());
}

export const DELIVERY_ZONE_MAX_DISTANCE_KM = 71;

export function getActiveDeliveryZones(
  cityId: DeliveryZoneCityId = "moscow",
): DeliveryZoneCatalogEntry[] {
  return DELIVERY_ZONES_CATALOG.filter(
    (zone) => zone.isActive && zone.cityId === cityId,
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
