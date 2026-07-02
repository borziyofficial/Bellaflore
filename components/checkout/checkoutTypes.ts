// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for checkout.
//
// Назначение (RU): Определения типов для checkout.
// ==================================================
export type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
  deliveryDate: string;
  deliveryTime: string;
  cardMessage: string;
  comment: string;
};

export type DeliveryDatePreset = "today" | "tomorrow" | "custom";

export type CheckoutValidatedField =
  | "name"
  | "phone"
  | "address"
  | "deliveryDate"
  | "deliveryTime";

export type CheckoutFieldErrors = Partial<
  Record<CheckoutValidatedField, string>
>;

export const checkoutRequiredFields: {
  field: CheckoutValidatedField;
  message: string;
}[] = [
  { field: "name", message: "Укажите имя заказчика" },
  { field: "phone", message: "Укажите телефон" },
  { field: "address", message: "Укажите адрес доставки" },
  { field: "deliveryDate", message: "Выберите дату доставки" },
  { field: "deliveryTime", message: "Укажите время доставки" },
];

export type CheckoutOrderPayloadItem = {
  bouquetId: string;
  title: string;
  sizeId: string;
  sizeLabel: string;
  priceRub: number;
  quantity: number;
};

export type CheckoutOrderPayload = {
  items: CheckoutOrderPayloadItem[];
  customerName: string;
  phone: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryInterval: string;
  comment: string;
  deliveryZoneId?: string;
  deliveryZoneLabel?: string;
  deliveryZoneTitle?: string;
  deliveryZonePriceRub?: number;
  deliveryZoneDistanceKm?: number;
  deliveryZoneRoadDistanceKm?: number;
  deliveryZoneRoadDurationMinutes?: number;
  deliveryZoneStatus?: string;
  deliveryZoneDetectionMode?: string;
  deliveryStatus?: string;
  addressLatitude?: number;
  addressLongitude?: number;
  validationStatus?: string;
  validationWarnings?: string[];
  validationVersion?: string;
  validatedAt?: string;
};
