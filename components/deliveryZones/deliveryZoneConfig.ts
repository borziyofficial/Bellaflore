// ==================================================
// SECTION: CONFIG
// РАЗДЕЛ: Конфигурация
//
// Purpose (EN): Legacy delivery zone config derived from admin-ready catalog.
//
// Назначение (RU): Legacy-конфиг зон, производный от каталога для админки.
// ==================================================
import { DELIVERY_ZONES_CATALOG } from "@/components/deliveryZones/deliveryZonesCatalog";
import type { DeliveryZoneDefinition } from "@/components/deliveryZones/deliveryZoneTypes";

export { DELIVERY_ZONES_CATALOG } from "@/components/deliveryZones/deliveryZonesCatalog";
export {
  getDeliveryZoneMaxDistanceKm,
  getActiveDeliveryZones,
  getDeliveryZoneCatalogEntry,
  getDeliveryZonesForCity,
} from "@/components/deliveryZones/deliveryZonesCatalog";

// NOTE: this used to be a frozen array/const snapshotted once at module
// import time — which meant admin-saved zone boundaries (hydrated into
// DELIVERY_ZONES_CATALOG later, in place) were invisible here forever
// after the first import. It is now a function so every caller always
// reads the current (possibly DB-hydrated) catalog.
export function getDeliveryZoneDefinitions(): DeliveryZoneDefinition[] {
  return DELIVERY_ZONES_CATALOG.map((zone) => ({
    zoneId: zone.zoneId,
    label: zone.label,
    color: zone.color,
    maxDistanceFromBaseKm: zone.maxDistanceFromBaseKm,
    priceRub: zone.priceRub,
    isBaseZone: zone.isBaseZone,
    sortOrder: zone.sortOrder,
  }));
}

export function getDeliveryZoneById(
  zoneId: DeliveryZoneDefinition["zoneId"],
): DeliveryZoneDefinition | null {
  return (
    getDeliveryZoneDefinitions().find((zone) => zone.zoneId === zoneId) ?? null
  );
}
