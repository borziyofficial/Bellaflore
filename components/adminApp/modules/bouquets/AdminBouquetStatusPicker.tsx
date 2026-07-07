// ==================================================
// SECTION: ADMIN APP — Bouquet status picker (Stage 2.4)
// ==================================================
"use client";

import type { BouquetStatus } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { BOUQUET_STATUS_OPTIONS } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type AdminBouquetStatusPickerProps = {
  value: BouquetStatus;
  onChange: (status: BouquetStatus) => void;
};

export function AdminBouquetStatusPicker({ value, onChange }: AdminBouquetStatusPickerProps) {
  return (
    <div className={styles.manageBlock}>
      <span className={styles.fieldLabel}>Статус</span>
      <div className={styles.statusChipRow} role="group" aria-label="Статус букета">
        {BOUQUET_STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.statusChip} ${value === option.value ? styles.statusChipActive : ""}`.trim()}
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
