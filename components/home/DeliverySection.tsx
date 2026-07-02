// ==================================================
// SECTION: DELIVERY
// РАЗДЕЛ: Доставка — статическая информация на главной
//
// Purpose (EN): Marketing-only delivery info. Live address lives in Checkout.
//
// Назначение (RU): Только маркетинговая информация. Живой адрес — в Checkout.
// ==================================================
"use client";

import { getActiveDeliveryZones } from "@/components/deliveryZones/deliveryZoneConfig";
import mapStyles from "@/components/deliveryZones/DeliverySectionMap.module.css";
import styles from "@/components/home/DeliverySection.module.css";
import { useMemo, useState } from "react";

export function DeliverySection() {
  const [expanded, setExpanded] = useState(false);
  const activeZones = useMemo(() => getActiveDeliveryZones(), []);
  const minimumDeliveryPriceRub = useMemo(
    () =>
      activeZones.reduce(
        (minimum, zone) => Math.min(minimum, zone.priceRub),
        activeZones[0]?.priceRub ?? 790,
      ),
    [activeZones],
  );

  return (
    <section id="delivery" className={`delivery ${styles.section}`}>
      <div className={mapStyles.block}>
        <button
          type="button"
          className={mapStyles.expandRow}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          <span className={mapStyles.expandTitle}>
            Доставка по Москве и Московской области
          </span>
          <span className={mapStyles.expandIcon} aria-hidden="true">
            {expanded ? "−" : "+"}
          </span>
        </button>

        {expanded ? (
          <div className={`${mapStyles.expandedHost} ${styles.staticCopy}`}>
            <p className={styles.lead}>
              Курьерская доставка по Москве и ближайшему Подмосковью.
            </p>
            <p className={styles.highlight}>
              Стоимость доставки от{" "}
              {minimumDeliveryPriceRub.toLocaleString("ru-RU")} ₽
            </p>
            <div className={styles.zoneList}>
              <p className={styles.zoneListTitle}>Зоны доставки</p>
              <ul>
                {activeZones.map((zone) => (
                  <li key={zone.zoneId}>
                    {zone.label} — от {zone.priceRub.toLocaleString("ru-RU")} ₽
                  </li>
                ))}
              </ul>
            </div>
            <p className={styles.sameDay}>
              Доставка в день заказа — при оформлении до 18:00, если остались
              свободные интервалы.
            </p>
            <p className={styles.checkoutNote}>
              Точный адрес, зону и итоговую стоимость рассчитываем при
              оформлении заказа.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
