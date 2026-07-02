// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Delivery Intelligence — сообщения
//
// Purpose (EN): Checkout UX copy for delivery zone intelligence.
//
// Назначение (RU): UX-тексты для умной доставки в checkout.
// ==================================================
import type { DeliveryZoneCatalogEntry } from "@/components/deliveryZones/deliveryZonesCatalog";
import type { RealDeliveryZoneStatus } from "@/components/deliveryZones/realDeliveryZoneTypes";

export const DELIVERY_UNAVAILABLE_MESSAGE =
  "По этому адресу доставка пока недоступна. Свяжитесь с нами для уточнения.";

export const DELIVERY_ADDRESS_CONFIRMED_MESSAGE = "Адрес подтверждён";

export function formatDeliveryAvailableMessage(
  zone: Pick<DeliveryZoneCatalogEntry, "title" | "priceRub">,
): string {
  const priceLabel = zone.priceRub.toLocaleString("ru-RU");
  return `Доставка доступна. ${zone.title} — ${priceLabel} ₽`;
}

export function formatDeliveryStatusLabel(
  status: RealDeliveryZoneStatus,
): string {
  switch (status) {
    case "available":
      return "Доставка доступна";
    case "outside_delivery_area":
      return "Доставка недоступна";
    case "error":
      return "Не удалось определить зону";
    case "unknown":
    default:
      return "Уточняется";
  }
}
