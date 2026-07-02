// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Блок доверия
//
// Purpose (EN): Compact premium trust signals on the product page.
//
// Назначение (RU): Компактные блоки доверия на странице товара.
// ==================================================
"use client";

import styles from "@/components/product/ProductTrustStrip.module.css";

const TRUST_ITEMS = [
  { id: "today", label: "Доставка сегодня" },
  { id: "fresh", label: "Свежие цветы" },
  { id: "craft", label: "Аккуратная сборка" },
  { id: "photo", label: "Фото перед доставкой" },
  { id: "support", label: "Поддержка в мессенджерах" },
] as const;

export function ProductTrustStrip() {
  return (
    <ul className={styles.strip} aria-label="Преимущества BellaFlore">
      {TRUST_ITEMS.map((item) => (
        <li key={item.id} className={styles.item}>
          <span className={styles.dot} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
