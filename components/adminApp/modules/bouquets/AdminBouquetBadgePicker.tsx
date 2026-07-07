// ==================================================
// SECTION: ADMIN APP — Bouquet badge picker (Stage 2.4)
// ==================================================
"use client";

import type { BouquetBadge } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { BOUQUET_BADGE_OPTIONS } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type AdminBouquetBadgePickerProps = {
  value: BouquetBadge;
  onChange: (badge: BouquetBadge) => void;
};

export function AdminBouquetBadgePicker({ value, onChange }: AdminBouquetBadgePickerProps) {
  return (
    <div className={styles.manageBlock}>
      <span className={styles.fieldLabel}>Бейдж</span>
      <div className={styles.badgeChipRow} role="group" aria-label="Бейдж букета">
        {BOUQUET_BADGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.badgeChip} ${value === option.value ? styles.badgeChipActive : ""}`.trim()}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
