// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Выбор размера
//
// Purpose (EN): Premium size selector with full and compact card layouts.
//
// Назначение (RU): Выбор размера для карточки и страницы товара.
// ==================================================
"use client";

import type {
  ProductSizeId,
  ProductSizeVariant,
} from "@/components/product/productExperienceTypes";
import styles from "@/components/product/ProductSizeSelector.module.css";

type ProductSizeSelectorProps = {
  variants: ProductSizeVariant[];
  selectedSizeId: ProductSizeId;
  onSelectSize: (sizeId: ProductSizeId) => void;
  layout?: "full" | "compact";
  formatPrice?: (priceRub: number) => string;
  visibleSizeIds?: ProductSizeId[];
  showSelectedPrice?: boolean;
  ariaLabel?: string;
};

function formatFallbackPrice(priceRub: number) {
  return `${priceRub.toLocaleString("ru-RU")} ₽`;
}

export function ProductSizeSelector({
  variants,
  selectedSizeId,
  onSelectSize,
  layout = "full",
  formatPrice = formatFallbackPrice,
  visibleSizeIds,
  showSelectedPrice = true,
  ariaLabel = "Выбор размера",
}: ProductSizeSelectorProps) {
  const selectedVariant =
    variants.find((variant) => variant.sizeId === selectedSizeId) ??
    variants[0];

  if (!selectedVariant) {
    return null;
  }

  const visibleVariants = variants.filter((variant) =>
    visibleSizeIds ? visibleSizeIds.includes(variant.sizeId) : true,
  );
  const showSizeButtons = visibleVariants.length > 1;

  if (layout === "compact") {
    return (
      <div
        className={`${styles.selector} ${styles.compact}`}
        role="group"
        aria-label={ariaLabel}
      >
        {showSelectedPrice ? (
          <div className={styles.compactPriceRow}>
            <span className={styles.compactSizeLabel}>
              Размер {selectedVariant.label}
            </span>
            <strong className={styles.compactPrice}>
              {formatPrice(selectedVariant.priceRub)}
            </strong>
          </div>
        ) : null}
        {showSizeButtons ? (
          <div className={styles.compactOptions}>
            {visibleVariants.map((variant) => {
              const isActive = variant.sizeId === selectedSizeId;

              return (
                <button
                  key={variant.sizeId}
                  type="button"
                  className={`${styles.compactOption} ${isActive ? styles.compactOptionActive : ""}`}
                  aria-pressed={isActive}
                  aria-label={`Размер ${variant.label}, ${formatPrice(variant.priceRub)}`}
                  onClick={() => onSelectSize(variant.sizeId)}
                >
                  {variant.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.selector}>
      <p className={styles.label}>Размер</p>
      <div className={styles.options} role="group" aria-label={ariaLabel}>
        {visibleVariants.map((variant) => {
          const isActive = variant.sizeId === selectedSizeId;

          return (
            <button
              key={variant.sizeId}
              type="button"
              className={`${styles.option} ${isActive ? styles.optionActive : ""}`}
              aria-pressed={isActive}
              onClick={() => onSelectSize(variant.sizeId)}
            >
              <span>{variant.label}</span>
              <small>{formatPrice(variant.priceRub)}</small>
            </button>
          );
        })}
      </div>

      <p className={styles.description}>{selectedVariant.description}</p>

      <ul className={styles.specs}>
        {selectedVariant.specs.map((spec) => (
          <li className={styles.spec} key={`${selectedVariant.sizeId}-${spec.label}`}>
            {spec.label}: <strong>{spec.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
