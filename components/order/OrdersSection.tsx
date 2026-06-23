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
