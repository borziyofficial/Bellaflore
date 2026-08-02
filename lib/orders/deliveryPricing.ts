import { detectDeliveryZoneByPolygon } from "@/components/deliveryZones/deliveryZonePolygonEngine";
import { OrderError } from "@/lib/orders/errors";

export type ServerDeliveryPrice = {
  zoneId: string;
  cost: number;
};

export function calculateServerDeliveryPrice(
  latitude: number,
  longitude: number,
): ServerDeliveryPrice {
  const { zone } = detectDeliveryZoneByPolygon({ latitude, longitude });
  if (!zone || !Number.isSafeInteger(zone.priceRub) || zone.priceRub < 0) {
    throw new OrderError(
      "DELIVERY_OUTSIDE_AREA",
      "Адрес находится вне доступной зоны доставки.",
      422,
    );
  }
  return { zoneId: zone.zoneId, cost: zone.priceRub };
}
