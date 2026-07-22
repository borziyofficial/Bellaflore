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
} from "@/components/checkout/checkoutGeocodingBridge";
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
import checkoutSectionStyles from "@/components/checkout/CheckoutSection.module.css";
import type { AddressSuggestion } from "@/components/addressIntelligence/addressIntelligenceTypes";
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
  buildAddressAccordionSummary,
  buildDeliveryAccordionSummary,
  buildPaymentAccordionSummary,
  buildRecipientAccordionSummary,
  getDeliveryDateLabel,
} from "@/components/checkout/checkoutAccordionSummaries";
import { getProductSizeRuLabel } from "@/lib/product/sizeLabels";
import { ProductSizePickerSheet } from "@/components/product/ProductSizePickerSheet";
import type {
  ProductSizeId,
  ProductSizeVariant,
} from "@/components/product/productExperienceTypes";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";

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
  sizeVariants: ProductSizeVariant[];
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
  onCheckoutSizeSelect: (sizeId: ProductSizeId) => void;
  embedded?: boolean;
};

type PaymentMethodUi = "online" | "cash" | "card";

const PAYMENT_METHOD_LABELS: Record<PaymentMethodUi, string> = {
  online: "СБП",
  cash: "Наличными при получении",
  card: "Картой при получении",
};

const CHECKOUT_V3_PAYMENT_METHODS: PaymentMethodUi[] = ["online", "cash"];

type CheckoutStepId = "recipient" | "delivery" | "address" | "payment";

type CheckoutGlassStepProps = {
  id: CheckoutStepId;
  title: string;
  summary: string | null;
  isOpen: boolean;
  onToggle: (stepId: CheckoutStepId) => void;
  children: ReactNode;
};

function CheckoutGlassStep({
  id,
  title,
  summary,
  isOpen,
  onToggle,
  children,
}: CheckoutGlassStepProps) {
  const triggerId = `checkout-step-${id}`;
  const panelId = `checkout-panel-${id}`;

  return (
    <section
      className={`${checkoutSectionStyles.checkoutGlassStep} ${isOpen ? checkoutSectionStyles.checkoutGlassStepOpen : ""}`}
      aria-labelledby={triggerId}
    >
      <button
        type="button"
        id={triggerId}
        className={checkoutSectionStyles.checkoutGlassStepTrigger}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => onToggle(id)}
      >
        <span className={checkoutSectionStyles.checkoutGlassStepCopy}>
          <span className={checkoutSectionStyles.checkoutGlassStepTitle}>
            {title}
          </span>
          {!isOpen && summary ? (
            <span className={checkoutSectionStyles.checkoutGlassStepSummary}>
              {summary}
            </span>
          ) : null}
        </span>
        <span
          className={checkoutSectionStyles.checkoutGlassStepIcon}
          aria-hidden="true"
        >
          {isOpen ? "×" : "+"}
        </span>
      </button>
      <div
        id={panelId}
        className={checkoutSectionStyles.checkoutGlassStepBody}
        hidden={!isOpen}
        role="region"
        aria-labelledby={triggerId}
      >
        <div className={checkoutSectionStyles.checkoutGlassStepBodyInner}>
          {children}
        </div>
      </div>
    </section>
  );
}

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
  onCheckoutSizeSelect,
  embedded = false,
}: CheckoutSectionProps) {
  // Reserved for the upcoming custom delivery date picker; not wired into
  // this section's UI yet, kept as props so the parent stays the source
  // of truth once that control ships.
  void todayDateValue;
  void handleCustomDeliveryDateChange;

  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<CheckoutValidatedField>>(
    () => new Set(),
  );
  const selectedSuggestionAddressRef = useRef<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodUi>("online");
  const [sizeSheetOpen, setSizeSheetOpen] = useState(false);
  const [openStep, setOpenStep] = useState<CheckoutStepId>("recipient");

  const toggleCheckoutStep = (stepId: CheckoutStepId) => {
    setOpenStep((current) => (current === stepId ? current : stepId));
  };

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
    }

    handleCheckoutFieldChange("address", nextAddress);
  };

  const handleAddressSuggestionSelect = (suggestion: AddressSuggestion) => {
    selectedSuggestionAddressRef.current = suggestion.fullAddress;
    handleCheckoutFieldChange("address", suggestion.label.trim());
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
      cacheGeocodingFromAddressSuggestion(confirmed);
    });
  };

  const handleAddressEdit = () => {
    if (!selectedSuggestionAddressRef.current) {
      return;
    }

    selectedSuggestionAddressRef.current = null;
  };

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
      <span className={checkoutSectionStyles.checkoutError} role="alert">
        {message}
      </span>
    );
  };

  useEffect(() => {
    if (deliveryDateMode !== "today") {
      selectDeliveryDatePreset("today");
    }
    // Pearl checkout defaults to same-day delivery.
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

    if (!checkoutForm.deliveryTime && availableDeliveryIntervals[0]) {
      handleCheckoutFieldChange("deliveryTime", availableDeliveryIntervals[0].label);
    }
  }, [availableDeliveryIntervals, checkoutForm.deliveryTime, handleCheckoutFieldChange]);

  const handleIntervalSelect = (intervalLabel: string) => {
    markFieldTouched("deliveryTime");
    handleCheckoutFieldChange("deliveryTime", intervalLabel);
  };

  const handleSubmitClick = (event: ReactMouseEvent<HTMLButtonElement>) => {
    setSubmitAttempted(true);

    if (!isFormReady || checkoutSubmitInProgress) {
      return;
    }

    handleConfirmOrderClick(event);
  };

  const handleSubmitTouchEnd = (event: ReactTouchEvent<HTMLButtonElement>) => {
    setSubmitAttempted(true);

    if (!isFormReady || checkoutSubmitInProgress) {
      return;
    }

    handleConfirmOrderTouchEnd(event);
  };

  const deliveryPriceLabel = formatDeliveryConfidencePriceLabel(
    deliveryConfidenceResult,
    formatPrice,
  );

  const deliverySummaryPrice =
    deliveryPriceLabel !== "—"
      ? deliveryPriceLabel
      : "Рассчитается после адреса";

  const bouquetSummaryLabel = "Букет";

  const primaryCartItem = cartBouquets[0] ?? null;
  const checkoutSizeLabel = primaryCartItem
    ? getProductSizeRuLabel(primaryCartItem.sizeId as ProductSizeId)
    : null;
  const checkoutSizePrice = primaryCartItem
    ? formatPrice(primaryCartItem.bouquet.priceRub)
    : null;
  const selectedPaymentLabel = PAYMENT_METHOD_LABELS[paymentMethod];
  const deliveryDateLabel = getDeliveryDateLabel(
    deliveryDateMode,
    checkoutForm.deliveryDate,
  );
  const recipientSummary = buildRecipientAccordionSummary({
    isOtherRecipient: false,
    customerName: checkoutForm.name,
    recipientName: "",
    anonymousDelivery: false,
  });
  const deliverySummary = buildDeliveryAccordionSummary({
    deliveryDateLabel,
    deliveryTime: checkoutForm.deliveryTime,
  });
  const addressSummary = buildAddressAccordionSummary({
    address: checkoutForm.address,
    zoneResult:
      realDeliveryZoneResult.status === "available"
        ? realDeliveryZoneResult
        : null,
  });
  const paymentSummary = buildPaymentAccordionSummary(selectedPaymentLabel);

  const rootClassName = embedded
    ? "checkout-section checkout-section-v3 checkout-section-embedded"
    : "checkout-section checkout-section-v3";

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
        <div className={`checkout-form-card ${checkoutSectionStyles.checkoutV3Card}`}>
          <div className={checkoutSectionStyles.checkoutV3Layout}>
            <div className={checkoutSectionStyles.checkoutV3Scroll}>
              <div className={checkoutSectionStyles.checkoutGlassFlow}>
                <CheckoutGlassStep
                  id="recipient"
                  title="Получатель"
                  summary={recipientSummary}
                  isOpen={openStep === "recipient"}
                  onToggle={toggleCheckoutStep}
                >
                  <label className={checkoutSectionStyles.checkoutField}>
                    <span>Имя</span>
                    <input
                      type="text"
                      value={checkoutForm.name}
                      onChange={(event) =>
                        handleCheckoutFieldChange("name", event.target.value)
                      }
                      onBlur={() => markFieldTouched("name")}
                      placeholder="Имя"
                      autoComplete="name"
                      aria-label="Имя"
                      aria-invalid={Boolean(fieldErrors.name)}
                      required
                    />
                    {renderFieldError("name")}
                  </label>
                  <label className={checkoutSectionStyles.checkoutField}>
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
                  {primaryCartItem && checkoutSizeLabel && checkoutSizePrice ? (
                    <button
                      type="button"
                      className={checkoutSectionStyles.checkoutFlatSelector}
                      onClick={() => setSizeSheetOpen(true)}
                      aria-haspopup="dialog"
                      aria-expanded={sizeSheetOpen}
                    >
                      <span>{checkoutSizeLabel}</span>
                      <strong>{checkoutSizePrice}</strong>
                      <span aria-hidden="true">▼</span>
                    </button>
                  ) : null}
                </CheckoutGlassStep>

                <CheckoutGlassStep
                  id="delivery"
                  title="Доставка"
                  summary={deliverySummary}
                  isOpen={openStep === "delivery"}
                  onToggle={toggleCheckoutStep}
                >
                  <div className={checkoutSectionStyles.checkoutFlatDelivery}>
                    <span>Сегодня</span>
                    {availableDeliveryIntervals.length > 0 ? (
                      <label className={checkoutSectionStyles.checkoutFlatSelectWrap}>
                        <span className="sr-only">Интервал доставки</span>
                        <select
                          value={checkoutForm.deliveryTime}
                          onChange={(event) =>
                            handleIntervalSelect(event.target.value)
                          }
                          aria-label="Интервал доставки"
                        >
                          {availableDeliveryIntervals.map((interval) => (
                            <option key={interval.label} value={interval.label}>
                              {interval.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <span className={checkoutSectionStyles.checkoutFlatMuted}>
                        Интервалов на сегодня нет
                      </span>
                    )}
                  </div>
                  {renderFieldError("deliveryTime")}
                </CheckoutGlassStep>

                <CheckoutGlassStep
                  id="address"
                  title="Адрес"
                  summary={addressSummary}
                  isOpen={openStep === "address"}
                  onToggle={toggleCheckoutStep}
                >
                  <label className={checkoutSectionStyles.checkoutField}>
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
                </CheckoutGlassStep>

                <CheckoutGlassStep
                  id="payment"
                  title="Оплата"
                  summary={paymentSummary}
                  isOpen={openStep === "payment"}
                  onToggle={toggleCheckoutStep}
                >
                  <label className={checkoutSectionStyles.checkoutFlatSelectWrap}>
                    <span className="sr-only">Способ оплаты</span>
                    <select
                      value={paymentMethod}
                      onChange={(event) =>
                        setPaymentMethod(event.target.value as PaymentMethodUi)
                      }
                      aria-label="Способ оплаты"
                    >
                      {CHECKOUT_V3_PAYMENT_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {PAYMENT_METHOD_LABELS[method]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <span className={checkoutSectionStyles.checkoutFlatMuted}>
                    {selectedPaymentLabel}
                  </span>
                  <label className={checkoutSectionStyles.checkoutField}>
                    <span>Комментарий</span>
                    <textarea
                      value={checkoutForm.comment}
                      onChange={(event) =>
                        handleCheckoutFieldChange("comment", event.target.value)
                      }
                      placeholder="Необязательно"
                      aria-label="Комментарий к заказу"
                      rows={3}
                    />
                  </label>
                </CheckoutGlassStep>
              </div>
            </div>

            <div
              className={checkoutSectionStyles.checkoutV3StickyFooter}
              aria-label="Итог"
            >
              <h3 className={checkoutSectionStyles.checkoutV3BlockTitle}>Итог</h3>
              <div className={checkoutSectionStyles.checkoutV3SummaryRows}>
                <div className={checkoutSectionStyles.checkoutV3SummaryRow}>
                  <span>{bouquetSummaryLabel}</span>
                  <strong>{formatPrice(checkoutTotalPrice)}</strong>
                </div>
                <div className={checkoutSectionStyles.checkoutV3SummaryRow}>
                  <span>Доставка</span>
                  <strong>{deliverySummaryPrice}</strong>
                </div>
                <div
                  className={`${checkoutSectionStyles.checkoutV3SummaryRow} ${checkoutSectionStyles.checkoutV3SummaryTotal}`}
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

              <div className={checkoutSectionStyles.checkoutSubmitRow}>
                {cartItemCount > 0 && (
                  <button
                    type="button"
                    className={checkoutSectionStyles.checkoutSubmitButton}
                    disabled={!canSubmitOrder}
                    aria-disabled={!canSubmitOrder}
                    aria-busy={checkoutSubmitInProgress}
                    onClick={handleSubmitClick}
                    onTouchEnd={handleSubmitTouchEnd}
                  >
                    {checkoutSubmitInProgress
                      ? "Отправка..."
                      : "Оформить заказ"}
                  </button>
                )}
              </div>
              {checkoutSubmitError ? (
                <span className={checkoutSectionStyles.checkoutError} role="alert">
                  {checkoutSubmitError}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {primaryCartItem ? (
        <ProductSizePickerSheet
          open={sizeSheetOpen}
          title="Размер"
          productName={primaryCartItem.bouquet.title}
          variants={primaryCartItem.sizeVariants}
          selectedSizeId={primaryCartItem.sizeId as ProductSizeId}
          formatPrice={formatPrice}
          visibleSizeIds={["S", "M", "L", "XL"]}
          onSelect={onCheckoutSizeSelect}
          onClose={() => setSizeSheetOpen(false)}
        />
      ) : null}
    </section>
  );
}
