// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Открытая информация о товаре
// ==================================================
"use client";

import { useState } from "react";
import type { ProductExperienceData } from "@/components/product/productExperienceTypes";
import styles from "@/components/product/ProductInformation.module.css";

type ProductInformationProps = {
  data: ProductExperienceData;
};

const COMPACT_TEXT_LENGTH = 140;

type CompactCopyProps = {
  children: string;
};

function CompactCopy({ children }: CompactCopyProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = children.length > COMPACT_TEXT_LENGTH;

  return (
    <div className={styles.copyBlock}>
      <div className={isLong && !expanded ? styles.copyCollapsed : undefined}>
        <p>{children}</p>
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
            <CompactCopy>{data.whatsIncluded}</CompactCopy>
          </dd>
        </div>
      </dl>
    </div>
  );
}
