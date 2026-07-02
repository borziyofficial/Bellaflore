// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Premium horizontal slider
// ==================================================
"use client";

import Image from "next/image";
import type { RecommendationUiProduct } from "@/components/recommendationIntelligence/recommendationIntelligenceBridge";
import styles from "@/components/recommendationIntelligence/RecommendationSlider.module.css";

type RecommendationSliderProps = {
  title: string;
  emoji: string;
  products: RecommendationUiProduct[];
  formatPrice: (priceRub: number) => string;
  failedImageIds: Set<string>;
  onProductSelect: (productId: string) => void;
  onImageError: (imageId: string) => void;
};

export function RecommendationSlider({
  title,
  emoji,
  products,
  formatPrice,
  failedImageIds,
  onProductSelect,
  onImageError,
}: RecommendationSliderProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label={title}>
      <div className={styles.header}>
        <h3 className={styles.heading}>
          <span aria-hidden="true">{emoji}</span> {title}
        </h3>
      </div>
      <div className={styles.scroller}>
        {products.map((product) => (
          <button
            key={product.id}
            type="button"
            className={styles.card}
            onClick={() => onProductSelect(product.id)}
          >
            <div className={styles.media}>
              {!failedImageIds.has(product.id) ? (
                <Image
                  src={product.src}
                  alt={product.alt}
                  fill
                  className={styles.image}
                  sizes="168px"
                  onError={() => onImageError(product.id)}
                />
              ) : null}
              {product.score >= 70 ? (
                <span className={styles.badge}>Top match</span>
              ) : null}
            </div>
            <p className={styles.title}>{product.title}</p>
            <p className={styles.price}>{formatPrice(product.priceRub)}</p>
            {product.reasonSummary ? (
              <p className={styles.reason}>{product.reasonSummary}</p>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
