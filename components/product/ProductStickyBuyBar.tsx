// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Sticky Buy Bar
//
// Purpose (EN): Mobile fixed buy bar with size, price, and favorites.
//
// Назначение (RU): Фиксированная панель покупки на mobile с размером и ценой.
// ==================================================
"use client";

import styles from "@/components/product/ProductStickyBuyBar.module.css";

type ProductStickyBuyBarProps = {
  sizeLabel: string;
  priceLabel: string;
  deliveryNote: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBuy: () => void;
};

export function ProductStickyBuyBar({
  sizeLabel,
  priceLabel,
  deliveryNote,
  isFavorite,
  onToggleFavorite,
  onBuy,
}: ProductStickyBuyBarProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.bar} role="toolbar" aria-label="Быстрая покупка">
        <div className={styles.priceBlock}>
          <p className={styles.priceMeta}>
            Размер {sizeLabel} · {priceLabel}
          </p>
          <p className={styles.deliveryNote}>{deliveryNote}</p>
        </div>

        <button
          type="button"
          className={`${styles.iconButton} ${
            isFavorite ? styles.iconButtonActive : ""
          }`}
          aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
          aria-pressed={isFavorite}
          onClick={onToggleFavorite}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className={styles.heartIcon}>
            <path d="M12 20.5s-7.3-4.4-9-9.2C1.9 8 3.9 5.2 7 5.2c1.8 0 3.1 1 4 2.2.9-1.2 2.2-2.2 4-2.2 3.1 0 5.1 2.8 4 6.1-1.7 4.8-9 9.2-9 9.2Z" />
          </svg>
        </button>

        <button type="button" className={styles.buyButton} onClick={onBuy}>
          Купить
        </button>
      </div>
    </div>
  );
}
