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
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent,
} from "react";

const ACTION_GESTURE_THRESHOLD_PX = 10;

type LuxuryCatalogProductCardProps = {
  product: CatalogProduct;
  formatPrice: (priceRub: number) => string;
  isFavorite: boolean;
  onFavoriteClick: (event: MouseEvent<HTMLButtonElement>, productId: string) => void;
  onBuyClick: (
    event: MouseEvent<HTMLButtonElement>,
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
  onBuyClick,
  onProductOpen,
}: LuxuryCatalogProductCardProps) {
  const experienceData = useMemo(
    () => getProductExperienceData(product),
    [product],
  );
  const [selectedSizeId, setSelectedSizeId] = useState<ProductSizeId>(
    experienceData.defaultSizeId,
  );
  const [sizePopoverOpen, setSizePopoverOpen] = useState(false);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [trackedProductId, setTrackedProductId] = useState(product.id);
  const [dropdownPlacement, setDropdownPlacement] = useState<"down" | "up">("down");
  const popoverRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLButtonElement>(null);
  const actionGestureRef = useRef({
    startX: 0,
    startY: 0,
    moved: false,
  });

  if (product.id !== trackedProductId) {
    setTrackedProductId(product.id);
    setSelectedSizeId(experienceData.defaultSizeId);
    setSizePopoverOpen(false);
    setDetailsExpanded(false);
  }

  const selectedVariant = getProductSizeVariant(experienceData, selectedSizeId);
  const categoryLabel = getProductCategoryHint(product);
  const description = getProductCardDescription(product);
  const hasMultipleSizes = experienceData.sizeVariants.length > 1;
  const visibleVariants = experienceData.sizeVariants.filter((variant) =>
    ["S", "M", "L", "XL"].includes(variant.sizeId),
  );
  const detailsId = `catalog-card-details-${product.id}`;

  useLayoutEffect(() => {
    if (!sizePopoverOpen || !chevronRef.current) {
      return;
    }

    const buttonRect = chevronRef.current.getBoundingClientRect();
    const bottomNav = document.querySelector<HTMLElement>(
      'nav[aria-label="Быстрая мобильная навигация"]',
    );
    const navTop =
      bottomNav?.getBoundingClientRect().top ?? window.innerHeight - 96;
    const dropdownHeight = visibleVariants.length * 40 + 16;
    const spaceBelow = navTop - buttonRect.bottom - 8;
    const spaceAbove = buttonRect.top - 8;

    setDropdownPlacement(
      spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove ? "down" : "up",
    );
  }, [sizePopoverOpen, visibleVariants.length]);

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

  const handleActionTouchStart = (event: TouchEvent<HTMLButtonElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    actionGestureRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false,
    };
  };

  const handleActionTouchMove = (event: TouchEvent<HTMLButtonElement>) => {
    const touch = event.touches[0];
    if (!touch) {
      return;
    }

    const gesture = actionGestureRef.current;
    if (
      Math.hypot(
        touch.clientX - gesture.startX,
        touch.clientY - gesture.startY,
      ) >= ACTION_GESTURE_THRESHOLD_PX
    ) {
      gesture.moved = true;
    }
  };

  const handleActionTouchEnd = (event: TouchEvent<HTMLButtonElement>) => {
    if (!actionGestureRef.current.moved) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  };

  const shouldSuppressActionClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!actionGestureRef.current.moved) {
      return false;
    }

    actionGestureRef.current.moved = false;
    event.preventDefault();
    event.stopPropagation();
    return true;
  };

  const openProduct = (event: MouseEvent<HTMLButtonElement>) => {
    if (!shouldSuppressActionClick(event)) {
      onProductOpen?.(product.id);
    }
  };

  const handleBuyClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (shouldSuppressActionClick(event)) {
      return;
    }

    onBuyClick(event, product.id, selectedVariant.sizeId, selectedVariant.priceRub);
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
          onTouchStart={handleActionTouchStart}
          onTouchMove={handleActionTouchMove}
          onTouchEnd={handleActionTouchEnd}
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
          onClick={(event) => {
            if (!shouldSuppressActionClick(event)) {
              onFavoriteClick(event, product.id);
            }
          }}
          onTouchStart={handleActionTouchStart}
          onTouchMove={handleActionTouchMove}
          onTouchEnd={handleActionTouchEnd}
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

          <button
            type="button"
            className={styles.titleButton}
            onClick={openProduct}
            onTouchStart={handleActionTouchStart}
            onTouchMove={handleActionTouchMove}
            onTouchEnd={handleActionTouchEnd}
          >
            <h3 className={styles.title}>{product.title}</h3>
          </button>

          {description ? (
            <p className={styles.description}>{description}</p>
          ) : null}

          <button
            type="button"
            className={styles.detailsButton}
            aria-expanded={detailsExpanded}
            aria-controls={detailsId}
            onClick={(event) => {
              if (!shouldSuppressActionClick(event)) {
                setDetailsExpanded((current) => !current);
              }
            }}
            onTouchStart={handleActionTouchStart}
            onTouchMove={handleActionTouchMove}
            onTouchEnd={handleActionTouchEnd}
          >
            {detailsExpanded ? "Скрыть" : "Подробнее"}
          </button>

          <div
            id={detailsId}
            className={`${styles.expandedDetails} ${
              detailsExpanded ? styles.expandedDetailsOpen : ""
            }`}
            aria-hidden={!detailsExpanded}
          >
            <div className={styles.expandedDetailsInner}>
              <p>{experienceData.description}</p>
              <dl>
                <div>
                  <dt>Состав</dt>
                  <dd>{experienceData.composition}</dd>
                </div>
                <div>
                  <dt>Доставка</dt>
                  <dd>{experienceData.deliveryNote}</dd>
                </div>
                <div>
                  <dt>Преимущество</dt>
                  <dd>{experienceData.freshnessGuarantee}</dd>
                </div>
              </dl>
            </div>
          </div>

          <p className={styles.price}>{formatPrice(selectedVariant.priceRub)}</p>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.buyButton}
            onClick={handleBuyClick}
            onTouchStart={handleActionTouchStart}
            onTouchMove={handleActionTouchMove}
            onTouchEnd={handleActionTouchEnd}
            aria-label={`Купить ${product.title}`}
          >
            Купить
          </button>

          {hasMultipleSizes ? (
            <div className={styles.sizePopoverWrap} ref={popoverRef}>
              <button
                ref={chevronRef}
                type="button"
                className={`${styles.chevronButton} ${sizePopoverOpen ? styles.chevronButtonOpen : ""}`}
                onClick={(event) => {
                  if (!shouldSuppressActionClick(event)) {
                    setSizePopoverOpen((open) => !open);
                  }
                }}
                onTouchStart={handleActionTouchStart}
                onTouchMove={handleActionTouchMove}
                onTouchEnd={handleActionTouchEnd}
                aria-haspopup="listbox"
                aria-expanded={sizePopoverOpen}
                aria-label="Выбор размера"
              >
                <span className={styles.selectedSize}>{selectedVariant.sizeId}</span>
                <svg aria-hidden="true" viewBox="0 0 12 12" className={styles.chevronIcon}>
                  <path d="M3 4.5 6 7.5 9 4.5" />
                </svg>
              </button>

              {sizePopoverOpen ? (
                <div
                  className={`${styles.sizePopover} ${
                    dropdownPlacement === "up" ? styles.sizePopoverUp : styles.sizePopoverDown
                  }`}
                  role="listbox"
                  aria-label="Размер"
                >
                  {visibleVariants.map((variant) => (
                    <button
                      key={variant.sizeId}
                      type="button"
                      role="option"
                      aria-selected={variant.sizeId === selectedSizeId}
                      className={`${styles.sizeOption} ${
                        variant.sizeId === selectedSizeId ? styles.sizeOptionActive : ""
                      }`}
                      onClick={(event) => {
                        if (!shouldSuppressActionClick(event)) {
                          handleSizeSelect(variant.sizeId);
                        }
                      }}
                      onTouchStart={handleActionTouchStart}
                      onTouchMove={handleActionTouchMove}
                      onTouchEnd={handleActionTouchEnd}
                    >
                      {variant.sizeId}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
