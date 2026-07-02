// ==================================================
// SECTION: APP LIB
// РАЗДЕЛ: Библиотека приложения
//
// Purpose (EN): Shared server-side utilities used by app routes and pages.
//
// Назначение (RU): Общие серверные утилиты для маршрутов и страниц приложения.
// ==================================================
// ==================================================
// SECTION: Delivery Tracking Types & Mock Data
// РАЗДЕЛ: Отслеживание доставки — типы и mock-данные
//
// Purpose (EN): Delivery status pipeline types, tracking payload shape, and development mock courier data.
//
// Назначение (RU): Типы pipeline статусов доставки, форма tracking-payload и mock-данные курьера для разработки.
// ==================================================

export type DeliveryStatus =
  | "orderCreated"
  | "bouquetPreparing"
  | "bouquetReady"
  | "courierAssigned"
  | "courierOnTheWay"
  | "courierNearby"
  | "delivered";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type DeliveryTrackingData = {
  orderId: string;
  status: DeliveryStatus;
  courier: {
    name: string;
    phone: string;
  };
  vehicle: {
    model: string;
    plate: string;
  };
  estimatedArrivalMinutes: number;
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export const mockDeliveryTracking: DeliveryTrackingData = {
  orderId: "BF-0001",
  status: "courierOnTheWay",
  courier: {
    name: "Ману́чар",
    phone: "+7 999 000 00 00",
  },
  vehicle: {
    model: "Ford Focus",
    plate: "Р312КН40",
  },
  estimatedArrivalMinutes: 15,
};

export function getDeliveryStatusText(status: DeliveryStatus): string {
  switch (status) {
    case "orderCreated":
      return "Заказ создан";
    case "bouquetPreparing":
      return "Ваш букет собирается";
    case "bouquetReady":
      return "Букет готов";
    case "courierAssigned":
      return "Курьер назначен";
    case "courierOnTheWay":
      return "Курьер выехал";
    case "courierNearby":
      return "Курьер скоро будет у вас";
    case "delivered":
      return "Заказ доставлен";
    default:
      return "Статус заказа неизвестен";
  }
}

export function getEstimatedArrivalText(minutes: number): string {
  if (minutes <= 5) return "Курьер почти у вас";
  return `Ещё ${minutes} минут`;
}

