// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Сводки аккордеонов
//
// Purpose (EN): Short summary labels for collapsed checkout panels.
//
// Назначение (RU): Краткие подписи для закрытых панелей checkout.
// ==================================================
import type { DeliveryDatePreset } from "@/components/checkout/checkoutTypes";
import type { DeliveryValidationResult } from "@/components/deliveryValidation/deliveryValidationTypes";
import { mapRealDeliveryZoneToIntelligence } from "@/components/deliveryZones/deliveryIntelligenceEngine";
import {
  getCheckoutDeliveryZoneName,
  isCheckoutDeliveryZoneResolved,
} from "@/components/deliveryZones/deliveryZoneCheckoutLabels";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";

type RecipientSummaryInput = {
  isOtherRecipient: boolean;
  customerName: string;
  recipientName: string;
  anonymousDelivery: boolean;
};

type DeliverySummaryInput = {
  deliveryDateLabel: string;
  deliveryTime: string;
};

type AddressSummaryInput = {
  address: string;
  zoneResult?: RealDeliveryZoneResult | null;
};

type MapSummaryInput = {
  validationResult: DeliveryValidationResult;
  zoneResult: RealDeliveryZoneResult;
};

type CommentSummaryInput = {
  orderComment: string;
  cardMessage: string;
  wantsCard: boolean;
  courierComment: string;
  isOtherRecipient: boolean;
};

function truncateSummary(value: string, maxLength = 42): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

export function buildRecipientAccordionSummary({
  isOtherRecipient,
  customerName,
  recipientName,
  anonymousDelivery,
}: RecipientSummaryInput): string | null {
  if (isOtherRecipient) {
    if (recipientName.trim()) {
      return truncateSummary(recipientName);
    }

    return "Другой получатель";
  }

  if (customerName.trim()) {
    return truncateSummary(customerName);
  }

  if (anonymousDelivery) {
    return "Анонимная доставка";
  }

  return "Вы";
}

export function buildDeliveryAccordionSummary({
  deliveryDateLabel,
  deliveryTime,
}: DeliverySummaryInput): string | null {
  const parts = [
    deliveryDateLabel !== "Выбрать дату" ? deliveryDateLabel : null,
    deliveryTime.trim() || null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" • ") : null;
}

export function buildAddressAccordionSummary({
  address,
  zoneResult = null,
}: AddressSummaryInput): string | null {
  if (!address.trim()) {
    return null;
  }

  if (zoneResult?.status === "available" && zoneResult.selectedZoneId) {
    const intelligence = mapRealDeliveryZoneToIntelligence(zoneResult, {
      addressConfirmed: true,
    });
    const zoneTitle = intelligence.zoneTitle ?? getCheckoutDeliveryZoneName(zoneResult);
    const pricePart =
      zoneResult.deliveryPriceRub !== null
        ? `${zoneResult.deliveryPriceRub} ₽`
        : null;

    if (pricePart) {
      return `${truncateSummary(address, 22)} • ${zoneTitle} • ${pricePart}`;
    }

    return `${zoneTitle} • ${truncateSummary(address, 28)}`;
  }

  return truncateSummary(address);
}

export function buildMapAccordionSummary({
  validationResult,
  zoneResult,
}: MapSummaryInput): string | null {
  const addressConfirmed =
    validationResult.status === "VALID" ||
    validationResult.status === "WARNING";

  if (addressConfirmed && zoneResult.status === "available") {
    const intelligence = mapRealDeliveryZoneToIntelligence(zoneResult, {
      addressConfirmed: true,
    });
    return intelligence.zoneTitle ?? "Адрес подтверждён";
  }

  if (addressConfirmed) {
    return "Адрес подтверждён";
  }

  if (isCheckoutDeliveryZoneResolved(zoneResult)) {
    return getCheckoutDeliveryZoneName(zoneResult);
  }

  return null;
}

export function buildPaymentAccordionSummary(
  paymentLabel = "Наличными при получении",
): string {
  return paymentLabel;
}

export function buildCommentAccordionSummary({
  orderComment,
  cardMessage,
  wantsCard,
  courierComment,
  isOtherRecipient,
}: CommentSummaryInput): string | null {
  if (wantsCard && cardMessage.trim()) {
    return truncateSummary(cardMessage);
  }

  if (orderComment.trim()) {
    return truncateSummary(orderComment);
  }

  if (isOtherRecipient && courierComment.trim()) {
    return truncateSummary(courierComment);
  }

  if (wantsCard) {
    return "С открыткой";
  }

  return null;
}

export function buildSummaryAccordionSummary(
  grandTotalLabel: string | null,
): string | null {
  return grandTotalLabel;
}

export function getDeliveryDateLabel(
  deliveryDateMode: DeliveryDatePreset,
  deliveryDate: string,
): string {
  if (deliveryDateMode === "today") {
    return "Сегодня";
  }

  if (deliveryDateMode === "tomorrow") {
    return "Завтра";
  }

  if (deliveryDate.trim()) {
    return deliveryDate.trim();
  }

  return "Выбрать дату";
}
