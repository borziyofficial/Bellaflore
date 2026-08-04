// ==================================================
// SECTION: MY PROFILE
// РАЗДЕЛ: Компактный паспорт заказа в «Мой профиль»
// ==================================================
"use client";

import type { CustomerOrderStatusId } from "@/components/orders/orderStatus";
import styles from "@/components/orders/MyOrderPassport.module.css";

export type OrderPassportItem = {
  name: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: number | null;
  lineTotal: number | null;
};

export type OrderPassportData = {
  orderNumber?: string | null;
  createdAtLabel?: string | null;
  recipientName: string;
  phone: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  paymentMethod: string;
  bouquetName: string;
  items?: OrderPassportItem[];
  comment?: string;
  productPriceRub: number | null;
  deliveryPriceRub: number | null;
  totalRub: number | null;
  orderStatus: string;
  statusColorId?: CustomerOrderStatusId;
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
  const items = data.items ?? [];
  const statusClassName = data.statusColorId
    ? styles[`status${data.statusColorId}`]
    : undefined;

  return (
    <article className={styles.passportWrap} aria-label="Детали заказа">
      <div className={styles.statusHeader}>
        <span
          className={`${styles.statusBadge} ${statusClassName ?? ""}`}
          role="status"
        >
          {displayValue(data.orderStatus)}
        </span>
        {data.orderNumber ? (
          <span className={styles.orderNumber}>Заказ {data.orderNumber}</span>
        ) : null}
        {data.createdAtLabel ? (
          <span className={styles.orderDate}>{data.createdAtLabel}</span>
        ) : null}
      </div>

      <article className={styles.passport}>
        {items.length > 0 ? (
          <div className={`${styles.row} ${styles.itemsRow}`}>
            <span className={styles.label}>Состав заказа</span>
            <ul className={styles.itemsList}>
              {items.map((item, index) => (
                <li key={`${item.name}-${index}`} className={styles.itemRow}>
                  <span className={styles.itemName}>
                    {item.name}
                    {item.sizeLabel ? ` · ${item.sizeLabel}` : ""}
                    {item.quantity > 1 ? ` ×${item.quantity}` : ""}
                  </span>
                  <span className={styles.itemPrice}>
                    {item.lineTotal !== null ? formatPrice(item.lineTotal) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <PassportRow label="Букет" value={displayValue(data.bouquetName)} />
        )}
        <PassportRow label="Получатель" value={displayValue(data.recipientName)} />
        <PassportRow label="Телефон" value={displayValue(data.phone)} />
        <PassportRow label="Адрес" value={displayValue(data.address)} />
        <PassportRow
          label="Дата и время доставки"
          value={
            data.deliveryDate.trim() || data.deliveryTime.trim()
              ? [data.deliveryDate, data.deliveryTime].filter(Boolean).join(" · ")
              : "Не указано"
          }
        />
        {data.paymentMethod.trim() ? (
          <PassportRow label="Оплата" value={displayValue(data.paymentMethod)} />
        ) : null}
        {data.comment?.trim() ? (
          <PassportRow label="Комментарий" value={data.comment.trim()} />
        ) : null}
        <PassportRow
          label="Стоимость товаров"
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
        <PassportRow label="Курьер" value={displayValue(data.courierStatus)} />
        {!data.hasConfirmedOrder ? (
          <p className={styles.trackingNote}>
            Отслеживание появится после подтверждения заказа
          </p>
        ) : null}
      </article>
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
