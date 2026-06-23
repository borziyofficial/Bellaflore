"use client";

import { type ReactNode } from "react";

type MyOrderPanelProps = {
  children: ReactNode;
  closeMyOrderPanel: () => void;
};

export function MyOrderPanel({
  children,
  closeMyOrderPanel,
}: MyOrderPanelProps) {
  return (
    <div
      className="cart-panel-overlay my-order-panel-overlay"
      role="presentation"
      onClick={closeMyOrderPanel}
    >
      <aside
        className="cart-panel my-order-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-order-panel-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cart-panel-header">
          <div>
            <span className="cart-panel-eyebrow">Bellaflore</span>
            <h2 id="my-order-panel-title">Мой заказ</h2>
          </div>
          <div className="cart-panel-actions">
            <button
              type="button"
              className="cart-panel-close"
              onClick={closeMyOrderPanel}
              aria-label="Закрыть мой заказ"
            >
              ×
            </button>
          </div>
        </div>
        {children}
      </aside>
    </div>
  );
}
