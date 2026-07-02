// ==================================================
// SECTION: CONFIG
// РАЗДЕЛ: Каталог зон доставки
//
// Purpose (EN):
// Admin-ready delivery zone catalog: prices, polygons, ETA, activation flags.
//
// Назначение (RU):
// Каталог зон доставки для будущей админки: цены, полигоны, ETA, флаги.
// ==================================================
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import { MKAD_POLYGON_COORDINATES } from "@/components/deliveryZones/mkadGeometry";
import { getMkadBoundaryCentroid } from "@/components/deliveryZones/mkadBoundary";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

export type DeliveryZoneCityId = "moscow";

export type DeliveryZoneCatalogEntry = {
  zoneId: DeliveryZoneId;
  /** Display title, e.g. «Зона 2». */
  title: string;
  /** Legacy / map label. */
  label: string;
  color: string;
  priceRub: number;
  estimatedTime: string;
  isActive: boolean;
  isBaseZone: boolean;
  maxDistanceFromBaseKm: number;
  sortOrder: number;
  polygonCoordinates: GeoCoordinate[];
  cityId: DeliveryZoneCityId;
};

const KM_PER_DEGREE_LAT = 111.32;

function expandPolygonOutward(
  polygon: GeoCoordinate[],
  offsetKm: number,
  centroid: GeoCoordinate,
): GeoCoordinate[] {
  if (offsetKm <= 0) {
    return polygon.map((point) => ({ ...point }));
  }

  const lonScale =
    KM_PER_DEGREE_LAT * Math.cos((centroid.latitude * Math.PI) / 180);

  return polygon.map((vertex) => {
    const deltaX = (vertex.longitude - centroid.longitude) * lonScale;
    const deltaY = (vertex.latitude - centroid.latitude) * KM_PER_DEGREE_LAT;
    const distanceKm = Math.hypot(deltaX, deltaY) || 1;
    const scale = (distanceKm + offsetKm) / distanceKm;

    return {
      latitude: centroid.latitude + (deltaY * scale) / KM_PER_DEGREE_LAT,
      longitude: centroid.longitude + (deltaX * scale) / lonScale,
    };
  });
}

function buildZonePolygon(
  maxDistanceFromBaseKm: number,
  isBaseZone: boolean,
  centroid: GeoCoordinate,
): GeoCoordinate[] {
  if (isBaseZone) {
    return MKAD_POLYGON_COORDINATES.map((point) => ({ ...point }));
  }

  return expandPolygonOutward(
    MKAD_POLYGON_COORDINATES,
    maxDistanceFromBaseKm,
    centroid,
  );
}

function buildCatalogEntry(
  partial: Omit<DeliveryZoneCatalogEntry, "polygonCoordinates">,
  centroid: GeoCoordinate,
): DeliveryZoneCatalogEntry {
  return {
    ...partial,
    polygonCoordinates: buildZonePolygon(
      partial.maxDistanceFromBaseKm,
      partial.isBaseZone,
      centroid,
    ),
  };
}

const MKAD_CENTROID = getMkadBoundaryCentroid();

/** Source of truth for Bellaflore delivery zones (Moscow). */
export const DELIVERY_ZONES_CATALOG: DeliveryZoneCatalogEntry[] = [
  buildCatalogEntry(
    {
      zoneId: "base",
      title: "Зона 1",
      label: "В пределах МКАД",
      color: "#34A853",
      priceRub: 790,
      estimatedTime: "1–1.5 ч",
      isActive: true,
      isBaseZone: true,
      maxDistanceFromBaseKm: 0,
      sortOrder: 1,
      cityId: "moscow",
    },
    MKAD_CENTROID,
  ),
  buildCatalogEntry(
    {
      zoneId: "7km",
      title: "Зона 2",
      label: "До 7 км от МКАД",
      color: "#4A90D9",
      priceRub: 1290,
      estimatedTime: "1.5–2 ч",
      isActive: true,
      isBaseZone: false,
      maxDistanceFromBaseKm: 7,
      sortOrder: 2,
      cityId: "moscow",
    },
    MKAD_CENTROID,
  ),
  buildCatalogEntry(
    {
      zoneId: "14km",
      title: "Зона 3",
      label: "До 14 км от МКАД",
      color: "#F2A93B",
      priceRub: 1990,
      estimatedTime: "2–2.5 ч",
      isActive: true,
      isBaseZone: false,
      maxDistanceFromBaseKm: 14,
      sortOrder: 3,
      cityId: "moscow",
    },
    MKAD_CENTROID,
  ),
  buildCatalogEntry(
    {
      zoneId: "21km",
      title: "Зона 4",
      label: "До 21 км от МКАД",
      color: "#E85D8A",
      priceRub: 2690,
      estimatedTime: "2.5–3 ч",
      isActive: true,
      isBaseZone: false,
      maxDistanceFromBaseKm: 21,
      sortOrder: 4,
      cityId: "moscow",
    },
    MKAD_CENTROID,
  ),
  buildCatalogEntry(
    {
      zoneId: "28km",
      title: "Зона 5",
      label: "До 28 км от МКАД",
      color: "#9C6ADE",
      priceRub: 3990,
      estimatedTime: "3–3.5 ч",
      isActive: true,
      isBaseZone: false,
      maxDistanceFromBaseKm: 28,
      sortOrder: 5,
      cityId: "moscow",
    },
    MKAD_CENTROID,
  ),
  buildCatalogEntry(
    {
      zoneId: "38km",
      title: "Зона 6",
      label: "До 38 км от МКАД",
      color: "#9AA0A6",
      priceRub: 4590,
      estimatedTime: "3.5–4 ч",
      isActive: true,
      isBaseZone: false,
      maxDistanceFromBaseKm: 38,
      sortOrder: 6,
      cityId: "moscow",
    },
    MKAD_CENTROID,
  ),
  buildCatalogEntry(
    {
      zoneId: "48km",
      title: "Зона 7",
      label: "До 48 км от МКАД",
      color: "#6B7280",
      priceRub: 5990,
      estimatedTime: "4–5 ч",
      isActive: true,
      isBaseZone: false,
      maxDistanceFromBaseKm: 48,
      sortOrder: 7,
      cityId: "moscow",
    },
    MKAD_CENTROID,
  ),
];

export const DELIVERY_ZONE_MAX_DISTANCE_KM = 48;

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
