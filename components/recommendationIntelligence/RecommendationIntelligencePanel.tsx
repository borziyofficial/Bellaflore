// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Product page panel
// ==================================================
"use client";

import { useMemo } from "react";
import { buildProductPageRecommendations } from "@/components/recommendationIntelligence/recommendationIntelligenceBridge";
import { RecommendationAddOnsBlock } from "@/components/recommendationIntelligence/RecommendationAddOnsBlock";
import { RecommendationSlider } from "@/components/recommendationIntelligence/RecommendationSlider";
import styles from "@/components/recommendationIntelligence/RecommendationIntelligencePanel.module.css";

type RecommendationIntelligencePanelProps = {
  productId: string;
  favoriteProductIds?: string[];
  formatPrice: (priceRub: number) => string;
  failedImageIds: Set<string>;
  selectedAddOnIds: Set<string>;
  onProductSelect: (productId: string) => void;
  onImageError: (imageId: string) => void;
  onToggleAddOn: (addOnId: string) => void;
};

export function RecommendationIntelligencePanel({
  productId,
  favoriteProductIds,
  formatPrice,
  failedImageIds,
  selectedAddOnIds,
  onProductSelect,
  onImageError,
  onToggleAddOn,
}: RecommendationIntelligencePanelProps) {
  const recommendations = useMemo(
    () =>
      buildProductPageRecommendations(productId, {
        favoriteProductIds,
        limitPerSet: 8,
      }),
    [favoriteProductIds, productId],
  );

  if (recommendations.sets.length === 0) {
    return null;
  }

  return (
    <div className={styles.panel}>
      {recommendations.sets.map((set) => {
        if (set.kind === "add_ons") {
          return (
            <RecommendationAddOnsBlock
              key={set.kind}
              title={set.title}
              emoji={set.emoji}
              addOns={set.addOns}
              selectedAddOnIds={selectedAddOnIds}
              formatPrice={formatPrice}
              onToggleAddOn={onToggleAddOn}
            />
          );
        }

        return (
          <RecommendationSlider
            key={set.kind}
            title={set.title}
            emoji={set.emoji}
            products={set.products}
            formatPrice={formatPrice}
            failedImageIds={failedImageIds}
            onProductSelect={onProductSelect}
            onImageError={onImageError}
          />
        );
      })}
    </div>
  );
}
