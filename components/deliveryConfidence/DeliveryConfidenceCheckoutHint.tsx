// ==================================================
// SECTION: DELIVERY
// РАЗДЕЛ: Доставка
//
// Purpose (EN):
// Checkout hints for delivery confidence and pricing
//
// Назначение (RU):
// Подсказки уверенности доставки в оформлении
// ==================================================
"use client";

import {
  formatDeliveryConfidencePriceLabel,
  getDeliveryConfidenceMessage,
  getDeliveryConfidenceSecondaryMessage,
} from "@/components/deliveryConfidence/deliveryConfidenceMessages";
import type { DeliveryConfidenceResult } from "@/components/deliveryConfidence/deliveryConfidenceTypes";
import styles from "@/components/deliveryConfidence/DeliveryConfidenceCheckoutHint.module.css";

type DeliveryConfidenceCheckoutHintProps = {
  confidence: DeliveryConfidenceResult;
  formatPrice: (priceRub: number) => string;
};

export function DeliveryConfidenceCheckoutHint({
  confidence,
  formatPrice,
}: DeliveryConfidenceCheckoutHintProps) {
  const message = getDeliveryConfidenceMessage(confidence, formatPrice);
  const secondaryMessage = getDeliveryConfidenceSecondaryMessage(confidence);

  if (!message && !secondaryMessage) {
    return null;
  }

  return (
    <div className={styles.hintGroup}>
      {message ? (
        <p
          className={`${styles.hint} ${
            confidence.restrictionMessage || confidence.scheduleMessage
              ? styles.hintRestriction
              : confidence.freeDeliveryApplied
                ? styles.hintApplied
                : styles.hintPending
          }`}
          role="status"
        >
          {message}
        </p>
      ) : null}
      {secondaryMessage ? (
        <p className={styles.secondaryHint} role="status">
          {secondaryMessage}
        </p>
      ) : null}
    </div>
  );
}

export { formatDeliveryConfidencePriceLabel };
