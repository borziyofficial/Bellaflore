// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Панель профиля
// ==================================================
"use client";

import { type ReactNode } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import styles from "@/components/orders/MyOrderPanel.module.css";
import { useBodyScrollLock } from "@/lib/ui/useBodyScrollLock";

type MyOrderPanelProps = {
  children: ReactNode;
  closeMyOrderPanel: () => void;
  expanded?: boolean;
};

export function MyOrderPanel({
  children,
  closeMyOrderPanel,
  expanded = false,
}: MyOrderPanelProps) {
  useBodyScrollLock(true);

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onClick={closeMyOrderPanel}
      data-bottom-nav-panel-overlay
    >
      <aside
        className={`${styles.sheet} ${expanded ? styles.expanded : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-profile-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <div>
            <BrandLogo variant="panel" className={styles.eyebrow} />
            <h2 id="my-profile-panel-title" className={styles.title}>
              Мой заказ
            </h2>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={closeMyOrderPanel}
            aria-label="Закрыть «Мой заказ»"
          >
            <span className={styles.closeGlyph} aria-hidden="true">×</span>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </aside>
    </div>
  );
}
