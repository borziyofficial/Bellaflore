// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Официальная панель оформления заказа
// ==================================================
"use client";

import { type ReactNode } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useBodyScrollLock } from "@/lib/ui/useBodyScrollLock";

type CheckoutPanelProps = {
  children: ReactNode;
  closeCheckoutPanel: () => void;
};

export function CheckoutPanel({
  children,
  closeCheckoutPanel,
}: CheckoutPanelProps) {
  useBodyScrollLock(true);

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
