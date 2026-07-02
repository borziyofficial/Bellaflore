// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Add-ons block
// ==================================================
"use client";

import type { ScoredAddOnRecommendation } from "@/components/recommendationIntelligence/recommendationIntelligenceTypes";
import styles from "@/components/recommendationIntelligence/RecommendationAddOnsBlock.module.css";

type RecommendationAddOnsBlockProps = {
  title: string;
  emoji: string;
  addOns: ScoredAddOnRecommendation[];
  selectedAddOnIds: Set<string>;
  formatPrice: (priceRub: number) => string;
  onToggleAddOn: (addOnId: string) => void;
};

export function RecommendationAddOnsBlock({
  title,
  emoji,
  addOns,
  selectedAddOnIds,
  formatPrice,
  onToggleAddOn,
}: RecommendationAddOnsBlockProps) {
  if (addOns.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label={title}>
      <h3 className={styles.heading}>
        <span aria-hidden="true">{emoji}</span> {title}
      </h3>
      <div className={styles.grid}>
        {addOns.map(({ addOn, reasonSummary }) => {
          const isSelected = selectedAddOnIds.has(addOn.id);

          return (
            <div
              key={addOn.id}
              className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
            >
              <span className={styles.emoji} aria-hidden="true">
                {addOn.emoji}
              </span>
              <div className={styles.copy}>
                <p className={styles.title}>{addOn.title}</p>
                <p className={styles.description}>
                  {addOn.description} · {formatPrice(addOn.priceRub)}
                </p>
                {reasonSummary ? (
                  <p className={styles.reason}>{reasonSummary}</p>
                ) : null}
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${
                  isSelected ? styles.toggleSelected : ""
                }`}
                aria-pressed={isSelected}
                onClick={() => onToggleAddOn(addOn.id)}
              >
                {isSelected ? "✓" : "Добавить"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
