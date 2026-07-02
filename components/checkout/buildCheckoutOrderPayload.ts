// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Оформление заказа
//
// Purpose (EN): Checkout form validation, payload building, and order preview.
//
// Назначение (RU): Валидация формы, сбор payload и превью заказа при оформлении.
// ==================================================
import type {
  CheckoutForm,
  CheckoutOrderPayload,
} from "@/components/checkout/checkoutTypes";
import {
  buildAddressCoordinatesPayload,
  getDeliveryZoneTitleById,
} from "@/components/deliveryZones/deliveryIntelligenceEngine";
import { formatDeliveryStatusLabel } from "@/components/deliveryZones/deliveryIntelligenceMessages";
import type { DeliveryPriceResult } from "@/components/deliveryZones/deliveryPriceTypes";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";
import {
  buildDeliveryValidationOrderFields,
  canSubmitCheckoutWithDeliveryValidation,
} from "@/components/deliveryValidation/deliveryValidationEngine";
import type { DeliveryValidationResult } from "@/components/deliveryValidation/deliveryValidationTypes";
import type { DeliveryConfidenceResult } from "@/components/deliveryConfidence/deliveryConfidenceTypes";
import { isCheckoutFormReady } from "@/components/checkout/validateCheckoutForm";

type CheckoutPayloadCartItem = {
  bouquet: {
    id: string;
    title: string;
    priceRub: number;
  };
  sizeId: string;
  sizeLabel: string;
  quantity: number;
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function buildDeliveryZonePayloadFields(
  deliveryPriceResult: DeliveryPriceResult,
  realZoneResult: RealDeliveryZoneResult,
  deliveryConfidenceResult?: DeliveryConfidenceResult | null,
): Pick<
  CheckoutOrderPayload,
  | "deliveryZoneId"
  | "deliveryZoneLabel"
  | "deliveryZoneTitle"
  | "deliveryZonePriceRub"
  | "deliveryZoneDistanceKm"
  | "deliveryZoneRoadDistanceKm"
  | "deliveryZoneRoadDurationMinutes"
  | "deliveryZoneStatus"
  | "deliveryZoneDetectionMode"
  | "deliveryStatus"
  | "addressLatitude"
  | "addressLongitude"
> {
  if (deliveryPriceResult.status !== "ready") {
    const coordinates = buildAddressCoordinatesPayload(realZoneResult);

    return {
      deliveryZoneStatus: deliveryPriceResult.status,
      deliveryZoneDetectionMode: realZoneResult.detectionMode,
      deliveryStatus: formatDeliveryStatusLabel(realZoneResult.status),
      addressLatitude: coordinates?.latitude,
      addressLongitude: coordinates?.longitude,
    };
  }

  const effectiveDeliveryPriceRub =
    deliveryConfidenceResult?.status === "ready" &&
    deliveryConfidenceResult.effectiveDeliveryPriceRub !== null
      ? deliveryConfidenceResult.effectiveDeliveryPriceRub
      : deliveryPriceResult.deliveryPriceRub;

  const coordinates = buildAddressCoordinatesPayload(realZoneResult);

  return {
    deliveryZoneId: deliveryPriceResult.deliveryZoneId ?? undefined,
    deliveryZoneLabel: deliveryPriceResult.deliveryZoneLabel ?? undefined,
    deliveryZoneTitle:
      getDeliveryZoneTitleById(deliveryPriceResult.deliveryZoneId) ??
      undefined,
    deliveryZonePriceRub: effectiveDeliveryPriceRub ?? undefined,
    deliveryZoneDistanceKm: deliveryPriceResult.distanceFromBaseKm ?? undefined,
    deliveryZoneRoadDistanceKm: deliveryPriceResult.roadDistanceKm ?? undefined,
    deliveryZoneRoadDurationMinutes:
      deliveryPriceResult.roadDurationMinutes ?? undefined,
    deliveryZoneStatus: deliveryPriceResult.status,
    deliveryZoneDetectionMode: realZoneResult.detectionMode,
    deliveryStatus: formatDeliveryStatusLabel(realZoneResult.status),
    addressLatitude: coordinates?.latitude,
    addressLongitude: coordinates?.longitude,
  };
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildCheckoutOrderPayload(
  checkoutForm: CheckoutForm,
  cartBouquets: CheckoutPayloadCartItem[],
  now = new Date(),
  deliveryPriceResult?: DeliveryPriceResult | null,
  realZoneResult?: RealDeliveryZoneResult | null,
  deliveryValidationResult?: DeliveryValidationResult | null,
  deliveryConfidenceResult?: DeliveryConfidenceResult | null,
): CheckoutOrderPayload | null {
  if (!isCheckoutFormReady(checkoutForm, cartBouquets.length > 0, now)) {
    return null;
  }

  if (!deliveryPriceResult || !realZoneResult || !deliveryValidationResult) {
    return null;
  }

  if (deliveryPriceResult.status !== "ready") {
    return null;
  }

  if (!canSubmitCheckoutWithDeliveryValidation(deliveryValidationResult)) {
    return null;
  }

  return {
    items: cartBouquets.map((cartItem) => ({
      bouquetId: cartItem.bouquet.id,
      title: cartItem.bouquet.title,
      sizeId: cartItem.sizeId,
      sizeLabel: cartItem.sizeLabel,
      priceRub: cartItem.bouquet.priceRub,
      quantity: cartItem.quantity,
    })),
    customerName: checkoutForm.name.trim(),
    phone: checkoutForm.phone.trim(),
    deliveryAddress: checkoutForm.address.trim(),
    deliveryDate: checkoutForm.deliveryDate.trim(),
    deliveryInterval: checkoutForm.deliveryTime.trim(),
    comment: checkoutForm.comment.trim(),
    ...buildDeliveryZonePayloadFields(
      deliveryPriceResult,
      realZoneResult,
      deliveryConfidenceResult,
    ),
    ...buildDeliveryValidationOrderFields(deliveryValidationResult),
  };
}
