// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: Delivery zone bridge
// ==================================================
import {
  DELIVERY_ZONES_CATALOG,
  type DeliveryZoneCatalogEntry,
} from "@/components/deliveryZones/deliveryZonesCatalog";

export function listDeliveryZoneCatalogEntries(): DeliveryZoneCatalogEntry[] {
  return DELIVERY_ZONES_CATALOG.filter((zone) => zone.isActive);
}

export function getDeliveryZoneCatalogEntry(
  zoneId: string | null | undefined,
): DeliveryZoneCatalogEntry | null {
  if (!zoneId) {
    return null;
  }

  return (
    DELIVERY_ZONES_CATALOG.find((zone) => zone.zoneId === zoneId) ?? null
  );
}

export function resolveDeliveryZonePriceRub(zoneId: string | null): number | null {
  return getDeliveryZoneCatalogEntry(zoneId)?.priceRub ?? null;
}

export function resolveDeliveryZoneEtaLabel(zoneId: string | null): string | null {
  return getDeliveryZoneCatalogEntry(zoneId)?.estimatedTime ?? null;
}

export function buildDeliveryZoneSnapshot(zoneId: string | null) {
  const zone = getDeliveryZoneCatalogEntry(zoneId);
  if (!zone) {
    return null;
  }

  return {
    zoneId: zone.zoneId,
    title: zone.title,
    label: zone.label,
    priceRub: zone.priceRub,
    estimatedTime: zone.estimatedTime,
    isBaseZone: zone.isBaseZone,
  };
}
