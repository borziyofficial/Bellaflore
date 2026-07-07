// ==================================================
// SECTION: ADMIN APP — Bouquet display flags (Stage 2.4)
// ==================================================
"use client";

import type { BouquetDisplayFlags } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import { BOUQUET_DISPLAY_FLAG_OPTIONS } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type AdminBouquetDisplayFlagsProps = {
  flags: BouquetDisplayFlags;
  onChange: (flags: BouquetDisplayFlags) => void;
};

export function AdminBouquetDisplayFlags({ flags, onChange }: AdminBouquetDisplayFlagsProps) {
  return (
    <div className={styles.manageBlock}>
      <span className={styles.fieldLabel}>Показ</span>
      <div className={styles.toggleStack}>
        {BOUQUET_DISPLAY_FLAG_OPTIONS.map((option) => (
          <label key={option.key} className={styles.toggleRow}>
            <span className={styles.toggleLabel}>{option.label}</span>
            <input
              className={styles.toggleInput}
              type="checkbox"
              checked={flags[option.key]}
              onChange={(event) =>
                onChange({
                  ...flags,
                  [option.key]: event.target.checked,
                })
              }
            />
          </label>
        ))}
      </div>
    </div>
  );
}
