// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Панель профиля
// ==================================================
"use client";

import { type ReactNode, useEffect } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import styles from "@/components/orders/MyOrderPanel.module.css";

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
  useEffect(() => {
    const scrollY = window.scrollY;
    const { style: htmlStyle } = document.documentElement;
    const { style: bodyStyle } = document.body;

    const previousHtmlOverflow = htmlStyle.overflow;
    const previousBodyOverflow = bodyStyle.overflow;
    const previousBodyPosition = bodyStyle.position;
    const previousBodyTop = bodyStyle.top;
    const previousBodyWidth = bodyStyle.width;

    htmlStyle.overflow = "hidden";
    bodyStyle.overflow = "hidden";
    bodyStyle.position = "fixed";
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = "100%";

    return () => {
      htmlStyle.overflow = previousHtmlOverflow;
      bodyStyle.overflow = previousBodyOverflow;
      bodyStyle.position = previousBodyPosition;
      bodyStyle.top = previousBodyTop;
      bodyStyle.width = previousBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, []);

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
              Профиль
            </h2>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={closeMyOrderPanel}
            aria-label="Закрыть профиль"
          >
            <span className={styles.closeGlyph} aria-hidden="true">×</span>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </aside>
    </div>
  );
}
