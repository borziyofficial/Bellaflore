// ==================================================
// SECTION: MY ORDER
// РАЗДЕЛ: Мой заказ
//
// Purpose (EN):
// Page section wrapper for customer order status
//
// Назначение (RU):
// Обёртка секции «Мой заказ» на странице
// ==================================================
import type { ReactNode } from "react";

type OrdersSectionProps = {
  children: ReactNode;
};

export function OrdersSection({ children }: OrdersSectionProps) {
  return (
    <section id="orders" className="bouquets temporary-order-section">
      <div className="section-header">
        <span>Мой заказ</span>
        <h2>Мой заказ</h2>
      </div>
      <div className="temporary-order-panel">
        {children}
      </div>
    </section>
  );
}
