"use client";

import {
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";

type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  cardMessage: string;
  comment: string;
};

type DeliveryDatePreset = "today" | "tomorrow" | "custom";

type DeliveryZone = {
  id: string;
  title: string;
  distanceLabel: string;
  priceRub: number;
  estimatedTime: string;
  color: string;
};

type DeliveryInterval = {
  label: string;
  startMinutes: number;
};

type CheckoutBouquet = {
  id: string;
  title: string;
  description: string;
  priceRub: number;
};

type CheckoutCartItem = {
  bouquet: CheckoutBouquet;
  quantity: number;
};

type CheckoutSectionProps = {
  checkoutForm: CheckoutForm;
  deliveryZones: DeliveryZone[];
  selectedDeliveryZone: DeliveryZone;
  deliveryDateMode: DeliveryDatePreset;
  todayDateValue: string;
  availableDeliveryIntervals: DeliveryInterval[];
  cartBouquets: CheckoutCartItem[];
  checkoutTotalPrice: number;
  checkoutGrandTotalPrice: number;
  checkoutValidationErrors: string[];
  checkoutSuccessMessage: string;
  cartItemCount: number;
  formatPrice: (priceRub: number) => string;
  handleCheckoutFieldChange: (
    field: keyof CheckoutForm,
    value: string,
  ) => void;
  selectDeliveryDatePreset: (mode: DeliveryDatePreset) => void;
  handleCustomDeliveryDateChange: (value: string) => void;
  handleOrdersClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
  handleOrdersTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => void;
  handleConfirmOrderClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
  handleConfirmOrderTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => void;
};

export function CheckoutSection({
  checkoutForm,
  deliveryZones,
  selectedDeliveryZone,
  deliveryDateMode,
  todayDateValue,
  availableDeliveryIntervals,
  cartBouquets,
  checkoutTotalPrice,
  checkoutGrandTotalPrice,
  checkoutValidationErrors,
  checkoutSuccessMessage,
  cartItemCount,
  formatPrice,
  handleCheckoutFieldChange,
  selectDeliveryDatePreset,
  handleCustomDeliveryDateChange,
  handleOrdersClick,
  handleOrdersTouchEnd,
  handleConfirmOrderClick,
  handleConfirmOrderTouchEnd,
}: CheckoutSectionProps) {
  return (
    <section id="checkout" className="checkout-section">
      <div className="section-header">
        <span>Оформление</span>
        <h2>Оформить заказ</h2>
      </div>
      <div className="checkout-shell">
        <div className="checkout-form-card">
          <div className="checkout-card-header">
            <span>Bellaflore</span>
            <h3>Данные доставки</h3>
          </div>
          <div className="checkout-form-grid">
            <label className="checkout-field">
              <span>Имя заказчика</span>
              <input
                type="text"
                value={checkoutForm.name}
                onChange={(event) =>
                  handleCheckoutFieldChange("name", event.target.value)
                }
                placeholder="Ваше имя"
                autoComplete="name"
                aria-label="Имя заказчика"
                required
              />
            </label>
            <label className="checkout-field">
              <span>Телефон</span>
              <input
                type="tel"
                value={checkoutForm.phone}
                onChange={(event) =>
                  handleCheckoutFieldChange("phone", event.target.value)
                }
                placeholder="+7"
                autoComplete="tel"
                aria-label="Телефон"
                required
              />
            </label>
            <label className="checkout-field checkout-field-wide">
              <span>Адрес доставки</span>
              <input
                type="text"
                value={checkoutForm.address}
                onChange={(event) =>
                  handleCheckoutFieldChange("address", event.target.value)
                }
                placeholder="Улица, дом, квартира"
                autoComplete="street-address"
                aria-label="Адрес доставки"
                required
              />
            </label>

            <section
              className="delivery-zone-card checkout-field-wide"
              aria-label="Зона доставки"
            >
              <div className="delivery-zone-map" aria-hidden="true">
                <div className="delivery-zone-map-rings">
                  {deliveryZones.map((zone, index) => (
                    <span
                      className={`delivery-zone-ring ${
                        selectedDeliveryZone.id === zone.id
                          ? "delivery-zone-ring-active"
                          : ""
                      }`}
                      key={zone.id}
                      style={{
                        width: `${100 - index * 12}%`,
                        height: `${100 - index * 12}%`,
                        borderColor: zone.color,
                        backgroundColor:
                          selectedDeliveryZone.id === zone.id
                            ? `${zone.color}2e`
                            : `${zone.color}12`,
                      }}
                    >
                      {index === deliveryZones.length - 1 && (
                        <span className="delivery-zone-map-center">
                          МКАД
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <div className="delivery-zone-info">
                <span>Автоопределение зоны</span>
                <h4>
                  {selectedDeliveryZone.title}:{" "}
                  {selectedDeliveryZone.distanceLabel}
                </h4>
                <dl>
                  <div>
                    <dt>Доставка</dt>
                    <dd>{formatPrice(selectedDeliveryZone.priceRub)}</dd>
                  </div>
                  <div>
                    <dt>Время</dt>
                    <dd>{selectedDeliveryZone.estimatedTime}</dd>
                  </div>
                </dl>
              </div>
            </section>

            <div className="checkout-choice-group checkout-field-wide">
              <span>Дата доставки</span>
              <div className="checkout-date-options">
                <button
                  type="button"
                  className={`checkout-choice-button ${
                    deliveryDateMode === "today" ? "selected" : ""
                  }`}
                  onClick={() => selectDeliveryDatePreset("today")}
                >
                  Сегодня
                </button>
                <button
                  type="button"
                  className={`checkout-choice-button ${
                    deliveryDateMode === "tomorrow" ? "selected" : ""
                  }`}
                  onClick={() => selectDeliveryDatePreset("tomorrow")}
                >
                  Завтра
                </button>
                <button
                  type="button"
                  className={`checkout-choice-button ${
                    deliveryDateMode === "custom" ? "selected" : ""
                  }`}
                  onClick={() => selectDeliveryDatePreset("custom")}
                >
                  Выбрать дату
                </button>
              </div>
              {deliveryDateMode === "custom" && (
                <label className="checkout-field checkout-custom-date">
                  <span>Дата</span>
                  <input
                    type="date"
                    value={checkoutForm.deliveryDate}
                    min={todayDateValue}
                    onChange={(event) =>
                      handleCustomDeliveryDateChange(event.target.value)
                    }
                    aria-label="Выбрать дату доставки"
                    required
                  />
                </label>
              )}
            </div>

            <label className="checkout-field checkout-field-wide">
              <span>Интервал доставки</span>
              {availableDeliveryIntervals.length > 0 ? (
                <select
                  value={checkoutForm.deliveryTime}
                  onChange={(event) =>
                    handleCheckoutFieldChange(
                      "deliveryTime",
                      event.target.value,
                    )
                  }
                  aria-label="Интервал доставки"
                  required
                >
                  <option value="">Выберите интервал</option>
                  {availableDeliveryIntervals.map((interval) => (
                    <option
                      value={interval.label}
                      key={interval.label}
                    >
                      {interval.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="checkout-empty-summary">
                  {checkoutForm.deliveryDate
                    ? "На выбранную дату доступных интервалов уже нет. Выберите завтра или другую дату."
                  : "Выберите дату доставки, чтобы увидеть доступные интервалы."}
                </p>
              )}
            </label>

            <label className="checkout-field checkout-field-wide">
              <span>Открытка</span>
              <input
                type="text"
                value={checkoutForm.cardMessage}
                onChange={(event) =>
                  handleCheckoutFieldChange(
                    "cardMessage",
                    event.target.value,
                  )
                }
                placeholder="Текст для открытки"
                aria-label="Открытка"
              />
            </label>
            <label className="checkout-field checkout-field-wide">
              <span>Комментарий</span>
              <textarea
                value={checkoutForm.comment}
                onChange={(event) =>
                  handleCheckoutFieldChange("comment", event.target.value)
                }
                placeholder="Пожелания к заказу"
                aria-label="Комментарий к заказу"
                rows={4}
              />
            </label>
          </div>

          <section className="checkout-summary" aria-label="Итог заказа">
            <div className="checkout-card-header">
              <span>Итог заказа</span>
              <h3>Ваш заказ</h3>
            </div>
            <div className="checkout-items">
              {cartBouquets.length === 0 && (
                <p className="checkout-empty-summary">
                  Корзина очищена после оформления заказа.
                </p>
              )}
              {cartBouquets.map((cartItem) => (
                <div
                  className="checkout-item"
                  key={`checkout-${cartItem.bouquet.id}`}
                >
                  <div>
                    <strong>{cartItem.bouquet.title}</strong>
                    <span>{cartItem.bouquet.description}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>Количество</dt>
                      <dd>{cartItem.quantity}</dd>
                    </div>
                    <div>
                      <dt>Цена</dt>
                      <dd>{formatPrice(cartItem.bouquet.priceRub)}</dd>
                    </div>
                    <div>
                      <dt>Итого</dt>
                      <dd>
                        {formatPrice(
                          cartItem.bouquet.priceRub * cartItem.quantity,
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
            <div className="checkout-total-row">
              <span>Букеты</span>
              <strong>{formatPrice(checkoutTotalPrice)}</strong>
            </div>
            <div className="checkout-total-row checkout-delivery-row">
              <span>
                Доставка · {selectedDeliveryZone.title},{" "}
                {selectedDeliveryZone.estimatedTime}
              </span>
              <strong>{formatPrice(selectedDeliveryZone.priceRub)}</strong>
            </div>
            <div className="checkout-total-row checkout-grand-total-row">
              <span>Итого к оплате</span>
              <strong>{formatPrice(checkoutGrandTotalPrice)}</strong>
            </div>
          </section>

          {checkoutValidationErrors.length > 0 && (
            <div className="checkout-validation" role="alert">
              {checkoutValidationErrors.map((error) => (
                <p key={error}>{error}</p>
              ))}
            </div>
          )}

          {checkoutSuccessMessage && (
            <div className="checkout-success" role="status">
              <strong>{checkoutSuccessMessage}</strong>
              <p>Корзина очищена. Избранные букеты сохранены.</p>
              <button
                type="button"
                className="buy-button checkout-secondary-button"
                onClick={handleOrdersClick}
                onTouchEnd={handleOrdersTouchEnd}
              >
                Показать заказы
              </button>
            </div>
          )}

          <div className="checkout-submit-row">
            <div>
              <span>Итого</span>
              <strong>{formatPrice(checkoutGrandTotalPrice)}</strong>
            </div>
            {cartItemCount > 0 && (
              <button
                type="button"
                className="buy-button checkout-submit-button"
                onClick={handleConfirmOrderClick}
                onTouchEnd={handleConfirmOrderTouchEnd}
              >
                Отправить заказ
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
