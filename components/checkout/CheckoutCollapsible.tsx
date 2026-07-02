// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Плавное раскрытие полей
//
// Purpose (EN): Animated show/hide wrapper for smart checkout fields.
//
// Назначение (RU): Плавное раскрытие/скрытие полей smart checkout.
// ==================================================
"use client";

import type { ReactNode } from "react";
import styles from "@/components/checkout/CheckoutCollapsible.module.css";

type CheckoutCollapsibleProps = {
  open: boolean;
  children: ReactNode;
};

export function CheckoutCollapsible({
  open,
  children,
}: CheckoutCollapsibleProps) {
  return (
    <div
      className={`${styles.collapsible} ${open ? styles.collapsibleOpen : ""}`}
      aria-hidden={!open}
    >
      <div className={styles.collapsibleInner}>
        <div className={styles.collapsibleContent}>{children}</div>
      </div>
    </div>
  );
}
