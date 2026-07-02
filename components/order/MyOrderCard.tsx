// ==================================================
// SECTION: MY ORDER
// РАЗДЕЛ: Мой заказ
//
// Purpose (EN):
// Premium order status card with timeline
//
// Назначение (RU):
// Карточка статуса заказа с таймлайном
// ==================================================
import type { CustomerOrderTimelineItem } from "@/components/orders/resolveCustomerOrderTimeline";

type MyOrderPrimaryItem = {
  bouquetName?: string;
  priceRub?: number;
};

type MyOrderCardProps = {
  orderId: string;
  statusLabel: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  cardMessage: string;
  customerComment: string;
  primaryOrderItem?: MyOrderPrimaryItem;
  bouquetsTotalRub?: number;
  deliveryZoneLabel?: string;
  deliveryZonePriceRub?: number;
  totalPriceRub?: number;
  orderTimeline: CustomerOrderTimelineItem[];
  formatCustomerOrderNumber: (orderId: string) => string;
  formatPrice: (priceRub: number) => string;
};

export function MyOrderCard({
  orderId,
  statusLabel,
  customerName,
  customerPhone,
  deliveryAddress,
  deliveryDate,
  deliveryTime,
  cardMessage,
  customerComment,
  primaryOrderItem,
  bouquetsTotalRub,
  deliveryZoneLabel,
  deliveryZonePriceRub,
  totalPriceRub,
  orderTimeline,
  formatCustomerOrderNumber,
  formatPrice,
}: MyOrderCardProps) {
  const resolvedBouquetsTotalRub =
    bouquetsTotalRub ?? primaryOrderItem?.priceRub ?? 0;
  const resolvedTotalPriceRub = totalPriceRub ?? resolvedBouquetsTotalRub;

  return (
    <article className="my-order-card my-order-card-premium">
      {/* ==================================================
SECTION: MY ORDER
РАЗДЕЛ: Баннер успешного принятия заказа
Purpose (EN): Success confirmation banner
Назначение (RU): Баннер успешного принятия заказа
================================================== */}
      <div className="my-order-success-message" role="status">
        <strong>Ваш заказ успешно принят 💐</strong>
        <p>Мы уже начали обработку вашего заказа</p>
      </div>

      {/* ==================================================
SECTION: MY ORDER
РАЗДЕЛ: Номер заказа и статус
Purpose (EN): Order number and status badge
Назначение (RU): Номер заказа и статус
================================================== */}
      <div className="my-order-card-header">
        <div>
          <span>Номер заказа</span>
          <strong>{formatCustomerOrderNumber(orderId)}</strong>
        </div>
        <span className="my-order-status-badge">
          {statusLabel}
        </span>
      </div>

      {/* ==================================================
SECTION: ORDER SUMMARY
РАЗДЕЛ: Строки деталей заказа
Purpose (EN): Concierge-style order details rows
Назначение (RU): Строки деталей заказа
================================================== */}
      <div className="my-order-concierge-list">
        <div className="my-order-concierge-row my-order-concierge-row-primary">
          <span>{primaryOrderItem?.bouquetName ?? "Букет"}</span>
          <strong>{formatPrice(resolvedBouquetsTotalRub)}</strong>
        </div>
        {deliveryZoneLabel ? (
          <div className="my-order-concierge-row">
            <span>Зона доставки · {deliveryZoneLabel}</span>
            <strong>
              {typeof deliveryZonePriceRub === "number"
                ? formatPrice(deliveryZonePriceRub)
                : "—"}
            </strong>
          </div>
        ) : null}
        {typeof deliveryZonePriceRub === "number" ? (
          <div className="my-order-concierge-row my-order-concierge-row-primary">
            <span>Итого к оплате</span>
            <strong>{formatPrice(resolvedTotalPriceRub)}</strong>
          </div>
        ) : null}
        <div className="my-order-concierge-row">
          <span>{customerName}</span>
          <strong>{customerPhone}</strong>
        </div>
        <div className="my-order-concierge-row my-order-concierge-row-wide">
          <span>Адрес</span>
          <strong>{deliveryAddress}</strong>
        </div>
        <div className="my-order-concierge-row">
          <span>{deliveryDate}</span>
          <strong>{deliveryTime}</strong>
        </div>
        {cardMessage && (
          <div className="my-order-concierge-row my-order-concierge-row-wide">
            <span>Открытка</span>
            <strong>{cardMessage}</strong>
          </div>
        )}
        {customerComment && (
          <div className="my-order-concierge-row my-order-concierge-row-wide">
            <span>Комментарий</span>
            <strong>{customerComment}</strong>
          </div>
        )}
      </div>

      {/* ==================================================
SECTION: MY ORDER
РАЗДЕЛ: Таймлайн статусов заказа
Purpose (EN): Status timeline steps
Назначение (RU): Таймлайн статусов заказа
================================================== */}
      <ol className="my-order-timeline" aria-label="Статус заказа">
        {orderTimeline.map((event) => (
          <li
            className={event.isLatest ? "completed" : ""}
            key={`${event.status}-${event.createdAt}`}
          >
            <span aria-hidden="true">{event.icon}</span>
            <div>
              <p>{event.titleRu}</p>
              <p>{event.createdAtLabel}</p>
              {event.note ? <p>{event.note}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
