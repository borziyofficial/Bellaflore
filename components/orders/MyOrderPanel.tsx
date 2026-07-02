// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Панель профиля
// ==================================================
"use client";

import { type ReactNode, useEffect } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";

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
      className="cart-panel-overlay my-order-panel-overlay profile-panel-overlay"
      role="presentation"
      onClick={closeMyOrderPanel}
    >
      <aside
        className={`cart-panel my-order-panel profile-panel-sheet${
          expanded ? " profile-panel-sheet-expanded" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-profile-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cart-panel-header profile-panel-header">
          <div>
            <BrandLogo variant="panel" className="cart-panel-eyebrow" />
            <h2 id="my-profile-panel-title">Мой профиль</h2>
          </div>
          <div className="cart-panel-actions">
            <button
              type="button"
              className="cart-panel-close"
              onClick={closeMyOrderPanel}
              aria-label="Закрыть профиль"
            >
              ×
            </button>
          </div>
        </div>
        <div className="profile-panel-body">{children}</div>
      </aside>
    </div>
  );
}
