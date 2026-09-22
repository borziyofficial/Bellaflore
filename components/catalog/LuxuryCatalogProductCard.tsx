// ==================================================
// SECTION: LUXURY CATALOG PRODUCT CARD
// РАЗДЕЛ: Pearl Luxury card v2 (Stage 58) — compact commerce layout
// ==================================================
"use client";

import styles from "@/components/catalog/LuxuryCatalogProductCard.module.css";
import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
import {
  getProductExperienceData,
  getProductSizeVariant,
} from "@/components/product/productExperienceCatalog";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import type { CatalogProduct } from "@/data/catalogProducts";
import {
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
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

// Compact commerce card: photo, name, price + "Подробнее ↓" (opens the full
// product page), and an always-visible "Купить" primary action. The old
// circular ↗ button and the hide-until-expanded accordion (category /
// catalog number / rating / description / size picker gated behind an
// in-place "expand" toggle) were removed — Buy was invisible by default on
// every breakpoint before this change, which is the defect this rewrite
// fixes. Full details (rating, description, size selection) remain one tap
// away via "Подробнее" / the product page, so nothing is lost — it just no
// longer hides the primary Buy action.
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
  const [trackedProductId, setTrackedProductId] = useState(product.id);
  const actionGestureRef = useRef({
    startX: 0,
    startY: 0,
    moved: false,
  });

  if (product.id !== trackedProductId) {
    setTrackedProductId(product.id);
    setSelectedSizeId(experienceData.defaultSizeId);
  }

  const selectedVariant = getProductSizeVariant(experienceData, selectedSizeId);

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

  const shouldIgnoreCardOpen = (target: EventTarget | null) => {
    return target instanceof HTMLElement && Boolean(target.closest("button, a, input, select, textarea"));
  };

  const openProductFromCard = (target: EventTarget | null) => {
    if (!shouldIgnoreCardOpen(target)) {
      onProductOpen?.(product.id);
    }
  };

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    if (shouldIgnoreCardOpen(event.target)) {
      return;
    }

    event.preventDefault();
    onProductOpen?.(product.id);
  };

  const handleBuyClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (shouldSuppressActionClick(event)) {
      return;
    }

    onBuyClick(event, product.id, selectedVariant.sizeId, selectedVariant.priceRub);
  };

  return (
    <article
      className={styles.card}
      role="link"
      tabIndex={0}
      aria-label={`Открыть ${product.title}`}
      onClick={(event) => openProductFromCard(event.target)}
      onKeyDown={handleCardKeyDown}
    >
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

          <div className={styles.priceRow}>
            <p className={styles.price}>{formatPrice(selectedVariant.priceRub)}</p>
            <button
              type="button"
              className={styles.detailsButton}
              onClick={openProduct}
              onTouchStart={handleActionTouchStart}
              onTouchMove={handleActionTouchMove}
              onTouchEnd={handleActionTouchEnd}
              aria-label={`Подробнее о ${product.title}`}
            >
              Подробнее ↓
            </button>
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
          </div>
        </div>
      </div>
    </article>
  );
}
