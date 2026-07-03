// ==================================================
// SECTION: LUXURY CATALOG PRODUCT CARD
// РАЗДЕЛ: Pearl Luxury card v2 (Stage 58)
// ==================================================
"use client";

import {
  getProductCardDescription,
  getProductCategoryHint,
} from "@/components/catalog/filterHomeCatalogProducts";
import styles from "@/components/catalog/LuxuryCatalogProductCard.module.css";
import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
import {
  getProductExperienceData,
  getProductSizeVariant,
} from "@/components/product/productExperienceCatalog";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import type { CatalogProduct } from "@/data/catalogProducts";
import { getProductSizeRuLabel } from "@/lib/product/sizeLabels";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type TouchEvent,
} from "react";

function ensureBuyButtonClearOfBottomNav(button: HTMLButtonElement) {
  if (typeof window === "undefined" || window.innerWidth > 768) {
    return;
  }

  const bottomNav = document.querySelector<HTMLElement>(
    'nav[aria-label="Быстрая мобильная навигация"]',
  );
  const navTop = bottomNav?.getBoundingClientRect().top ?? window.innerHeight - 96;
  const buttonRect = button.getBoundingClientRect();
  const overlap = buttonRect.bottom + 12 - navTop;

  if (overlap > 0) {
    window.scrollBy({ top: overlap, behavior: "auto" });
  }
}

type LuxuryCatalogProductCardProps = {
  product: CatalogProduct;
  formatPrice: (priceRub: number) => string;
  isFavorite: boolean;
  onFavoriteClick: (event: MouseEvent<HTMLButtonElement>, productId: string) => void;
  onFavoriteTouchEnd: (event: TouchEvent<HTMLButtonElement>, productId: string) => void;
  onBuyClick: (
    event: MouseEvent<HTMLButtonElement>,
    productId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
  onBuyTouchEnd: (
    event: TouchEvent<HTMLButtonElement>,
    productId: string,
    sizeId: ProductSizeId,
    priceRub: number,
  ) => void;
  onProductOpen?: (productId: string) => void;
};

export function LuxuryCatalogProductCard({
  product,
  formatPrice,
  isFavorite,
  onFavoriteClick,
  onFavoriteTouchEnd,
  onBuyClick,
  onBuyTouchEnd,
  onProductOpen,
}: LuxuryCatalogProductCardProps) {
  const experienceData = useMemo(
    () => getProductExperienceData(product),
    [product],
  );
  const [selectedSizeId, setSelectedSizeId] = useState<ProductSizeId>(
    experienceData.sizeVariants.some((variant) => variant.sizeId === "M")
      ? "M"
      : experienceData.defaultSizeId,
  );
  const [sizePopoverOpen, setSizePopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const selectedVariant = getProductSizeVariant(experienceData, selectedSizeId);
  const categoryLabel = getProductCategoryHint(product);
  const description = getProductCardDescription(product);
  const selectedSizeLabel = getProductSizeRuLabel(selectedSizeId);
  const hasMultipleSizes = experienceData.sizeVariants.length > 1;
  const visibleVariants = experienceData.sizeVariants.filter((variant) =>
    ["S", "M", "L", "XL"].includes(variant.sizeId),
  );

  useEffect(() => {
    if (!sizePopoverOpen) {
      return;
    }

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setSizePopoverOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [sizePopoverOpen]);

  const openProduct = () => {
    onProductOpen?.(product.id);
  };

  const handleBuyPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "touch") {
      ensureBuyButtonClearOfBottomNav(event.currentTarget);
    }
  };

  const handleBuyClick = (event: MouseEvent<HTMLButtonElement>) => {
    ensureBuyButtonClearOfBottomNav(event.currentTarget);
    onBuyClick(
      event,
      product.id,
      selectedVariant.sizeId,
      selectedVariant.priceRub,
    );
  };

  const handleBuyTouchEnd = (event: TouchEvent<HTMLButtonElement>) => {
    ensureBuyButtonClearOfBottomNav(event.currentTarget);
    onBuyTouchEnd(
      event,
      product.id,
      selectedVariant.sizeId,
      selectedVariant.priceRub,
    );
  };

  const handleSizeSelect = (sizeId: ProductSizeId) => {
    setSelectedSizeId(sizeId);
    setSizePopoverOpen(false);
  };

  return (
    <article className={styles.card}>
      <div className={styles.mediaWrap}>
        <button
          type="button"
          className={styles.mediaButton}
          onClick={openProduct}
          aria-label={`Открыть ${product.title}`}
        >
          <div className={styles.imageWrap}>
            <ProductImageWithFallback
              src={product.src}
              alt={product.alt}
              width={product.width}
              height={product.height}
              sizes="(max-width: 768px) 50vw, 280px"
              imageClassName={styles.productImage}
              fallbackClassName={styles.imageFallback}
            />
          </div>
        </button>

        <button
          type="button"
          className={`${styles.favorite} ${isFavorite ? styles.favoriteActive : ""}`}
          onClick={(event) => onFavoriteClick(event, product.id)}
          onTouchEnd={(event) => onFavoriteTouchEnd(event, product.id)}
          aria-label={
            isFavorite
              ? `Убрать ${product.title} из избранного`
              : `Добавить ${product.title} в избранное`
          }
          aria-pressed={isFavorite}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 20.5s-7.3-4.4-9-9.2C1.9 8 3.9 5.2 7 5.2c1.8 0 3.1 1 4 2.2.9-1.2 2.2-2.2 4-2.2 3.1 0 5.1 2.8 4 6.1-1.7 4.8-9 9.2-9 9.2Z" />
          </svg>
        </button>
      </div>

      <div className={styles.info}>
        <div className={styles.contentBlock}>
          <p className={styles.category}>{categoryLabel}</p>

          <button type="button" className={styles.titleButton} onClick={openProduct}>
            <h3 className={styles.title}>{product.title}</h3>
          </button>

          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}

          <p className={styles.price}>{formatPrice(selectedVariant.priceRub)}</p>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.buyButton}
            onPointerDown={handleBuyPointerDown}
            onClick={handleBuyClick}
            onTouchEnd={handleBuyTouchEnd}
            aria-label={`Купить ${product.title} в размере ${selectedSizeLabel}`}
          >
            Купить
          </button>

          {hasMultipleSizes ? (
            <div className={styles.sizePopoverWrap} ref={popoverRef}>
              <button
                type="button"
                className={`${styles.chevronButton} ${sizePopoverOpen ? styles.chevronButtonOpen : ""}`}
                onClick={() => setSizePopoverOpen((open) => !open)}
                aria-haspopup="listbox"
                aria-expanded={sizePopoverOpen}
                aria-label={`Размер ${selectedSizeLabel}`}
              >
                <span className={styles.chevronSize}>{selectedSizeLabel}</span>
                <svg aria-hidden="true" viewBox="0 0 12 12" className={styles.chevronIcon}>
                  <path d="M3 4.5 6 7.5 9 4.5" />
                </svg>
              </button>

              {sizePopoverOpen ? (
                <div className={styles.sizePopover} role="listbox" aria-label="Выбор размера">
                  {visibleVariants.map((variant) => (
                    <button
                      key={variant.sizeId}
                      type="button"
                      role="option"
                      aria-selected={variant.sizeId === selectedSizeId}
                      className={`${styles.sizeOption} ${
                        variant.sizeId === selectedSizeId ? styles.sizeOptionActive : ""
                      }`}
                      onClick={() => handleSizeSelect(variant.sizeId)}
                    >
                      <span>{getProductSizeRuLabel(variant.sizeId)}</span>
                      <span>{formatPrice(variant.priceRub)}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <span className={styles.singleSize}>{selectedSizeLabel}</span>
          )}
        </div>
      </div>
    </article>
  );
}
