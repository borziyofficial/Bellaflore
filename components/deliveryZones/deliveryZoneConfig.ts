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
  DELIVERY_ZONE_MAX_DISTANCE_KM,
  getActiveDeliveryZones,
  getDeliveryZoneCatalogEntry,
  getDeliveryZonesForCity,
} from "@/components/deliveryZones/deliveryZonesCatalog";

export const DELIVERY_ZONE_DEFINITIONS: DeliveryZoneDefinition[] =
  DELIVERY_ZONES_CATALOG.map((zone) => ({
    zoneId: zone.zoneId,
    label: zone.label,
    color: zone.color,
    maxDistanceFromBaseKm: zone.maxDistanceFromBaseKm,
    priceRub: zone.priceRub,
    isBaseZone: zone.isBaseZone,
    sortOrder: zone.sortOrder,
  }));

export function getDeliveryZoneById(
  zoneId: DeliveryZoneDefinition["zoneId"],
): DeliveryZoneDefinition | null {
  return (
    DELIVERY_ZONE_DEFINITIONS.find((zone) => zone.zoneId === zoneId) ?? null
  );
}
