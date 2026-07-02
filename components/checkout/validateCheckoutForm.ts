// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Оформление заказа
//
// Purpose (EN): Checkout form validation, payload building, and order preview.
//
// Назначение (RU): Валидация формы, сбор payload и превью заказа при оформлении.
// ==================================================
import { getAvailableDeliveryIntervals } from "@/components/checkout/deliveryIntervals";
import {
  checkoutRequiredFields,
  type CheckoutFieldErrors,
  type CheckoutForm,
} from "@/components/checkout/checkoutTypes";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getCheckoutFieldErrors(
  checkoutForm: CheckoutForm,
  now = new Date(),
): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};

  for (const { field, message } of checkoutRequiredFields) {
    if (!checkoutForm[field].trim()) {
      errors[field] = message;
    }
  }

  if (checkoutForm.deliveryDate.trim() && checkoutForm.deliveryTime.trim()) {
    const availableIntervals = getAvailableDeliveryIntervals(
      checkoutForm.deliveryDate.trim(),
      now,
    );
    const deliveryTimeAvailable = availableIntervals.some(
      (interval) => interval.label === checkoutForm.deliveryTime.trim(),
    );

    if (!deliveryTimeAvailable) {
      errors.deliveryTime = "Выберите доступный интервал доставки";
    }
  }

  return errors;
}

export function isCheckoutFormReady(
  checkoutForm: CheckoutForm,
  hasCartItems: boolean,
  now = new Date(),
) {
  if (!hasCartItems) {
    return false;
  }

  return Object.keys(getCheckoutFieldErrors(checkoutForm, now)).length === 0;
}

export function validateCheckoutForm(
  checkoutForm: CheckoutForm,
  now = new Date(),
) {
  return Object.values(getCheckoutFieldErrors(checkoutForm, now));
}
