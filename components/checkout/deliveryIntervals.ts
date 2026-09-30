// ==================================================
// SECTION: CHECKOUT
// РАЗДЕЛ: Оформление заказа
//
// Purpose (EN): Checkout form validation, payload building, and order preview.
//
// Назначение (RU): Валидация формы, сбор payload и превью заказа при оформлении.
// ==================================================
export type DeliveryInterval = {
  label: string;
  startMinutes: number;
  endMinutes: number;
};

export const deliveryIntervals: DeliveryInterval[] = [
  { label: "09:00–12:00", startMinutes: 9 * 60, endMinutes: 12 * 60 },
  { label: "12:00–15:00", startMinutes: 12 * 60, endMinutes: 15 * 60 },
  { label: "15:00–18:00", startMinutes: 15 * 60, endMinutes: 18 * 60 },
  { label: "18:00–21:00", startMinutes: 18 * 60, endMinutes: 21 * 60 },
  { label: "21:00–23:00", startMinutes: 21 * 60, endMinutes: 23 * 60 },
];


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
export function getMoscowDateValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getMoscowTimeMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return Number(values.hour ?? 0) * 60 + Number(values.minute ?? 0);
}

export function getMoscowDateOffsetValue(date: Date, days: number): string {
  const baseDate = getMoscowDateValue(date);
  const shifted = new Date(`${baseDate}T00:00:00Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getAvailableDeliveryIntervals(
  deliveryDate: string,
  now: Date,
) {
  if (!deliveryDate) {
    return [];
  }

  const todayDateValue = getMoscowDateValue(now);

  if (deliveryDate !== todayDateValue) {
    return deliveryIntervals;
  }

  const currentTimeMinutes = getMoscowTimeMinutes(now);

  return deliveryIntervals.filter(
    (interval) => interval.endMinutes > currentTimeMinutes,
  );
}
