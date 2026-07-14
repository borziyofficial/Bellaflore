// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Информация о товаре
// ==================================================
"use client";

import { useState } from "react";
import { ProductDeliveryPreview } from "@/components/product/ProductDeliveryPreview";
import type { ProductExperienceData } from "@/components/product/productExperienceTypes";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";
import styles from "@/components/product/ProductAccordions.module.css";

type ProductAccordionsProps = {
  data: ProductExperienceData;
  deliveryAddress: string;
  zoneResult: RealDeliveryZoneResult;
  deliveryDate: string;
  deliveryTime: string;
  nearestFromConfidence: string | null;
  checkoutNow: Date;
};

const COLLAPSIBLE_DESCRIPTION_LENGTH = 180;

export function ProductAccordions({
  data,
  deliveryAddress,
  zoneResult,
  deliveryDate,
  deliveryTime,
  nearestFromConfidence,
  checkoutNow,
}: ProductAccordionsProps) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const descriptionIsLong = data.description.length > COLLAPSIBLE_DESCRIPTION_LENGTH;

  return (
    <div className={styles.information}>
      {data.description ? (
        <section className={styles.descriptionSection}>
          <h3 className={styles.title}>Описание</h3>
          <p
            id="product-long-description"
            className={`${styles.copy} ${
              descriptionIsLong && !descriptionExpanded ? styles.copyCollapsed : ""
            }`}
          >
            {data.description}
          </p>
          {descriptionIsLong ? (
            <button
              type="button"
              className={styles.readMore}
              aria-expanded={descriptionExpanded}
              aria-controls="product-long-description"
              onClick={() => setDescriptionExpanded((current) => !current)}
            >
              {descriptionExpanded ? "Свернуть ▲" : "Читать далее ▼"}
            </button>
          ) : null}
        </section>
      ) : null}

      <section className={styles.section}>
        <h3 className={styles.title}>Состав букета</h3>
        <p className={styles.copy}>{data.composition}</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.title}>Доставка</h3>
        <p className={styles.copy}>{data.deliveryNote}</p>
        <ProductDeliveryPreview
          deliveryAddress={deliveryAddress}
          zoneResult={zoneResult}
          deliveryDate={deliveryDate}
          deliveryTime={deliveryTime}
          nearestFromConfidence={nearestFromConfidence}
          now={checkoutNow}
        />
      </section>

      <section className={styles.section}>
        <h3 className={styles.title}>Уход за цветами</h3>
        <p className={styles.copy}>{data.careNote}</p>
      </section>

      <section className={styles.section}>
        <h3 className={styles.title}>Что входит в заказ</h3>
        <p className={styles.copy}>{data.whatsIncluded}</p>
        <p className={styles.guarantee}>{data.freshnessGuarantee}</p>
      </section>
    </div>
  );
}
