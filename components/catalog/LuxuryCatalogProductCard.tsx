// ==================================================
// SECTION: LUXURY CATALOG PRODUCT CARD
// РАЗДЕЛ: Премиальная карточка товара (Stage 57A)
// ==================================================
"use client";

import {
  getProductCardDescription,
  getProductCategoryHint,
} from "@/components/catalog/filterHomeCatalogProducts";
import styles from "@/components/catalog/LuxuryCatalogProductCard.module.css";
import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
import { ProductSizeSelector } from "@/components/product/ProductSizeSelector";
import {
  getProductExperienceData,
  getProductSizeVariant,
} from "@/components/product/productExperienceCatalog";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import type { CatalogProduct } from "@/data/catalogProducts";
import { useMemo, useState, type MouseEvent, type PointerEvent, type TouchEvent } from "react";

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
    experienceData.defaultSizeId,
  );
  const selectedVariant = getProductSizeVariant(experienceData, selectedSizeId);
  const categoryLabel = getProductCategoryHint(product);
  const description = getProductCardDescription(product);
  const fromPriceRub = useMemo(
    () =>
      Math.min(...experienceData.sizeVariants.map((variant) => variant.priceRub)),
    [experienceData.sizeVariants],
  );

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
        <p className={styles.category}>{categoryLabel}</p>

        <button type="button" className={styles.titleButton} onClick={openProduct}>
          <h3 className={styles.title}>{product.title}</h3>
        </button>

        {description ? (
          <p className={styles.description}>{description}</p>
        ) : null}

        <p className={styles.price}>
          от {formatPrice(fromPriceRub)}
        </p>

        <ProductSizeSelector
          layout="compact"
          variants={experienceData.sizeVariants}
          selectedSizeId={selectedSizeId}
          onSelectSize={setSelectedSizeId}
          formatPrice={formatPrice}
          visibleSizeIds={["S", "M", "L", "XL"]}
          compactOptionColumns={4}
          showSelectedPrice={false}
          ariaLabel={`Размеры для ${product.title}`}
        />

        <button
          type="button"
          className={`buy-button ${styles.buyButton}`}
          onPointerDown={handleBuyPointerDown}
          onClick={handleBuyClick}
          onTouchEnd={handleBuyTouchEnd}
          aria-label={`Купить ${product.title} в размере ${selectedVariant.label}`}
        >
          Купить
        </button>
      </div>
    </article>
  );
}
