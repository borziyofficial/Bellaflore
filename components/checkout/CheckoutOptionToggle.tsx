// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Переключатели smart checkout
//
// Purpose (EN): Premium toggle row for optional checkout fields.
//
// Назначение (RU): Премиальный переключатель для опций checkout.
// ==================================================
"use client";

import styles from "@/components/checkout/CheckoutOptionToggle.module.css";

type CheckoutOptionToggleProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function CheckoutOptionToggle({
  id,
  label,
  checked,
  onChange,
}: CheckoutOptionToggleProps) {
  return (
    <label className={styles.toggleRow} htmlFor={id}>
      <span className={styles.toggleLabel}>{label}</span>
      <span className={styles.toggleControl}>
        <input
          id={id}
          type="checkbox"
          className={styles.toggleInput}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className={styles.toggleTrack} aria-hidden="true">
          <span className={styles.toggleThumb} />
        </span>
      </span>
    </label>
  );
}
