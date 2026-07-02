// ==================================================
// SECTION: DELIVERY CONFIDENCE
// РАЗДЕЛ: Уверенность доставки
//
// Purpose (EN):
// Checkout hint messages for delivery confidence states.
//
// Назначение (RU):
// Подсказки оформления заказа для состояний уверенности доставки.
// ==================================================
import type { DeliveryConfidenceResult } from "@/components/deliveryConfidence/deliveryConfidenceTypes";
import { isDeliveryConfidenceUiActive } from "@/components/deliveryConfidence/deliveryConfidenceEngine";

export function formatDeliveryConfidencePriceLabel(
  confidence: DeliveryConfidenceResult,
  formatPrice: (priceRub: number) => string,
): string {
  if (confidence.status === "outside_delivery_area") {
    return "—";
  }

  if (
    confidence.status !== "ready" &&
    confidence.status !== "minimum_order_not_met" &&
    confidence.status !== "disabled"
  ) {
    return "—";
  }

  const effectivePrice =
    confidence.status === "disabled"
      ? confidence.baseDeliveryPriceRub
      : confidence.effectiveDeliveryPriceRub;

  if (effectivePrice === null) {
    return "—";
  }

  if (confidence.freeDeliveryApplied && confidence.engineEnabled) {
    return confidence.freeDeliveryMessage;
  }

  return formatPrice(effectivePrice);
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export function getDeliveryConfidenceMessage(
  confidence: DeliveryConfidenceResult,
  formatPrice: (priceRub: number) => string,
): string | null {
  if (!isDeliveryConfidenceUiActive(confidence)) {
    return null;
  }

  if (confidence.restrictionMessage) {
    return confidence.restrictionMessage;
  }

  if (confidence.scheduleMessage) {
    return confidence.scheduleMessage;
  }

  if (confidence.status !== "ready") {
    return null;
  }

  const messageParts: string[] = [];

  if (confidence.zoneEstimatedDeliveryLabel) {
    messageParts.push(
      `Примерное время доставки: ${confidence.zoneEstimatedDeliveryLabel}`,
    );
  }

  if (confidence.freeDeliveryApplied) {
    messageParts.push(
      `${confidence.freeDeliveryMessage} применена по правилам BellaFlore`,
    );
  } else if (
    confidence.freeDeliveryRuleActive &&
    confidence.amountUntilFreeDelivery !== null &&
    confidence.amountUntilFreeDelivery > 0 &&
    confidence.freeDeliveryFromAmount !== null
  ) {
    messageParts.push(
      `${confidence.freeDeliveryMessage} от ${formatPrice(confidence.freeDeliveryFromAmount)} · осталось ${formatPrice(confidence.amountUntilFreeDelivery)}`,
    );
  }

  return messageParts.length > 0 ? messageParts.join(" · ") : null;
}

export function getDeliveryConfidenceSecondaryMessage(
  confidence: DeliveryConfidenceResult,
): string | null {
  if (!isDeliveryConfidenceUiActive(confidence)) {
    return null;
  }

  if (
    confidence.restrictionMessage &&
    confidence.scheduleMessage &&
    confidence.restrictionMessage !== confidence.scheduleMessage
  ) {
    return confidence.scheduleMessage;
  }

  if (
    confidence.nearestAvailableInterval &&
    !confidence.selectedIntervalWithinWorkingHours
  ) {
    return `Ближайший доступный интервал: ${confidence.nearestAvailableInterval}`;
  }

  if (
    confidence.zoneEstimatedDeliveryLabel &&
    (confidence.restrictionMessage || confidence.scheduleMessage)
  ) {
    return `Примерное время доставки: ${confidence.zoneEstimatedDeliveryLabel}`;
  }

  return null;
}
