// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Delivery Intelligence — checkout preview
//
// Purpose (EN): Checkout status block for zone / price / delivery availability.
//
// Назначение (RU): Блок статуса зоны, цены и доступности в checkout.
// ==================================================
"use client";

import {
  DELIVERY_ADDRESS_CONFIRMED_MESSAGE,
  DELIVERY_UNAVAILABLE_MESSAGE,
  formatDeliveryStatusLabel,
} from "@/components/deliveryZones/deliveryIntelligenceMessages";
import { mapRealDeliveryZoneToIntelligence } from "@/components/deliveryZones/deliveryIntelligenceEngine";
import styles from "@/components/deliveryZones/DeliveryIntelligencePreview.module.css";
import { getDeliveryZoneCatalogEntry } from "@/components/deliveryZones/deliveryZoneConfig";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";
import type { DeliveryValidationResult } from "@/components/deliveryValidation/deliveryValidationTypes";

type DeliveryIntelligencePreviewProps = {
  zoneResult: RealDeliveryZoneResult;
  validationResult: DeliveryValidationResult;
  formatPrice: (priceRub: number) => string;
};

function isAddressConfirmed(validationResult: DeliveryValidationResult): boolean {
  return (
    validationResult.status === "VALID" || validationResult.status === "WARNING"
  );
}

export function DeliveryIntelligencePreview({
  zoneResult,
  validationResult,
  formatPrice,
}: DeliveryIntelligencePreviewProps) {
  const addressConfirmed = isAddressConfirmed(validationResult);
  const intelligence = mapRealDeliveryZoneToIntelligence(zoneResult, {
    addressConfirmed,
  });
  const catalogEntry = intelligence.zoneId
    ? getDeliveryZoneCatalogEntry(intelligence.zoneId)
    : null;
  const zoneTitle =
    intelligence.zoneTitle ??
    catalogEntry?.title ??
    zoneResult.selectedZoneLabel ??
    "—";
  const deliveryPrice =
    intelligence.deliveryPriceRub ?? zoneResult.deliveryPriceRub;
  const statusLabel = formatDeliveryStatusLabel(intelligence.deliveryStatus);
  const headlineMessage =
    intelligence.deliveryStatus === "available"
      ? intelligence.message
      : intelligence.deliveryStatus === "outside_delivery_area"
        ? DELIVERY_UNAVAILABLE_MESSAGE
        : intelligence.message;

  return (
    <div className={styles.intelligencePanel} aria-live="polite">
      <p className={styles.intelligenceHeadline} role="status">
        {headlineMessage}
      </p>

      <ul className={styles.intelligenceChecklist}>
        <li
          className={
            addressConfirmed ? styles.checklistItemDone : styles.checklistItemPending
          }
        >
          <span aria-hidden="true">{addressConfirmed ? "✓" : "○"}</span>
          {DELIVERY_ADDRESS_CONFIRMED_MESSAGE}
        </li>
        <li
          className={
            intelligence.zoneId
              ? styles.checklistItemDone
              : styles.checklistItemPending
          }
        >
          <span aria-hidden="true">{intelligence.zoneId ? "✓" : "○"}</span>
          Зона доставки: {zoneTitle}
        </li>
        <li
          className={
            deliveryPrice !== null
              ? styles.checklistItemDone
              : styles.checklistItemPending
          }
        >
          <span aria-hidden="true">{deliveryPrice !== null ? "✓" : "○"}</span>
          Стоимость доставки:{" "}
          {deliveryPrice !== null ? formatPrice(deliveryPrice) : "—"}
        </li>
        <li
          className={
            intelligence.deliveryStatus === "available"
              ? styles.checklistItemDone
              : intelligence.deliveryStatus === "outside_delivery_area"
                ? styles.checklistItemError
                : styles.checklistItemPending
          }
        >
          <span aria-hidden="true">
            {intelligence.deliveryStatus === "available" ? "✓" : "○"}
          </span>
          Статус доставки: {statusLabel}
        </li>
      </ul>
    </div>
  );
}
