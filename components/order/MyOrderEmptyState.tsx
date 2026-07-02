// ==================================================
// SECTION: MY ORDER
// РАЗДЕЛ: Мой заказ
//
// Purpose (EN):
// Empty state when customer has no orders
//
// Назначение (RU):
// Пустое состояние без заказов
// ==================================================
import { BrandLogo } from "@/components/brand/BrandLogo";

type MyOrderEmptyStateProps = {
  onCloseMyOrderPanel: () => void;
};

export function MyOrderEmptyState({
  onCloseMyOrderPanel,
}: MyOrderEmptyStateProps) {
  return (
    <div className="my-order-empty-card">
      <BrandLogo variant="compact" className="my-order-empty-mark" />
      <p>У вас пока нет заказов</p>
      <a
        className="buy-button my-order-empty-button"
        href="#catalog"
        onClick={onCloseMyOrderPanel}
      >
        Перейти к букетам
      </a>
    </div>
  );
}
