// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Превью доставки на странице товара
//
// Purpose (EN): Read-only delivery hint without opening checkout.
//
// Назначение (RU): Краткая информация о доставке без открытия checkout.
// ==================================================
import { getAvailableDeliveryIntervals } from "@/components/checkout/deliveryIntervals";
import { mapRealDeliveryZoneToIntelligence } from "@/components/deliveryZones/deliveryIntelligenceEngine";
import { getDeliveryZoneCatalogEntry } from "@/components/deliveryZones/deliveryZoneConfig";
import { resolveNearestDeliveryIntervalLabel } from "@/components/deliveryZones/liveDeliveryExperience";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";
import styles from "@/components/product/ProductDeliveryPreview.module.css";

type ProductDeliveryPreviewProps = {
  deliveryAddress: string;
  zoneResult: RealDeliveryZoneResult;
  deliveryDate: string;
  deliveryTime: string;
  nearestFromConfidence: string | null;
  now: Date;
};

function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resolveDeliveryDayHint(now: Date): "today" | "tomorrow" {
  const todayValue = formatDateInputValue(now);
  const todayIntervals = getAvailableDeliveryIntervals(todayValue, now);

  if (todayIntervals.length > 0) {
    return "today";
  }

  return "tomorrow";
}

export function ProductDeliveryPreview({
  deliveryAddress,
  zoneResult,
  deliveryDate,
  deliveryTime,
  nearestFromConfidence,
  now,
}: ProductDeliveryPreviewProps) {
  const dayHint = resolveDeliveryDayHint(now);
  const trimmedAddress = deliveryAddress.trim();
  const hasKnownAddress =
    trimmedAddress.length > 0 &&
    zoneResult.status === "available" &&
    zoneResult.selectedZoneId !== null;

  const nearestInterval = resolveNearestDeliveryIntervalLabel({
    deliveryTime,
    deliveryDate,
    nearestFromConfidence,
    now,
  });

  if (hasKnownAddress) {
    const intelligence = mapRealDeliveryZoneToIntelligence(zoneResult, {
      addressConfirmed: true,
    });
    const catalogEntry = intelligence.zoneId
      ? getDeliveryZoneCatalogEntry(intelligence.zoneId)
      : null;
    const zoneTitle =
      intelligence.zoneTitle ?? catalogEntry?.title ?? "—";
    const deliveryPrice =
      intelligence.deliveryPriceRub ?? zoneResult.deliveryPriceRub;

    return (
      <div className={styles.preview}>
        <p className={styles.line}>
          <span aria-hidden="true">✓</span>
          <span>
            Зона доставки: <strong>{zoneTitle}</strong>
          </span>
        </p>
        <p className={styles.line}>
          <span aria-hidden="true">✓</span>
          <span>
            Стоимость:{" "}
            <strong>
              {deliveryPrice !== null
                ? `${deliveryPrice.toLocaleString("ru-RU")} ₽`
                : "—"}
            </strong>
          </span>
        </p>
        {nearestInterval ? (
          <p className={styles.line}>
            <span aria-hidden="true">✓</span>
            <span>
              Ближайший интервал: <strong>{nearestInterval}</strong>
            </span>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.preview}>
      <p className={styles.lineHighlight}>
        <span aria-hidden="true">✓</span>
        <span>
          {dayHint === "today" ? "Сегодня возможно" : "Завтра"}
        </span>
      </p>
      <p className={styles.note}>
        Точную зону и стоимость покажем при оформлении заказа.
      </p>
    </div>
  );
}
