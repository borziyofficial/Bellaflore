// ==================================================
// SECTION: ORDER SUMMARY
// РАЗДЕЛ: Итог заказа
//
// Purpose (EN):
// Unified checkout summary with full multiline details
//
// Назначение (RU):
// Единый итог заказа с полными многострочными данными
// ==================================================
import {
  buildCheckoutOrderPreview,
  previewDisplayValue,
} from "@/components/checkout/buildCheckoutOrderPreview";
import type { CheckoutForm, DeliveryDatePreset } from "@/components/checkout/checkoutTypes";

type CheckoutPreviewCartItem = {
  bouquet: {
    id: string;
    title: string;
    priceRub: number;
  };
  sizeId: string;
  sizeLabel: string;
  quantity: number;
};

type CheckoutOrderPreviewProps = {
  checkoutForm: CheckoutForm;
  cartBouquets: CheckoutPreviewCartItem[];
  deliveryDateMode: DeliveryDatePreset;
  formatPrice: (priceRub: number) => string;
  recipientLabel: string;
  paymentLabel: string;
  bouquetSubtotal: number;
  deliveryPriceLabel: string;
  deliveryZoneLabel?: string | null;
  grandTotal: number;
};

export function CheckoutOrderPreview({
  checkoutForm,
  cartBouquets,
  deliveryDateMode,
  formatPrice,
  recipientLabel,
  paymentLabel,
  bouquetSubtotal,
  deliveryPriceLabel,
  deliveryZoneLabel = null,
  grandTotal,
}: CheckoutOrderPreviewProps) {
  const preview = buildCheckoutOrderPreview(
    checkoutForm,
    cartBouquets,
    deliveryDateMode,
  );
  const deliveryLine = [preview.deliveryDateLabel, preview.deliveryInterval]
    .filter(Boolean)
    .join(" · ");

  return (
    <section
      className="checkout-summary checkout-order-preview"
      aria-label="Итог заказа"
      aria-live="polite"
    >
      <dl className="checkout-preview-details">
        <div>
          <dt>Получатель</dt>
          <dd>{previewDisplayValue(recipientLabel)}</dd>
        </div>
        <div>
          <dt>Телефон</dt>
          <dd>{previewDisplayValue(preview.phone)}</dd>
        </div>
        <div>
          <dt>Адрес</dt>
          <dd>{previewDisplayValue(preview.deliveryAddress)}</dd>
        </div>
        <div>
          <dt>Доставка</dt>
          <dd>{previewDisplayValue(deliveryLine)}</dd>
        </div>
        <div>
          <dt>Оплата</dt>
          <dd>{previewDisplayValue(paymentLabel)}</dd>
        </div>
        {preview.comment ? (
          <div>
            <dt>Комментарий</dt>
            <dd>{preview.comment}</dd>
          </div>
        ) : null}
      </dl>

      {preview.items.length === 0 ? (
        <p className="checkout-preview-empty" role="status">
          Добавьте букет, чтобы увидеть состав заказа.
        </p>
      ) : (
        <div className="checkout-preview-items">
          {preview.items.map((item) => (
            <div className="checkout-preview-item" key={`preview-${item.id}`}>
              <div>
                <strong>{item.title}</strong>
                <span>Размер {item.sizeLabel}</span>
                <span>
                  {item.quantity > 1 ? `${item.quantity} × ` : ""}
                  {formatPrice(item.priceRub * item.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="checkout-preview-totals">
        <div className="checkout-total-row">
          <span>Букеты</span>
          <strong>{formatPrice(bouquetSubtotal)}</strong>
        </div>
        <div className="checkout-total-row checkout-delivery-row">
          <span>
            Доставка
            {deliveryZoneLabel ? ` · ${deliveryZoneLabel}` : ""}
          </span>
          <strong>{deliveryPriceLabel}</strong>
        </div>
        <div className="checkout-total-row checkout-grand-total-row">
          <span>Итого</span>
          <strong>{formatPrice(grandTotal)}</strong>
        </div>
      </div>
    </section>
  );
}
