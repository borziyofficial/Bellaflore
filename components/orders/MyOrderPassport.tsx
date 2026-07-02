// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Компактный паспорт заказа в «Мой профиль»
// ==================================================
"use client";

import styles from "@/components/orders/MyOrderPassport.module.css";

export type OrderPassportData = {
  recipientName: string;
  phone: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  paymentMethod: string;
  bouquetName: string;
  productPriceRub: number | null;
  deliveryPriceRub: number | null;
  totalRub: number | null;
  orderStatus: string;
  courierStatus: string;
  hasConfirmedOrder: boolean;
};

type MyOrderPassportProps = {
  data: OrderPassportData;
  formatPrice: (priceRub: number) => string;
};

function displayValue(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "Не указано";
}

function displayPrice(
  value: number | null,
  formatPrice: (priceRub: number) => string,
): string {
  return value !== null ? formatPrice(value) : "Не указано";
}

function PassportRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}

export function MyOrderPassport({ data, formatPrice }: MyOrderPassportProps) {
  return (
    <article className={styles.passport} aria-label="Детали заказа">
      <PassportRow label="Получатель" value={displayValue(data.recipientName)} />
      <PassportRow label="Телефон" value={displayValue(data.phone)} />
      <PassportRow label="Адрес" value={displayValue(data.address)} />
      <PassportRow
        label="Доставка"
        value={
          data.deliveryDate.trim() || data.deliveryTime.trim()
            ? [data.deliveryDate, data.deliveryTime].filter(Boolean).join(" · ")
            : "Не указано"
        }
      />
      <PassportRow label="Оплата" value={displayValue(data.paymentMethod)} />
      <PassportRow label="Букет" value={displayValue(data.bouquetName)} />
      <PassportRow
        label="Стоимость букета"
        value={displayPrice(data.productPriceRub, formatPrice)}
      />
      <PassportRow
        label="Доставка"
        value={displayPrice(data.deliveryPriceRub, formatPrice)}
      />
      <div className={`${styles.row} ${styles.totalRow}`}>
        <span className={styles.label}>Итого</span>
        <span className={styles.totalValue}>
          {displayPrice(data.totalRub, formatPrice)}
        </span>
      </div>
      <PassportRow label="Статус заказа" value={displayValue(data.orderStatus)} />
      <PassportRow label="Курьер" value={displayValue(data.courierStatus)} />
      {!data.hasConfirmedOrder ? (
        <p className={styles.trackingNote}>
          Отслеживание появится после подтверждения заказа
        </p>
      ) : null}
    </article>
  );
}

type MyOrderPassportEmptyProps = {
  onOpenCatalog: () => void;
};

export function MyOrderPassportEmpty({
  onOpenCatalog,
}: MyOrderPassportEmptyProps) {
  return (
    <div className={styles.empty} role="status">
      <p className={styles.emptyTitle}>Заказ пока не создан</p>
      <p className={styles.emptyCopy}>
        Выберите букет в каталоге — заказ появится здесь.
      </p>
      <p className={styles.trackingNote}>
        Курьер будет назначен после подтверждения заказа
      </p>
      <div className={styles.emptyActions}>
        <button type="button" className={styles.emptyButton} onClick={onOpenCatalog}>
          В каталог
        </button>
      </div>
    </div>
  );
}
