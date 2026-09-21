// ==================================================
// SECTION: MY ORDER
// РАЗДЕЛ: Панель «Мой заказ» (BellaFlore Premium)
//
// Purpose (EN):
// Shows the customer's own order directly — no profile dashboard,
// no menu, no "coming soon" placeholders. Either the unconfirmed
// cart-draft passport, the real server-confirmed order, or the
// premium empty state.
//
// Назначение (RU):
// Показывает заказ покупателя напрямую — без меню профиля и без
// заглушек «Скоро». Либо черновик корзины, либо подтверждённый
// заказ с сервера, либо premium-заглушка пустого состояния.
// ==================================================
"use client";

import {
  MyOrderPassport,
  type OrderPassportData,
} from "@/components/orders/MyOrderPassport";
import { MyOrderLookupSection } from "@/components/orders/MyOrderLookupSection";
import styles from "@/components/orders/MyOrderHub.module.css";

type MyOrderHubProps = {
  passport: OrderPassportData | null;
  hasDraftOrder: boolean;
  /** Real server order number of the customer's most recent order (persists across visits). */
  latestOrderNumber: string | null;
  onOpenCatalog: () => void;
  formatPrice: (priceRub: number) => string;
};

export function MyOrderHub({
  passport,
  hasDraftOrder,
  latestOrderNumber,
  onOpenCatalog,
  formatPrice,
}: MyOrderHubProps) {
  const isUnconfirmedCartPreview =
    passport !== null && hasDraftOrder && !passport.hasConfirmedOrder;

  return (
    <div className={styles.hub}>
      {isUnconfirmedCartPreview ? (
        <MyOrderPassport data={passport} formatPrice={formatPrice} />
      ) : (
        <MyOrderLookupSection
          initialOrderNumber={latestOrderNumber}
          onOpenCatalog={onOpenCatalog}
          formatPrice={formatPrice}
        />
      )}
    </div>
  );
}
