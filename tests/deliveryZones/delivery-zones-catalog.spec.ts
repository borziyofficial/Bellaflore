// ==================================================
// SECTION: DELIVERY ZONES — pure logic tests
// РАЗДЕЛ: Зоны доставки — тесты чистой логики (без браузера/БД)
//
// Purpose (EN): Node-level tests (no browser, no DB — see tests/orders for
// the same pattern) for the delivery-zones catalog rebuild/hydration
// building blocks introduced for the Admin "Зоны доставки" section:
// - Zone 1 stays exactly the saved base polygon.
// - Zones 2–7 are always derived from Zone 1 via the robust buffer/offset
//   (never circles, never self-intersecting, strictly growing outward).
// - The catalog/MKAD arrays are mutated in place (stable references) so
//   every existing consumer keeps working without changes.
// - validateZonePolygon rejects too-few-points and self-intersecting rings.
//
// Назначение (RU): Тесты на уровне Node (без браузера и БД) для
// перестроения/валидации зон доставки, добавленных для раздела «Зоны
// доставки» в админке.
// ==================================================
import { expect, test } from "@playwright/test";
import {
  applyDeliveryZoneOverrides,
  DEFAULT_DELIVERY_ZONE_META,
  DELIVERY_ZONES_CATALOG,
  rebuildDeliveryZoneCatalogEntries,
  resetDeliveryZonesCatalogToDefault,
  type DeliveryZoneCatalogEntry,
} from "../../components/deliveryZones/deliveryZonesCatalog";
import {
  applyMkadPolygonOverride,
  DEFAULT_MKAD_POLYGON_COORDINATES,
  MKAD_POLYGON_COORDINATES,
  resetMkadPolygonToDefault,
} from "../../components/deliveryZones/mkadGeometry";
import { validateZonePolygon } from "../../components/deliveryZones/polygonValidation";
import type { GeoCoordinate } from "../../components/maps/distanceTypes";

const EXPECTED_ZONE_ORDER = ["base", "7km", "14km", "21km", "28km", "38km", "48km"] as const;
const EXPECTED_MAX_DISTANCE_KM: Record<string, number> = {
  base: 0,
  "7km": 7,
  "14km": 16,
  "21km": 26,
  "28km": 41,
  "38km": 56,
  "48km": 71,
};

function ringAreaAbs(ring: GeoCoordinate[]): number {
  let area = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i]!;
    const b = ring[(i + 1) % ring.length]!;
    area += a.longitude * b.latitude - b.longitude * a.latitude;
  }
  return Math.abs(area / 2);
}

// A simple, safely-sized convex octagon around central Moscow — used as a
// synthetic "base polygon" input so these tests never depend on (or risk
// perturbing) the real MKAD geometry constant.
function buildSyntheticBasePolygon(): GeoCoordinate[] {
  const center = { latitude: 55.7558, longitude: 37.6173 };
  const radiusDeg = 0.05;
  const points: GeoCoordinate[] = [];
  for (let i = 0; i < 8; i += 1) {
    const angle = (i / 8) * Math.PI * 2;
    points.push({
      latitude: center.latitude + radiusDeg * Math.sin(angle),
      longitude: center.longitude + radiusDeg * Math.cos(angle) * 1.6,
    });
  }
  return points;
}

test.describe("rebuildDeliveryZoneCatalogEntries", () => {
  test("produces exactly 7 zones in the fixed order with fixed distance bands", () => {
    const base = buildSyntheticBasePolygon();
    const entries = rebuildDeliveryZoneCatalogEntries(base, DEFAULT_DELIVERY_ZONE_META);

    expect(entries).toHaveLength(7);
    expect(entries.map((entry) => entry.zoneId)).toEqual([...EXPECTED_ZONE_ORDER]);
    for (const entry of entries) {
      expect(entry.maxDistanceFromBaseKm).toBe(EXPECTED_MAX_DISTANCE_KM[entry.zoneId]);
    }
  });

  test("Zone 1 (base) keeps exactly the input polygon", () => {
    const base = buildSyntheticBasePolygon();
    const entries = rebuildDeliveryZoneCatalogEntries(base, DEFAULT_DELIVERY_ZONE_META);
    const zone1 = entries.find((entry) => entry.zoneId === "base")!;

    expect(zone1.isBaseZone).toBe(true);
    expect(zone1.polygonCoordinates).toEqual(base);
  });

  test("Zones 2-7 grow strictly outward (area) from Zone 1 and never self-intersect", () => {
    const base = buildSyntheticBasePolygon();
    const entries = rebuildDeliveryZoneCatalogEntries(base, DEFAULT_DELIVERY_ZONE_META);
    const sorted = [...entries].sort((a, b) => a.sortOrder - b.sortOrder);

    let previousArea = 0;
    for (const zone of sorted) {
      const area = ringAreaAbs(zone.polygonCoordinates);
      expect(area).toBeGreaterThan(previousArea);
      previousArea = area;

      const validation = validateZonePolygon(zone.polygonCoordinates);
      expect(validation.valid, `zone ${zone.zoneId} should not self-intersect`).toBe(true);
    }
  });

  test("per-zone metadata overrides (title/color/price/etc.) flow through untouched", () => {
    const base = buildSyntheticBasePolygon();
    const entries = rebuildDeliveryZoneCatalogEntries(base, {
      base: {
        ...DEFAULT_DELIVERY_ZONE_META.base,
        title: "Тестовая зона 1",
        priceRub: 12345,
      },
    });
    const zone1 = entries.find((entry) => entry.zoneId === "base")!;
    expect(zone1.title).toBe("Тестовая зона 1");
    expect(zone1.priceRub).toBe(12345);

    // A zone with no override falls back to the built-in default metadata.
    const zone2 = entries.find((entry) => entry.zoneId === "7km")!;
    expect(zone2.title).toBe(DEFAULT_DELIVERY_ZONE_META["7km"].title);
  });
});

test.describe("DELIVERY_ZONES_CATALOG — single source of truth wiring", () => {
  test("applyDeliveryZoneOverrides mutates the catalog in place (stable array reference)", () => {
    const originalReference = DELIVERY_ZONES_CATALOG;
    const base = buildSyntheticBasePolygon();
    const rebuilt = rebuildDeliveryZoneCatalogEntries(base, DEFAULT_DELIVERY_ZONE_META);

    try {
      applyDeliveryZoneOverrides(rebuilt);

      // Same array object — every consumer that imported DELIVERY_ZONES_CATALOG
      // sees the update without re-importing anything.
      expect(DELIVERY_ZONES_CATALOG).toBe(originalReference);
      expect(DELIVERY_ZONES_CATALOG.find((z) => z.zoneId === "base")?.polygonCoordinates).toEqual(
        base,
      );
    } finally {
      resetDeliveryZonesCatalogToDefault();
    }

    expect(DELIVERY_ZONES_CATALOG).toBe(originalReference);
  });

  test("applyDeliveryZoneOverrides is a no-op for an invalid (wrong-length) list", () => {
    const before = DELIVERY_ZONES_CATALOG.map((zone) => zone.zoneId);
    applyDeliveryZoneOverrides([] as DeliveryZoneCatalogEntry[]);
    const after = DELIVERY_ZONES_CATALOG.map((zone) => zone.zoneId);
    expect(after).toEqual(before);
  });
});

test.describe("MKAD_POLYGON_COORDINATES override", () => {
  test("applyMkadPolygonOverride mutates in place and resetMkadPolygonToDefault restores it", () => {
    const originalReference = MKAD_POLYGON_COORDINATES;
    const customPolygon: GeoCoordinate[] = [
      { latitude: 55.7, longitude: 37.5 },
      { latitude: 55.75, longitude: 37.55 },
      { latitude: 55.72, longitude: 37.62 },
      { latitude: 55.68, longitude: 37.58 },
    ];

    try {
      applyMkadPolygonOverride(customPolygon);
      expect(MKAD_POLYGON_COORDINATES).toBe(originalReference);
      expect(MKAD_POLYGON_COORDINATES).toEqual(customPolygon);
    } finally {
      resetMkadPolygonToDefault();
    }

    expect(MKAD_POLYGON_COORDINATES).toBe(originalReference);
    expect(MKAD_POLYGON_COORDINATES).toEqual(DEFAULT_MKAD_POLYGON_COORDINATES);
  });

  test("applyMkadPolygonOverride rejects fewer than 3 points", () => {
    expect(() =>
      applyMkadPolygonOverride([{ latitude: 55.7, longitude: 37.5 }]),
    ).toThrow();
  });
});

test.describe("validateZonePolygon", () => {
  test("rejects fewer than 4 points", () => {
    const result = validateZonePolygon([
      { latitude: 55.7, longitude: 37.5 },
      { latitude: 55.75, longitude: 37.55 },
      { latitude: 55.72, longitude: 37.62 },
    ]);
    expect(result.valid).toBe(false);
  });

  test("accepts a simple convex quad", () => {
    const result = validateZonePolygon([
      { latitude: 55.7, longitude: 37.5 },
      { latitude: 55.75, longitude: 37.5 },
      { latitude: 55.75, longitude: 37.6 },
      { latitude: 55.7, longitude: 37.6 },
    ]);
    expect(result.valid).toBe(true);
  });

  test("rejects a self-intersecting (bowtie) ring", () => {
    const result = validateZonePolygon([
      { latitude: 55.7, longitude: 37.5 },
      { latitude: 55.75, longitude: 37.6 },
      { latitude: 55.75, longitude: 37.5 },
      { latitude: 55.7, longitude: 37.6 },
    ]);
    expect(result.valid).toBe(false);
  });
});
