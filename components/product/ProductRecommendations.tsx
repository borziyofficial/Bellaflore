// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Похожие букеты
//
// Purpose (EN): Horizontal similar products slider with safe images.
//
// Назначение (RU): Горизонтальный слайдер похожих букетов с безопасными фото.
// ==================================================
"use client";

import { BrandLogo } from "@/components/brand/BrandLogo";
import Image from "next/image";
import { shouldUseUnoptimizedImage } from "@/components/images/imageLoadUtils";
import type { CatalogProductBase } from "@/components/product/productExperienceTypes";
import styles from "@/components/product/ProductRecommendations.module.css";

type ProductRecommendationsProps = {
  products: CatalogProductBase[];
  formatPrice: (priceRub: number) => string;
  failedImageIds: Set<string>;
  onProductSelect: (productId: string) => void;
  onImageError: (productId: string) => void;
};

export function ProductRecommendations({
  products,
  formatPrice,
  failedImageIds,
  onProductSelect,
  onImageError,
}: ProductRecommendationsProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Похожие букеты">
      <h3 className={styles.heading}>Похожие букеты</h3>
      <div className={styles.scroller}>
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            className={styles.card}
            onClick={() => onProductSelect(product.id)}
          >
            <div className={styles.media}>
              {failedImageIds.has(product.id) ? (
                <div className={styles.imageFallback} aria-label={product.alt}>
                  <BrandLogo variant="compact" className={styles.fallbackLogo} />
                </div>
              ) : (
                <Image
                  src={product.src}
                  alt={product.alt}
                  fill
                  className={styles.image}
                  sizes="168px"
                  unoptimized={shouldUseUnoptimizedImage(product.src)}
                  onError={() => onImageError(product.id)}
                />
              )}
            </div>
            <p className={styles.title}>{product.title}</p>
            <p className={styles.price}>{formatPrice(product.priceRub)}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
