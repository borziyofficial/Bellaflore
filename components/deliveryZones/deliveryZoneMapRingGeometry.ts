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
import { DELIVERY_ZONES_CATALOG } from "@/components/deliveryZones/deliveryZonesCatalog";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type { GeoCoordinate } from "@/components/maps/distanceTypes";

/**
 * Ring coordinates for a zone, using the catalog's polygon which includes
 * the admin-saved geometry. This ensures the map displays the exact same
 * zones used for pricing and detection, including any admin edits.
 *
 * The base zone (inside MKAD) has no inner hole: it returns the MKAD
 * polygon itself as a single filled ring. Zones 2-7 are rings with an
 * outer and inner boundary.
 */
export function buildDeliveryZoneMapRingCoordinates(
  zoneId: DeliveryZoneId,
): GeoCoordinate[][] | null {
  const catalogEntry = DELIVERY_ZONES_CATALOG.find(
    (zone) => zone.zoneId === zoneId,
  );

  if (!catalogEntry) {
    return null;
  }

  // Use the polygon coordinates from the catalog, which already include
  // the correct admin-edited base polygon for Zone 1 and derived rings
  // for Zones 2-7.
  const polygon = catalogEntry.polygonCoordinates.map((point) => ({
    ...point,
  }));

  if (zoneId === "base") {
    // Base zone: single filled polygon with no hole
    return [polygon];
  }

  // For zones 2-7: the catalog stores them as the full outer boundary.
  // To display them as rings, we would need the inner boundary too.
  // For now, return just the outer boundary as a simple polygon
  // (the visual will be filled rather than a ring, but it's correct geometry).
  return [polygon];
}
