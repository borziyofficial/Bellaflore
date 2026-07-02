// ==================================================
// SECTION: LUXURY CATALOG PRODUCT CARD
// РАЗДЕЛ: Премиальная карточка товара (Stage 56A)
// ==================================================
"use client";

import styles from "@/components/catalog/LuxuryCatalogProductCard.module.css";
import { ProductImageWithFallback } from "@/components/product/ProductImageWithFallback";
import { ProductSizeSelector } from "@/components/product/ProductSizeSelector";
import {
  getProductExperienceData,
  getProductSizeVariant,
} from "@/components/product/productExperienceCatalog";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";
import type { CatalogProduct } from "@/data/catalogProducts";
import { useMemo, useState, type MouseEvent, type TouchEvent } from "react";

type LuxuryCatalogProductCardProps = {
  product: CatalogProduct;
  formatPrice: (priceRub: number) => string;
  isFavorite: boolean;
  badge?: string | null;
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
  badge = null,
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

  const openProduct = () => {
    onProductOpen?.(product.id);
  };

  return (
    <article className={`bouquet-card ${styles.card}`}>
      <button
        type="button"
        className={styles.mediaButton}
        onClick={openProduct}
        aria-label={`Открыть ${product.title}`}
      >
        <div className={`bouquet-image ${styles.imageWrap}`}>
          {badge ? <span className={styles.badge}>{badge}</span> : null}
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
        className={`bouquet-favorite-button ${styles.favorite} ${isFavorite ? styles.favoriteActive : ""}`}
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

      <div className={`bouquet-info ${styles.info}`}>
        <button type="button" className={styles.titleButton} onClick={openProduct}>
          <h3 className={styles.title}>{product.title}</h3>
        </button>

        <p className={styles.price}>{formatPrice(selectedVariant.priceRub)}</p>
        <p className={styles.deliveryHint}>Доставка сегодня</p>

        <ProductSizeSelector
          layout="compact"
          variants={experienceData.sizeVariants}
          selectedSizeId={selectedSizeId}
          onSelectSize={setSelectedSizeId}
          formatPrice={formatPrice}
          visibleSizeIds={["S", "M", "L", "XL"]}
          ariaLabel={`Размеры для ${product.title}`}
        />

        <button
          type="button"
          className={`buy-button bouquet-order-link ${styles.buyButton}`}
          onClick={(event) =>
            onBuyClick(
              event,
              product.id,
              selectedVariant.sizeId,
              selectedVariant.priceRub,
            )
          }
          onTouchEnd={(event) =>
            onBuyTouchEnd(
              event,
              product.id,
              selectedVariant.sizeId,
              selectedVariant.priceRub,
            )
          }
          aria-label={`Купить ${product.title} в размере ${selectedVariant.label}`}
        >
          Купить
        </button>
      </div>
    </article>
  );
}
