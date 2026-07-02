// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Официальная панель оформления заказа
// ==================================================
"use client";

import { type ReactNode, useEffect } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";

type CheckoutPanelProps = {
  children: ReactNode;
  closeCheckoutPanel: () => void;
};

export function CheckoutPanel({
  children,
  closeCheckoutPanel,
}: CheckoutPanelProps) {
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
      className="checkout-v3-overlay"
      role="presentation"
      onClick={closeCheckoutPanel}
    >
      <aside
        className="checkout-v3-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-v3-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="checkout-v3-header">
          <div>
            <BrandLogo variant="panel" className="checkout-v3-eyebrow" />
            <h2 id="checkout-v3-title">Оформить заказ</h2>
          </div>
          <div className="checkout-v3-actions">
            <button
              type="button"
              className="checkout-v3-close"
              onClick={closeCheckoutPanel}
              aria-label="Закрыть оформление заказа"
            >
              ×
            </button>
          </div>
        </div>
        <div className="checkout-v3-body">{children}</div>
      </aside>
    </div>
  );
}
