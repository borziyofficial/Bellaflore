// ==================================================
// SECTION: DELIVERY ZONES
// РАЗДЕЛ: Live Delivery Experience — карточка checkout
// ==================================================
"use client";

import type { LiveAddressPreview } from "@/components/addressIntelligence/liveAddressPreviewTypes";
import { mapRealDeliveryZoneToIntelligence } from "@/components/deliveryZones/deliveryIntelligenceEngine";
import { DELIVERY_UNAVAILABLE_MESSAGE } from "@/components/deliveryZones/deliveryIntelligenceMessages";
import { getDeliveryZoneCatalogEntry } from "@/components/deliveryZones/deliveryZoneConfig";
import styles from "@/components/deliveryZones/LiveDeliveryExperienceCard.module.css";
import { resolveLiveDeliveryExperienceState } from "@/components/deliveryZones/liveDeliveryExperience";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";
import type { DeliveryValidationResult } from "@/components/deliveryValidation/deliveryValidationTypes";

type LiveDeliveryExperienceCardProps = {
  address: string;
  zoneResult: RealDeliveryZoneResult;
  validationResult: DeliveryValidationResult;
  formatPrice: (priceRub: number) => string;
  nearestIntervalLabel?: string | null;
  liveAddressPreview?: LiveAddressPreview | null;
  compact?: boolean;
};

export function LiveDeliveryExperienceCard({
  address,
  zoneResult,
  validationResult,
  formatPrice,
  nearestIntervalLabel = null,
  liveAddressPreview = null,
  compact = false,
}: LiveDeliveryExperienceCardProps) {
  const experience = resolveLiveDeliveryExperienceState({
    address,
    zoneResult,
    liveAddressPreview,
    validationResult,
  });

  if (!experience.showCard) {
    return null;
  }

  const displayAddress = address.trim();

  if (experience.isLoading) {
    return (
      <div
        className={`${styles.card} ${styles.cardLoading} ${
          compact ? styles.cardCompact : ""
        }`}
        aria-live="polite"
        aria-busy="true"
      >
        <p className={styles.loadingMessage} role="status">
          {experience.loadingMessage}
        </p>
      </div>
    );
  }

  const intelligence = mapRealDeliveryZoneToIntelligence(zoneResult, {
    addressConfirmed: true,
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
  const isAvailable = experience.phase === "ready";
  const zoneColor = catalogEntry?.color ?? "#34A853";

  if (!isAvailable) {
    return (
      <div
        className={`${styles.card} ${styles.cardUnavailable} ${
          compact ? styles.cardCompact : ""
        }`}
        aria-live="polite"
        role="status"
      >
        <p className={styles.resultLine}>
          <span className={styles.emoji} aria-hidden="true">
            📍
          </span>
          <span>{displayAddress}</span>
        </p>
        <p className={styles.unavailableLine}>
          <span className={styles.emoji} aria-hidden="true">
            ❌
          </span>
          <span>{DELIVERY_UNAVAILABLE_MESSAGE}</span>
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${styles.card} ${styles.cardReady} ${
        compact ? styles.cardCompact : ""
      }`}
      aria-live="polite"
      role="status"
    >
      <p className={styles.resultLine}>
        <span className={styles.emoji} aria-hidden="true">
          📍
        </span>
        <span className={styles.addressLine}>{displayAddress}</span>
      </p>
      <p className={styles.resultLine}>
        <span
          className={styles.zoneDot}
          style={{ backgroundColor: zoneColor }}
          aria-hidden="true"
        />
        <span className={styles.zoneLine}>{zoneTitle}</span>
      </p>
      <p className={styles.priceLine}>
        Стоимость доставки —{" "}
        <strong>
          {deliveryPrice !== null ? formatPrice(deliveryPrice) : "—"}
        </strong>
      </p>
      {!compact && nearestIntervalLabel ? (
        <p className={styles.metaLine}>
          Ближайший интервал: <strong>{nearestIntervalLabel}</strong>
        </p>
      ) : null}
    </div>
  );
}
