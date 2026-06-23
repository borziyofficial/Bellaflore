type MyOrderTimelineStep = {
  status: string;
  label: string;
};

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
  activeTimelineIndex: number;
  customerOrderTimeline: MyOrderTimelineStep[];
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
  activeTimelineIndex,
  customerOrderTimeline,
  formatCustomerOrderNumber,
  formatPrice,
}: MyOrderCardProps) {
  return (
    <article className="my-order-card my-order-card-premium">
      <div className="my-order-success-message" role="status">
        <strong>Ваш заказ успешно принят 💐</strong>
        <p>Мы уже начали обработку вашего заказа</p>
      </div>

      <div className="my-order-card-header">
        <div>
          <span>Номер заказа</span>
          <strong>{formatCustomerOrderNumber(orderId)}</strong>
        </div>
        <span className="my-order-status-badge">
          {statusLabel}
        </span>
      </div>

      <div className="my-order-concierge-list">
        <div className="my-order-concierge-row my-order-concierge-row-primary">
          <span>{primaryOrderItem?.bouquetName ?? "Букет"}</span>
          <strong>{formatPrice(primaryOrderItem?.priceRub ?? 0)}</strong>
        </div>
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

      <ol className="my-order-timeline" aria-label="Статус заказа">
        {customerOrderTimeline.map((step, index) => {
          const isCompleted = index === activeTimelineIndex;

          return (
            <li
              className={isCompleted ? "completed" : ""}
              key={step.status}
            >
              <span aria-hidden="true">{isCompleted ? "✓" : "○"}</span>
              <p>{step.label}</p>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
