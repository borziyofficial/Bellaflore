// ==================================================
// SECTION: ADMIN APP — Bouquet size picker (Stage 2.3)
// ==================================================
"use client";

import {
  getEnabledBouquetSizeCodes,
  setBouquetSizePrice,
  toggleBouquetSize,
} from "@/components/adminApp/modules/bouquets/bouquetSizeUtils";
import type { BouquetSizes } from "@/components/adminApp/modules/bouquets/bouquetTypes";
import {
  BOUQUET_SIZE_CODES,
  BOUQUET_SIZE_PRICE_LABELS,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";
import styles from "@/components/adminApp/modules/bouquets/AdminBouquetsModule.module.css";

type AdminBouquetSizePickerProps = {
  sizes: BouquetSizes;
  onChange: (sizes: BouquetSizes) => void;
};

export function AdminBouquetSizePicker({ sizes, onChange }: AdminBouquetSizePickerProps) {
  const enabledCodes = getEnabledBouquetSizeCodes(sizes);

  return (
    <div className={styles.sizeBlock}>
      <span className={styles.fieldLabel}>Размеры</span>

      <div className={styles.sizeChipRow} role="group" aria-label="Размеры букета">
        {BOUQUET_SIZE_CODES.map((code) => {
          const enabled = sizes[code].enabled;

          return (
            <button
              key={code}
              type="button"
              className={`${styles.sizeChip} ${enabled ? styles.sizeChipActive : ""}`.trim()}
              aria-pressed={enabled}
              onClick={() => onChange(toggleBouquetSize(sizes, code))}
            >
              {code}
            </button>
          );
        })}
      </div>

      {enabledCodes.length > 0 ? (
        <div className={styles.sizePriceStack}>
          {enabledCodes.map((code) => (
            <label key={code} className={styles.sizePriceField}>
              <span className={styles.sizePriceLabel}>{BOUQUET_SIZE_PRICE_LABELS[code]}</span>
              <input
                className={styles.sizePriceInput}
                type="number"
                min={0}
                step={100}
                value={sizes[code].price || ""}
                onChange={(event) =>
                  onChange(setBouquetSizePrice(sizes, code, Number(event.target.value)))
                }
                placeholder="0"
              />
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
