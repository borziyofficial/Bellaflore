// ==================================================
// SECTION: DELIVERY
// РАЗДЕЛ: Доставка
//
// Purpose (EN):
// Address validation feedback during checkout
//
// Назначение (RU):
// Обратная связь по валидации адреса при оформлении
// ==================================================
"use client";

import type { DeliveryValidationResult } from "@/components/deliveryValidation/deliveryValidationTypes";

const CHECKOUT_VALIDATION_MESSAGE_OVERRIDES: Record<string, string> = {
  "Geocoder failed": "Не удалось проверить адрес. Попробуйте выбрать подсказку из списка.",
  "Missing house number": "Укажите номер дома в адресе доставки.",
  "Multiple address matches": "Уточните адрес — найдено несколько совпадений.",
  "Unsupported area": "Доставка в этот район недоступна.",
  "Address does not match geocoder coordinates":
    "Адрес не совпадает с координатами. Выберите подсказку из списка.",
  "Zone not detected": "Не удалось определить зону доставки.",
  "Delivery unavailable": "Доставка по этому адресу недоступна.",
  "Road distance unavailable — using approximate distance":
    "Точное расстояние временно недоступно — используем приблизительный расчёт.",
  "Address validation issue": "Не удалось проверить адрес доставки.",
  "Address verified": "Адрес подтверждён.",
  "Address verified for delivery.": "Адрес подтверждён.",
  "Address requires clarification": "Уточните адрес доставки.",
};

function localizeCheckoutValidationMessage(message: string): string {
  return CHECKOUT_VALIDATION_MESSAGE_OVERRIDES[message] ?? message;
}

function isCheckoutValidationIdle(result: DeliveryValidationResult): boolean {
  if (result.status === "VALID") {
    return true;
  }

  if (result.issueCodes.length === 0) {
    return true;
  }

  return result.issueCodes.every(
    (code) => code === "address_empty" || code === "geocoding_pending",
  );
}

function getCheckoutValidationHint(
  result: DeliveryValidationResult,
): string | null {
  if (result.status === "OUTSIDE_DELIVERY_AREA") {
    return "Доставка по этому адресу недоступна.";
  }

  if (result.validationErrors.length > 0) {
    return localizeCheckoutValidationMessage(result.validationErrors[0] ?? "");
  }

  if (result.status === "WARNING" && result.validationWarnings.length > 0) {
    return localizeCheckoutValidationMessage(result.validationWarnings[0] ?? "");
  }

  if (result.status === "ERROR") {
    return localizeCheckoutValidationMessage(
      result.detail || result.headline || "Не удалось подтвердить адрес доставки.",
    );
  }

  if (result.status === "WARNING") {
    return localizeCheckoutValidationMessage(
      result.detail || result.headline || "Уточните адрес доставки.",
    );
  }

  return null;
}

type DeliveryValidationPreviewProps = {
  result: DeliveryValidationResult;
  showErrors?: boolean;
};

export function DeliveryValidationPreview({
  result,
  showErrors = true,
}: DeliveryValidationPreviewProps) {
  if (!showErrors || isCheckoutValidationIdle(result)) {
    return null;
  }

  const hint = getCheckoutValidationHint(result);

  if (!hint) {
    return null;
  }

  return (
    <p
      className={`delivery-validation-checkout-hint delivery-validation-checkout-hint-${result.status.toLowerCase().replace(/_/g, "-")}`}
      role="status"
    >
      {hint}
    </p>
  );
}
