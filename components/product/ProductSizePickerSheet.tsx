"use client";

import styles from "@/components/product/ProductSizePickerSheet.module.css";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import type { ProductSizeVariant } from "@/components/product/productExperienceTypes";
import { useEffect, useMemo, useRef, type TouchEvent } from "react";

type ProductSizePickerSheetProps = {
  open: boolean;
  title?: string;
  productName?: string;
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
  productName,
  variants,
  selectedSizeId,
  formatPrice,
  visibleSizeIds,
  onSelect,
  onClose,
}: ProductSizePickerSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ startX: 0, startY: 0, deltaY: 0, dragging: false });
  const visibleVariants = useMemo(
    () =>
      variants.filter((variant) =>
        visibleSizeIds ? visibleSizeIds.includes(variant.sizeId) : true,
      ),
    [variants, visibleSizeIds],
  );
  const selectedVariant =
    visibleVariants.find((variant) => variant.sizeId === selectedSizeId) ??
    visibleVariants[0];

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

  const resetSheetDrag = () => {
    const sheet = sheetRef.current;
    if (sheet) {
      sheet.style.removeProperty("transition");
      sheet.style.removeProperty("transform");
    }
    dragRef.current = { startX: 0, startY: 0, deltaY: 0, dragging: false };
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    if (!touch) return;
    dragRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      deltaY: 0,
      dragging: false,
    };
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    const sheet = sheetRef.current;
    if (!touch || !sheet) return;

    const deltaX = touch.clientX - dragRef.current.startX;
    const deltaY = Math.max(0, touch.clientY - dragRef.current.startY);
    if (!dragRef.current.dragging && (deltaY < 8 || deltaY <= Math.abs(deltaX))) {
      return;
    }

    dragRef.current.dragging = true;
    dragRef.current.deltaY = deltaY;
    sheet.style.transition = "none";
    sheet.style.transform = `translate3d(0, ${deltaY}px, 0)`;
  };

  const handleTouchEnd = () => {
    const shouldClose = dragRef.current.dragging && dragRef.current.deltaY >= 72;
    resetSheetDrag();
    if (shouldClose) {
      onClose();
    }
  };

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
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-size-picker-title"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={resetSheetDrag}
      >
        <span className={styles.grabber} aria-hidden="true" />
        <div className={styles.header}>
          <h3 id="product-size-picker-title" className={styles.title}>
            {productName || title}
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

        {productName ? <p className={styles.eyebrow}>{title}</p> : null}

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
                }}
              >
                <span className={styles.optionLabel}>{label}</span>
              </button>
            );
          })}
        </div>

        {selectedVariant ? (
          <div className={styles.selectionSummary} aria-live="polite">
            <span>Размер {selectedVariant.sizeId}</span>
            <strong>{formatPrice(selectedVariant.priceRub)}</strong>
          </div>
        ) : null}

        <button type="button" className={styles.confirmButton} onClick={onClose}>
          Выбрать{selectedVariant ? ` · ${formatPrice(selectedVariant.priceRub)}` : ""}
        </button>
      </div>
    </div>
  );
}
