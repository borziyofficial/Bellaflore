"use client";

import styles from "@/components/product/ProductSizePickerSheet.module.css";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import type { ProductSizeVariant } from "@/components/product/productExperienceTypes";
import { useEffect, useMemo } from "react";

type ProductSizePickerSheetProps = {
  open: boolean;
  title?: string;
  variants: ProductSizeVariant[];
  selectedSizeId: ProductSizeId;
  formatPrice: (priceRub: number) => string;
  visibleSizeIds?: ProductSizeId[];
  onSelect: (sizeId: ProductSizeId) => void;
  onClose: () => void;
};

export function ProductSizePickerSheet({
  open,
  title = "Выберите размер",
  variants,
  selectedSizeId,
  formatPrice,
  visibleSizeIds,
  onSelect,
  onClose,
}: ProductSizePickerSheetProps) {
  const visibleVariants = useMemo(
    () =>
      variants.filter((variant) =>
        visibleSizeIds ? visibleSizeIds.includes(variant.sizeId) : true,
      ),
    [variants, visibleSizeIds],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      className={`${styles.overlay} ${open ? styles.overlayOpen : ""}`}
      aria-hidden={!open}
      inert={!open}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-size-picker-title"
      >
        <span className={styles.grabber} aria-hidden="true" />
        <div className={styles.header}>
          <h3 id="product-size-picker-title" className={styles.title}>
            {title}
          </h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <div className={styles.options} role="radiogroup" aria-label={title}>
          {visibleVariants.map((variant) => {
            const isActive = variant.sizeId === selectedSizeId;
            const label = variant.sizeId;

            return (
              <button
                key={variant.sizeId}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={`Размер ${label}, ${formatPrice(variant.priceRub)}`}
                className={`${styles.option} ${isActive ? styles.optionActive : ""}`}
                onClick={() => {
                  onSelect(variant.sizeId);
                  onClose();
                }}
              >
                <span className={styles.optionRadio} aria-hidden="true" />
                <span className={styles.optionLabel}>{label}</span>
                <span className={styles.optionPrice}>
                  {formatPrice(variant.priceRub)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
