// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Оформление заказа
//
// Purpose (EN):
// Full checkout form with delivery, validation, and order summary
//
// Назначение (RU):
// Форма оформления заказа с доставкой и итогами
// ==================================================
"use client";

import {
  cacheGeocodingFromAddressSuggestion,
  confirmAddressSuggestionSelection,
  confirmMapPointSelection,
} from "@/components/checkout/checkoutGeocodingBridge";
import {
  CheckoutMapPanel,
  type CheckoutMapPointSelection,
} from "@/components/checkout/CheckoutMapPanel";
import { DeliveryValidationPreview } from "@/components/deliveryValidation/DeliveryValidationPreview";
import { LiveDeliveryExperienceCard } from "@/components/deliveryZones/LiveDeliveryExperienceCard";
import { resolveNearestDeliveryIntervalLabel } from "@/components/deliveryZones/liveDeliveryExperience";
import {
  canSubmitCheckoutWithDeliveryPrice,
} from "@/components/deliveryZones/deliveryPriceEngine";
import {
  formatDeliveryConfidencePriceLabel,
} from "@/components/deliveryConfidence/DeliveryConfidenceCheckoutHint";
import type { DeliveryConfidenceResult } from "@/components/deliveryConfidence/deliveryConfidenceTypes";
import { canSubmitCheckoutWithDeliveryValidation } from "@/components/deliveryValidation/deliveryValidationEngine";
import type { DeliveryValidationResult } from "@/components/deliveryValidation/deliveryValidationTypes";
import type { DeliveryPriceResult } from "@/components/deliveryZones/deliveryPriceTypes";
import { getDeliveryPriceUnavailableMessage } from "@/components/deliveryZones/deliveryPriceTypes";
import type { RealDeliveryZoneResult } from "@/components/deliveryZones/realDeliveryZoneTypes";
import { AddressIntelligenceInput } from "@/components/checkout/AddressIntelligenceInput";
import { CheckoutCollapsible } from "@/components/checkout/CheckoutCollapsible";
import { CheckoutOptionToggle } from "@/components/checkout/CheckoutOptionToggle";
import { composeSmartCheckoutComment } from "@/components/checkout/checkoutSmartComment";
import checkoutSectionStyles from "@/components/checkout/CheckoutSection.module.css";
import type { AddressSuggestion } from "@/components/addressIntelligence/addressIntelligenceTypes";
import {
  buildLiveAddressPreviewFromSuggestion,
  clearLiveAddressPreview,
} from "@/components/addressIntelligence/liveAddressPreview";
import type { LiveAddressPreview } from "@/components/addressIntelligence/liveAddressPreviewTypes";
import type { DeliveryInterval } from "@/components/checkout/deliveryIntervals";
import type {
  CheckoutForm,
  CheckoutValidatedField,
  DeliveryDatePreset,
} from "@/components/checkout/checkoutTypes";
import {
  getCheckoutFieldErrors,
  isCheckoutFormReady,
} from "@/components/checkout/validateCheckoutForm";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type MouseEvent as ReactMouseEvent,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { flushSync } from "react-dom";

type CheckoutBouquet = {
  id: string;
  title: string;
  description: string;
  priceRub: number;
};

type CheckoutCartItem = {
  bouquet: CheckoutBouquet;
  sizeId: string;
  sizeLabel: string;
  quantity: number;
};

type CheckoutSectionProps = {
  checkoutForm: CheckoutForm;
  deliveryDateMode: DeliveryDatePreset;
  todayDateValue: string;
  availableDeliveryIntervals: DeliveryInterval[];
  cartBouquets: CheckoutCartItem[];
  checkoutTotalPrice: number;
  checkoutGrandTotalPrice: number;
  checkoutValidationNow: Date;
  cartItemCount: number;
  formatPrice: (priceRub: number) => string;
  handleCheckoutFieldChange: (
    field: keyof CheckoutForm,
    value: string,
  ) => void;
  selectDeliveryDatePreset: (mode: DeliveryDatePreset) => void;
  handleCustomDeliveryDateChange: (value: string) => void;
  checkoutSubmitInProgress: boolean;
  checkoutSubmitError: string | null;
  realDeliveryZoneResult: RealDeliveryZoneResult;
  deliveryPriceResult: DeliveryPriceResult;
  deliveryConfidenceResult: DeliveryConfidenceResult;
  deliveryValidationResult: DeliveryValidationResult;
  handleConfirmOrderClick: (
    event: ReactMouseEvent<HTMLButtonElement>,
  ) => void;
  handleConfirmOrderTouchEnd: (
    event: ReactTouchEvent<HTMLButtonElement>,
  ) => void;
  embedded?: boolean;
};

type PaymentMethodUi = "online" | "cash" | "card";

const PAYMENT_METHOD_LABELS: Record<PaymentMethodUi, string> = {
  online: "СБП",
  cash: "Наличными при получении",
  card: "Картой при получении",
};

const CHECKOUT_V2_PAYMENT_METHODS: PaymentMethodUi[] = ["online", "cash"];

export function CheckoutSection({
  checkoutForm,
  deliveryDateMode,
  todayDateValue,
  availableDeliveryIntervals,
  cartBouquets,
  checkoutTotalPrice,
  checkoutGrandTotalPrice,
  checkoutValidationNow,
  cartItemCount,
  formatPrice,
  handleCheckoutFieldChange,
  selectDeliveryDatePreset,
  handleCustomDeliveryDateChange,
  checkoutSubmitInProgress,
  checkoutSubmitError,
  realDeliveryZoneResult,
  deliveryPriceResult,
  deliveryConfidenceResult,
  deliveryValidationResult,
  handleConfirmOrderClick,
  handleConfirmOrderTouchEnd,
  embedded = false,
}: CheckoutSectionProps) {
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<CheckoutValidatedField>>(
    () => new Set(),
  );
  const selectedSuggestionAddressRef = useRef<string | null>(null);
  const [liveAddressPreview, setLiveAddressPreview] =
    useState<LiveAddressPreview | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodUi>("cash");
  const [isOtherRecipient, setIsOtherRecipient] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [courierComment, setCourierComment] = useState("");
  const [wantsCard, setWantsCard] = useState(false);
  const [anonymousDelivery, setAnonymousDelivery] = useState(false);

  const fieldErrors = getCheckoutFieldErrors(checkoutForm, checkoutValidationNow);
  const isFormReady = isCheckoutFormReady(
    checkoutForm,
    cartItemCount > 0,
    checkoutValidationNow,
  );
  const canSubmitDeliveryPrice =
    canSubmitCheckoutWithDeliveryPrice(deliveryPriceResult);
  const canSubmitDeliveryValidation =
    canSubmitCheckoutWithDeliveryValidation(deliveryValidationResult);
  const deliveryUnavailableMessage = getDeliveryPriceUnavailableMessage(
    deliveryPriceResult.status,
  );
  const canSubmitOrder =
    isFormReady &&
    canSubmitDeliveryPrice &&
    canSubmitDeliveryValidation &&
    !checkoutSubmitInProgress;

  const nearestDeliveryIntervalLabel = useMemo(
    () =>
      resolveNearestDeliveryIntervalLabel({
        deliveryTime: checkoutForm.deliveryTime,
        deliveryDate: checkoutForm.deliveryDate,
        nearestFromConfidence:
          deliveryConfidenceResult.nearestAvailableInterval,
        now: checkoutValidationNow,
      }),
    [
      checkoutForm.deliveryTime,
      checkoutForm.deliveryDate,
      deliveryConfidenceResult.nearestAvailableInterval,
      checkoutValidationNow,
    ],
  );

  const markFieldTouched = (field: CheckoutValidatedField) => {
    setTouchedFields((current) => {
      if (current.has(field)) {
        return current;
      }

      const next = new Set(current);
      next.add(field);
      return next;
    });
  };

  const handleAddressChange = (nextAddress: string) => {
    if (
      selectedSuggestionAddressRef.current &&
      nextAddress !== selectedSuggestionAddressRef.current
    ) {
      selectedSuggestionAddressRef.current = null;
      setLiveAddressPreview(clearLiveAddressPreview());
    }

    handleCheckoutFieldChange("address", nextAddress);
  };

  const handleAddressSuggestionSelect = (suggestion: AddressSuggestion) => {
    selectedSuggestionAddressRef.current = suggestion.fullAddress;
    handleCheckoutFieldChange("address", suggestion.label.trim());
    setLiveAddressPreview(buildLiveAddressPreviewFromSuggestion(suggestion));
    cacheGeocodingFromAddressSuggestion(suggestion);

    void confirmAddressSuggestionSelection(suggestion).then((confirmed) => {
      if (
        selectedSuggestionAddressRef.current !== suggestion.fullAddress &&
        selectedSuggestionAddressRef.current !== confirmed.fullAddress
      ) {
        return;
      }

      selectedSuggestionAddressRef.current = confirmed.fullAddress;
      handleCheckoutFieldChange(
        "address",
        confirmed.label.trim() || confirmed.fullAddress,
      );
      setLiveAddressPreview(buildLiveAddressPreviewFromSuggestion(confirmed));
      cacheGeocodingFromAddressSuggestion(confirmed);
    });
  };

  const handleAddressEdit = () => {
    if (!selectedSuggestionAddressRef.current) {
      return;
    }

    selectedSuggestionAddressRef.current = null;
    setLiveAddressPreview(clearLiveAddressPreview());
  };

  const handleMapPointSelect = useCallback(
    (point: CheckoutMapPointSelection) => {
      selectedSuggestionAddressRef.current = point.address;
      handleCheckoutFieldChange("address", point.address);
      setLiveAddressPreview({
        selectedAddress: point.address,
        latitude: point.latitude,
        longitude: point.longitude,
        hasCoordinates: true,
        previewStatus: "selected",
        updatedAt: new Date().toISOString(),
      });
      void confirmMapPointSelection(point.latitude, point.longitude, point.address);
    },
    [handleCheckoutFieldChange],
  );

  const addressFieldShowValidation =
    submitAttempted || touchedFields.has("address");

  const showFieldError = (field: CheckoutValidatedField) => {
    const message = fieldErrors[field];

    if (!message) {
      return null;
    }

    if (!submitAttempted && !touchedFields.has(field)) {
      return null;
    }

    return message;
  };

  const renderFieldError = (field: CheckoutValidatedField) => {
    const message = showFieldError(field);

    if (!message) {
      return null;
    }

    return (
      <span className="checkout-field-error" role="alert">
        {message}
      </span>
    );
  };

  useEffect(() => {
    if (deliveryDateMode !== "today") {
      selectDeliveryDatePreset("today");
    }
    // Pearl checkout v2 defaults to same-day delivery.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      checkoutForm.deliveryTime &&
      !availableDeliveryIntervals.some(
        (interval) => interval.label === checkoutForm.deliveryTime,
      )
    ) {
      handleCheckoutFieldChange("deliveryTime", "");
    }
  }, [availableDeliveryIntervals, checkoutForm.deliveryTime, handleCheckoutFieldChange]);

  const handleIntervalSelect = (intervalLabel: string) => {
    markFieldTouched("deliveryTime");
    handleCheckoutFieldChange("deliveryTime", intervalLabel);
  };

  const syncSmartCheckoutComment = () => {
    const mergedComment = composeSmartCheckoutComment({
      orderComment: checkoutForm.comment,
      isOtherRecipient,
      recipientName,
      recipientPhone,
      courierComment,
      anonymousDelivery,
    });

    if (mergedComment !== checkoutForm.comment) {
      flushSync(() => {
        handleCheckoutFieldChange("comment", mergedComment);
      });
    }
  };

  const handleSubmitClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    setSubmitAttempted(true);
    syncSmartCheckoutComment();

    if (!isFormReady || checkoutSubmitInProgress) {
      return;
    }

    handleConfirmOrderClick(event);
  };

  const handleSubmitTouchEnd = (event: ReactTouchEvent<HTMLButtonElement>) => {
    setSubmitAttempted(true);
    syncSmartCheckoutComment();

    if (!isFormReady || checkoutSubmitInProgress) {
      return;
    }

    handleConfirmOrderTouchEnd(event);
  };

  const handleOtherRecipientChange = (checked: boolean) => {
    setIsOtherRecipient(checked);

    if (!checked) {
      setRecipientName("");
      setRecipientPhone("");
      setCourierComment("");
    }
  };

  const handleWantsCardChange = (checked: boolean) => {
    setWantsCard(checked);

    if (!checked) {
      handleCheckoutFieldChange("cardMessage", "");
    }
  };

  const deliveryPriceLabel = formatDeliveryConfidencePriceLabel(
    deliveryConfidenceResult,
    formatPrice,
  );

  const deliverySummaryPrice =
    deliveryPriceLabel !== "—"
      ? deliveryPriceLabel
      : "Рассчитается после адреса";

  const bouquetSummaryLabel =
    cartBouquets.length === 1
      ? cartBouquets[0].bouquet.title
      : cartBouquets.length > 1
        ? `${cartBouquets.length} букета`
        : "Букет";

  const showInlineMap =
    checkoutForm.address.trim().length >= 2 ||
    Boolean(liveAddressPreview?.selectedAddress?.trim());

  const rootClassName = embedded
    ? "checkout-section checkout-section-v2 checkout-section-embedded"
    : "checkout-section checkout-section-v2";

  return (
    <section
      id={embedded ? "profile-checkout" : "checkout"}
      className={rootClassName}
      aria-label="Оформление заказа"
    >
      {!embedded ? (
        <div className="section-header">
          <span>Оформление</span>
          <h2>Оформить заказ</h2>
        </div>
      ) : null}
      <div className="checkout-shell">
        <div className={`checkout-form-card ${checkoutSectionStyles.checkoutV2Card}`}>
          <div className={checkoutSectionStyles.checkoutV2Flow}>
            <section className={checkoutSectionStyles.checkoutV2Block}>
              <h3 className={checkoutSectionStyles.checkoutV2BlockTitle}>
                Получатель
              </h3>
              <label className="checkout-field checkout-field-wide">
                <span>Имя</span>
                <input
                  type="text"
                  value={checkoutForm.name}
                  onChange={(event) =>
                    handleCheckoutFieldChange("name", event.target.value)
                  }
                  onBlur={() => markFieldTouched("name")}
                  placeholder="Имя для связи"
                  autoComplete="name"
                  aria-label="Имя"
                  aria-invalid={Boolean(fieldErrors.name)}
                  required
                />
                {renderFieldError("name")}
              </label>
              <label className="checkout-field checkout-field-wide">
                <span>Телефон</span>
                <input
                  type="tel"
                  value={checkoutForm.phone}
                  onChange={(event) =>
                    handleCheckoutFieldChange("phone", event.target.value)
                  }
                  onBlur={() => markFieldTouched("phone")}
                  placeholder="+7"
                  autoComplete="tel"
                  aria-label="Телефон"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  required
                />
                {renderFieldError("phone")}
              </label>

              <div className={checkoutSectionStyles.checkoutSmartOptions}>
                <CheckoutOptionToggle
                  id="checkout-other-recipient"
                  label="Получатель — другой человек"
                  checked={isOtherRecipient}
                  onChange={handleOtherRecipientChange}
                />
                <CheckoutOptionToggle
                  id="checkout-anonymous-delivery"
                  label="Анонимная доставка"
                  checked={anonymousDelivery}
                  onChange={setAnonymousDelivery}
                />
              </div>

              <CheckoutCollapsible open={anonymousDelivery}>
                <p
                  className={checkoutSectionStyles.checkoutAnonymousInfo}
                  role="status"
                >
                  Получатель не увидит информацию об отправителе.
                </p>
              </CheckoutCollapsible>

              <CheckoutCollapsible open={isOtherRecipient}>
                <label className="checkout-field checkout-field-wide">
                  <span>Имя получателя</span>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                    placeholder="Как зовут получателя"
                    autoComplete="name"
                    aria-label="Имя получателя"
                  />
                </label>
                <label className="checkout-field checkout-field-wide">
                  <span>Телефон получателя</span>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(event) => setRecipientPhone(event.target.value)}
                    placeholder="+7"
                    autoComplete="tel"
                    aria-label="Телефон получателя"
                  />
                </label>
                <label className="checkout-field checkout-field-wide">
                  <span>Комментарий курьеру</span>
                  <textarea
                    value={courierComment}
                    onChange={(event) => setCourierComment(event.target.value)}
                    placeholder="Подъезд, домофон, этаж, уточнения для курьера"
                    aria-label="Комментарий курьеру"
                    rows={4}
                  />
                </label>
              </CheckoutCollapsible>
            </section>

            <section className={checkoutSectionStyles.checkoutV2Block}>
              <h3 className={checkoutSectionStyles.checkoutV2BlockTitle}>
                Доставка
              </h3>
              <p className={checkoutSectionStyles.checkoutV2TodayBadge} role="status">
                Сегодня
              </p>
              <div className="checkout-choice-group checkout-field-wide">
                <span className="sr-only">Интервал доставки</span>
                {availableDeliveryIntervals.length > 0 ? (
                  <div className="checkout-interval-options">
                    {availableDeliveryIntervals.map((interval) => {
                      const isSelected =
                        checkoutForm.deliveryTime === interval.label;

                      return (
                        <button
                          type="button"
                          key={interval.label}
                          className={`checkout-choice-button checkout-interval-button ${
                            isSelected ? "selected" : ""
                          }`}
                          aria-pressed={isSelected}
                          onClick={() => handleIntervalSelect(interval.label)}
                        >
                          {interval.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="checkout-dropdown-empty" role="status">
                    На сегодня интервалов больше нет.
                  </p>
                )}
                {renderFieldError("deliveryTime")}
              </div>
            </section>

            <section className={checkoutSectionStyles.checkoutV2Block}>
              <h3 className={checkoutSectionStyles.checkoutV2BlockTitle}>
                Адрес
              </h3>
              <label className="checkout-field checkout-field-wide">
                <span className="sr-only">Адрес доставки</span>
                <AddressIntelligenceInput
                  value={checkoutForm.address}
                  onChange={handleAddressChange}
                  onSuggestionSelect={handleAddressSuggestionSelect}
                  onAddressEdit={handleAddressEdit}
                  onBlur={() => markFieldTouched("address")}
                  invalid={Boolean(fieldErrors.address)}
                  showInvalid={addressFieldShowValidation}
                  required
                />
                {renderFieldError("address")}
              </label>

              <DeliveryValidationPreview
                result={deliveryValidationResult}
                showErrors={addressFieldShowValidation}
              />

              <LiveDeliveryExperienceCard
                address={checkoutForm.address}
                zoneResult={realDeliveryZoneResult}
                validationResult={deliveryValidationResult}
                formatPrice={formatPrice}
                nearestIntervalLabel={nearestDeliveryIntervalLabel}
                liveAddressPreview={liveAddressPreview}
                compact
              />

              {showInlineMap ? (
                <CheckoutMapPanel
                  result={realDeliveryZoneResult}
                  formatPrice={formatPrice}
                  liveAddressPreview={liveAddressPreview}
                  isPanelOpen
                  showDeliveryContext={false}
                  onMapPointSelect={handleMapPointSelect}
                />
              ) : null}
            </section>

            <section className={checkoutSectionStyles.checkoutV2Block}>
              <h3 className={checkoutSectionStyles.checkoutV2BlockTitle}>
                Оплата
              </h3>
              <fieldset className={checkoutSectionStyles.checkoutPaymentOptions}>
                <legend className="sr-only">Способ оплаты</legend>
                {CHECKOUT_V2_PAYMENT_METHODS.map((method) => (
                  <label
                    key={method}
                    className={checkoutSectionStyles.checkoutPaymentOption}
                  >
                    <input
                      type="radio"
                      name="checkout-payment-method"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                    />
                    <span>{PAYMENT_METHOD_LABELS[method]}</span>
                  </label>
                ))}
              </fieldset>
            </section>

            <section className={checkoutSectionStyles.checkoutV2Block}>
              <h3 className={checkoutSectionStyles.checkoutV2BlockTitle}>
                Комментарий
              </h3>
              <CheckoutOptionToggle
                id="checkout-wants-card"
                label="Добавить открытку"
                checked={wantsCard}
                onChange={handleWantsCardChange}
              />

              <CheckoutCollapsible open={wantsCard}>
                <label className="checkout-field checkout-field-wide">
                  <span>Текст открытки</span>
                  <textarea
                    className={checkoutSectionStyles.checkoutCardTextarea}
                    value={checkoutForm.cardMessage}
                    onChange={(event) =>
                      handleCheckoutFieldChange(
                        "cardMessage",
                        event.target.value,
                      )
                    }
                    placeholder="Напишите пожелание для открытки"
                    aria-label="Текст открытки"
                    rows={5}
                  />
                </label>
              </CheckoutCollapsible>

              <label className="checkout-field checkout-field-wide">
                <span className="sr-only">Комментарий к заказу</span>
                <textarea
                  value={checkoutForm.comment}
                  onChange={(event) =>
                    handleCheckoutFieldChange("comment", event.target.value)
                  }
                  placeholder="Комментарий к заказу"
                  aria-label="Комментарий к заказу"
                  rows={4}
                />
              </label>
            </section>

            <section
              className={`${checkoutSectionStyles.checkoutV2Block} ${checkoutSectionStyles.checkoutV2Summary}`}
              aria-label="Итог"
            >
              <h3 className={checkoutSectionStyles.checkoutV2BlockTitle}>Итог</h3>
              <div className={checkoutSectionStyles.checkoutV2SummaryRows}>
                <div className={checkoutSectionStyles.checkoutV2SummaryRow}>
                  <span>{bouquetSummaryLabel}</span>
                  <strong>{formatPrice(checkoutTotalPrice)}</strong>
                </div>
                <div className={checkoutSectionStyles.checkoutV2SummaryRow}>
                  <span>Доставка</span>
                  <strong>{deliverySummaryPrice}</strong>
                </div>
                <div
                  className={`${checkoutSectionStyles.checkoutV2SummaryRow} ${checkoutSectionStyles.checkoutV2SummaryTotal}`}
                >
                  <span>Итого</span>
                  <strong>{formatPrice(checkoutGrandTotalPrice)}</strong>
                </div>
              </div>

              {deliveryPriceResult.status === "outside_delivery_area" ? (
                <p
                  className="checkout-delivery-alert checkout-delivery-alert-error"
                  role="alert"
                >
                  {deliveryUnavailableMessage}
                </p>
              ) : null}
              {deliveryPriceResult.status === "unknown" ? (
                <p className="checkout-delivery-alert" role="status">
                  {deliveryUnavailableMessage}
                </p>
              ) : null}
              {deliveryPriceResult.status === "error" ? (
                <p
                  className="checkout-delivery-alert checkout-delivery-alert-error"
                  role="alert"
                >
                  {deliveryUnavailableMessage}
                </p>
              ) : null}

              <div className="checkout-submit-row checkout-submit-row-compact">
                {cartItemCount > 0 && (
                  <button
                    type="button"
                    className="buy-button checkout-submit-button"
                    disabled={!canSubmitOrder}
                    aria-disabled={!canSubmitOrder}
                    aria-busy={checkoutSubmitInProgress}
                    onClick={handleSubmitClick}
                    onTouchEnd={handleSubmitTouchEnd}
                  >
                    {checkoutSubmitInProgress
                      ? "Отправка..."
                      : paymentMethod === "online"
                        ? "Оплатить"
                        : "Оформить заказ"}
                  </button>
                )}
              </div>
              {checkoutSubmitError ? (
                <span className="checkout-field-error" role="alert">
                  {checkoutSubmitError}
                </span>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}
