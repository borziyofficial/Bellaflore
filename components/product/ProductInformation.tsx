// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Открытая информация о товаре
// ==================================================
"use client";

import { useState } from "react";
import { ProductDeliveryPreview } from "@/components/product/ProductDeliveryPreview";
import type { ProductExperienceData } from "@/components/product/productExperienceTypes";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";
import styles from "@/components/product/ProductInformation.module.css";

type ProductInformationProps = {
  data: ProductExperienceData;
  deliveryAddress: string;
  zoneResult: RealDeliveryZoneResult;
  deliveryDate: string;
  deliveryTime: string;
  nearestFromConfidence: string | null;
  checkoutNow: Date;
};

const COMPACT_TEXT_LENGTH = 140;

type CompactCopyProps = {
  children: string;
  secondary?: string;
};

function CompactCopy({ children, secondary }: CompactCopyProps) {
  const [expanded, setExpanded] = useState(false);
  const combinedCopy = secondary ? `${children} ${secondary}` : children;
  const isLong = combinedCopy.length > COMPACT_TEXT_LENGTH;

  return (
    <div className={styles.copyBlock}>
      <div className={isLong && !expanded ? styles.copyCollapsed : undefined}>
        <p>{children}</p>
        {secondary ? <p className={styles.guarantee}>{secondary}</p> : null}
      </div>
      {isLong ? (
        <button
          type="button"
          className={styles.moreButton}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Скрыть" : "Подробнее"}
        </button>
      ) : null}
    </div>
  );
}

export function ProductInformation({
  data,
  deliveryAddress,
  zoneResult,
  deliveryDate,
  deliveryTime,
  nearestFromConfidence,
  checkoutNow,
}: ProductInformationProps) {
  return (
    <div className={styles.information} aria-label="Информация о букете">
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Состав</dt>
          <dd><CompactCopy>{data.composition}</CompactCopy></dd>
        </div>

        <div className={styles.row}>
          <dt>Уход</dt>
          <dd><CompactCopy>{data.careNote}</CompactCopy></dd>
        </div>

        <div className={styles.row}>
          <dt>В заказе</dt>
          <dd>
            <CompactCopy secondary={data.freshnessGuarantee}>
              {data.whatsIncluded}
            </CompactCopy>
          </dd>
        </div>

        <div className={styles.row}>
          <dt>Доставка</dt>
          <dd>
            <p>{data.deliveryNote}</p>
            <ProductDeliveryPreview
              deliveryAddress={deliveryAddress}
              zoneResult={zoneResult}
              deliveryDate={deliveryDate}
              deliveryTime={deliveryTime}
              nearestFromConfidence={nearestFromConfidence}
              now={checkoutNow}
            />
          </dd>
        </div>
      </dl>
    </div>
  );
}
