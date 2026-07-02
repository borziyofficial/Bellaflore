// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Дополнительные подарки
//
// Purpose (EN): Add-on gifts block with admin-ready catalog.
//
// Назначение (RU): Блок «Добавить к заказу» с каталогом для админки.
// ==================================================
"use client";

import { getActiveProductAddOns } from "@/components/product/productAddOnsCatalog";
import styles from "@/components/product/ProductAddOnsSection.module.css";

type ProductAddOnsSectionProps = {
  selectedAddOnIds: Set<string>;
  formatPrice: (priceRub: number) => string;
  onToggleAddOn: (addOnId: string) => void;
};

export function ProductAddOnsSection({
  selectedAddOnIds,
  formatPrice,
  onToggleAddOn,
}: ProductAddOnsSectionProps) {
  const addOns = getActiveProductAddOns();

  if (addOns.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-label="Добавить к заказу">
      <h3 className={styles.heading}>Добавить к заказу</h3>
      <div className={styles.grid}>
        {addOns.map((addOn) => {
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
