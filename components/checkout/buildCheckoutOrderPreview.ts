// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Оформление заказа
//
// Purpose (EN): Checkout form validation, payload building, and order preview.
//
// Назначение (RU): Валидация формы, сбор payload и превью заказа при оформлении.
// ==================================================
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


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type CheckoutOrderPreview = {
  items: Array<{
    id: string;
    title: string;
    sizeId: string;
    sizeLabel: string;
    priceRub: number;
    quantity: number;
  }>;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  deliveryDateLabel: string;
  deliveryInterval: string;
  comment: string;
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function getDeliveryDateLabel(
  checkoutForm: CheckoutForm,
  deliveryDateMode: DeliveryDatePreset,
) {
  if (deliveryDateMode === "today") {
    return "Сегодня";
  }

  if (deliveryDateMode === "tomorrow") {
    return "Завтра";
  }

  return checkoutForm.deliveryDate.trim();
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildCheckoutOrderPreview(
  checkoutForm: CheckoutForm,
  cartBouquets: CheckoutPreviewCartItem[],
  deliveryDateMode: DeliveryDatePreset,
): CheckoutOrderPreview {
  return {
    items: cartBouquets.map((cartItem) => ({
      id: cartItem.bouquet.id,
      title: cartItem.bouquet.title,
      sizeId: cartItem.sizeId,
      sizeLabel: cartItem.sizeLabel,
      priceRub: cartItem.bouquet.priceRub,
      quantity: cartItem.quantity,
    })),
    customerName: checkoutForm.name.trim(),
    phone: checkoutForm.phone.trim(),
    deliveryAddress: checkoutForm.address.trim(),
    deliveryDateLabel: getDeliveryDateLabel(checkoutForm, deliveryDateMode),
    deliveryInterval: checkoutForm.deliveryTime.trim(),
    comment: checkoutForm.comment.trim(),
  };
}

export function previewDisplayValue(value: string) {
  return value || "—";
}
