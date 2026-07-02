// ==================================================
// SECTION: APP LIB
// РАЗДЕЛ: Библиотека приложения
//
// Purpose (EN): Shared server-side utilities used by app routes and pages.
//
// Назначение (RU): Общие серверные утилиты для маршрутов и страниц приложения.
// ==================================================
// ==================================================
// SECTION: CRM Domain Types & Helpers
// РАЗДЕЛ: CRM-домен — типы и хелперы
//
// Purpose (EN): CRM order lifecycle types, customer/address models, and status label helpers.
//
// Назначение (RU): Типы жизненного цикла CRM-заказа, модели клиента/адреса и хелперы меток статусов.
// ==================================================

export type CrmOrderStatus =
  | "newOrder"
  | "accepted"
  | "bouquetPreparing"
  | "bouquetReady"
  | "assignedToCourier"
  | "courierOnTheWay"
  | "delivered"
  | "completed";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type CrmPaymentStatus = "paid" | "unpaid" | "partiallyPaid";

export type CrmCourierAvailability = "available" | "busy" | "offline";

export type CrmDeliveryEvent =
  | "courierOnTheWay"
  | "courierNearby"
  | "orderDelivered";

export type CrmCustomer = {
  name: string;
  phone: string;
};

export type CrmAddress = {
  fullAddress: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
  comment?: string;
  directionKey?: string;
};

export type CrmBouquet = {
  id: string;
  name: string;
  quantity: number;
};

export type CrmPayment = {
  status: CrmPaymentStatus;
  totalAmount: number;
  paidAmount: number;
  currency: "RUB";
  providerPaymentId?: string;
};

export type CrmOrder = {
  id: string;
  createdAt: string;
  customer: CrmCustomer;
  address: CrmAddress;
  bouquet: CrmBouquet;
  payment: CrmPayment;
  status: CrmOrderStatus;
  comment?: string;
  assignedCourierId?: string;
};

export type CrmCourier = {
  id: string;
  name: string;
  phone: string;
  availability: CrmCourierAvailability;
  activeOrderIds: string[];
  directionKeys: string[];
};

export type CrmRouteStop = {
  orderId: string;
  address: CrmAddress;
  position: number;
};

export type CrmRoutePlan = {
  courierId: string;
  orderIds: string[];
  directionKey?: string;
  stops: CrmRouteStop[];
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export const crmOrderStatusLabels: Record<CrmOrderStatus, string> = {
  newOrder: "Новый заказ",
  accepted: "Принят",
  bouquetPreparing: "Букет собирается",
  bouquetReady: "Букет готов",
  assignedToCourier: "Передан курьеру",
  courierOnTheWay: "Курьер в пути",
  delivered: "Доставлен",
  completed: "Завершён",
};

export const crmPaymentStatusLabels: Record<CrmPaymentStatus, string> = {
  paid: "Оплачено",
  unpaid: "Не оплачено",
  partiallyPaid: "Частично оплачено",
};

export const mockCrmOrders: CrmOrder[] = [
  {
    id: "BF-0001",
    createdAt: "2026-06-13T10:00:00.000Z",
    customer: {
      name: "Анна",
      phone: "+7 999 111 22 33",
    },
    address: {
      fullAddress: "Москва, Тверская улица, 7",
      apartment: "15",
      directionKey: "center",
    },
    bouquet: {
      id: "pink-elegance",
      name: "Pink Elegance",
      quantity: 1,
    },
    payment: {
      status: "paid",
      totalAmount: 12000,
      paidAmount: 12000,
      currency: "RUB",
    },
    status: "bouquetReady",
    comment: "Позвонить за 10 минут до приезда",
  },
  {
    id: "BF-0002",
    createdAt: "2026-06-13T10:15:00.000Z",
    customer: {
      name: "Мария",
      phone: "+7 999 444 55 66",
    },
    address: {
      fullAddress: "Москва, Кутузовский проспект, 21",
      directionKey: "west",
    },
    bouquet: {
      id: "white-pearl",
      name: "White Pearl",
      quantity: 1,
    },
    payment: {
      status: "unpaid",
      totalAmount: 18000,
      paidAmount: 0,
      currency: "RUB",
    },
    status: "newOrder",
  },
];

export const mockCrmCouriers: CrmCourier[] = [
  {
    id: "courier-001",
    name: "Ману́чар",
    phone: "+7 999 000 00 00",
    availability: "available",
    activeOrderIds: [],
    directionKeys: ["center", "west"],
  },
  {
    id: "courier-002",
    name: "Алексей",
    phone: "+7 999 222 33 44",
    availability: "busy",
    activeOrderIds: ["BF-0003"],
    directionKeys: ["north"],
  },
];

export function getCrmOrderStatusText(status: CrmOrderStatus): string {
  return crmOrderStatusLabels[status];
}

export function getCrmPaymentStatusText(status: CrmPaymentStatus): string {
  return crmPaymentStatusLabels[status];
}

export function getPaymentStatusFromAmounts(
  totalAmount: number,
  paidAmount: number,
): CrmPaymentStatus {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount < totalAmount) return "partiallyPaid";
  return "paid";
}

export function isOrderWaitingForPayment(order: CrmOrder): boolean {
  return order.payment.status !== "paid";
}

export function canSendOrderToAssembly(order: CrmOrder): boolean {
  return order.payment.status === "paid" && order.status === "accepted";
}

export function getAvailableCouriers(couriers: CrmCourier[]): CrmCourier[] {
  return couriers.filter((courier) => courier.availability === "available");
}

export function getCourierCandidatesForOrders(
  couriers: CrmCourier[],
  orders: CrmOrder[],
): CrmCourier[] {
  const directionKeys = new Set(
    orders
      .map((order) => order.address.directionKey)
      .filter((directionKey): directionKey is string => Boolean(directionKey)),
  );

  return getAvailableCouriers(couriers).filter((courier) => {
    if (directionKeys.size === 0) return true;
    return courier.directionKeys.some((directionKey) =>
      directionKeys.has(directionKey),
    );
  });
}

export function createRoutePlan(
  courierId: string,
  orders: CrmOrder[],
): CrmRoutePlan {
  const directionKey = orders.find((order) => order.address.directionKey)
    ?.address.directionKey;

  return {
    courierId,
    orderIds: orders.map((order) => order.id),
    directionKey,
    stops: orders.map((order, index) => ({
      orderId: order.id,
      address: order.address,
      position: index + 1,
    })),
  };
}

export function assignCourierToOrder(
  order: CrmOrder,
  courier: CrmCourier,
): CrmOrder {
  return {
    ...order,
    assignedCourierId: courier.id,
    status: "assignedToCourier",
  };
}
