// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Блок покупки
//
// Purpose (EN): Premium conversion block with size, price, buy, and favorites.
//
// Назначение (RU): Премиальный блок покупки с размером, ценой и избранным.
// ==================================================
"use client";

import styles from "@/components/product/ProductBuyPanel.module.css";

type ProductBuyPanelProps = {
  sizeLabel: string;
  priceLabel: string;
  deliveryNote: string;
  isFavorite: boolean;
  onBuy: () => void;
  onToggleFavorite: () => void;
};

export function ProductBuyPanel({
  sizeLabel,
  priceLabel,
  deliveryNote,
  isFavorite,
  onBuy,
  onToggleFavorite,
}: ProductBuyPanelProps) {
  return (
    <section className={styles.panel} aria-label="Оформление покупки">
      <div className={styles.selection}>
        <span className={styles.selectionLabel}>Размер {sizeLabel}</span>
        <strong className={styles.selectionPrice}>{priceLabel}</strong>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.buyButton} onClick={onBuy}>
          Купить
        </button>
        <button
          type="button"
          className={`${styles.favoriteButton} ${isFavorite ? styles.favoriteButtonActive : ""}`}
          aria-pressed={isFavorite}
          onClick={onToggleFavorite}
        >
          {isFavorite ? "В избранном" : "В избранное"}
        </button>
      </div>

      <p className={styles.deliveryNote}>{deliveryNote}</p>
    </section>
  );
}
