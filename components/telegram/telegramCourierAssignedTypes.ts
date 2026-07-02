// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for telegram.
//
// Назначение (RU): Определения типов для telegram.
// ==================================================
export type TelegramCourierAssignedInput = {
  orderId: string;
  bouquetTitle: string;
  priceRub: number;
  customerName: string;
  customerPhone: string;
  courierName: string;
  courierPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryInterval: string;
};

export const TELEGRAM_COURIER_ASSIGNED_STATUS = "Курьер назначен";
