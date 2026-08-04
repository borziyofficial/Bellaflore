// ==================================================
// SECTION: ORDERS
// РАЗДЕЛ: Заказы
//
// Purpose (EN):
// Order status registry, labels, and pipeline definitions.
//
// Назначение (RU):
// Реестр статусов заказа, подписи и определения pipeline.
// ==================================================
export type OrderStatusId =
  | "CREATED"
  | "CONFIRMED"
  | "PREPARING"
  | "COURIER_ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN):
// Exported type and interface definitions.
//
// Назначение (RU):
// Экспортируемые типы и интерфейсы.
// ==================================================
export type OrderStatusDefinition = {
  id: OrderStatusId;
  titleRu: string;
  englishId: OrderStatusId;
  colorToken: string;
  icon: string;
  sortOrder: number;
};

export const ORDER_STATUS_DEFINITIONS: OrderStatusDefinition[] = [
  {
    id: "CREATED",
    titleRu: "Заказ создан",
    englishId: "CREATED",
    colorToken: "order-status-created",
    icon: "sparkles",
    sortOrder: 1,
  },
  {
    id: "CONFIRMED",
    titleRu: "Заказ подтверждён",
    englishId: "CONFIRMED",
    colorToken: "order-status-confirmed",
    icon: "check-circle",
    sortOrder: 2,
  },
  {
    id: "PREPARING",
    titleRu: "Букет собирается",
    englishId: "PREPARING",
    colorToken: "order-status-preparing",
    icon: "bouquet",
    sortOrder: 3,
  },
  {
    id: "COURIER_ASSIGNED",
    titleRu: "Курьер назначен",
    englishId: "COURIER_ASSIGNED",
    colorToken: "order-status-courier-assigned",
    icon: "courier",
    sortOrder: 4,
  },
  {
    id: "OUT_FOR_DELIVERY",
    titleRu: "Курьер в пути",
    englishId: "OUT_FOR_DELIVERY",
    colorToken: "order-status-out-for-delivery",
    icon: "delivery",
    sortOrder: 5,
  },
  {
    id: "DELIVERED",
    titleRu: "Доставлен",
    englishId: "DELIVERED",
    colorToken: "order-status-delivered",
    icon: "delivered",
    sortOrder: 6,
  },
  {
    id: "CANCELLED",
    titleRu: "Отменён",
    englishId: "CANCELLED",
    colorToken: "order-status-cancelled",
    icon: "cancelled",
    sortOrder: 99,
  },
];


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN):
// Private helper functions used within this module.
//
// Назначение (RU):
// Приватные вспомогательные функции модуля.
// ==================================================
const ORDER_STATUS_BY_ID = ORDER_STATUS_DEFINITIONS.reduce<
  Record<OrderStatusId, OrderStatusDefinition>
>(
  (statusMap, status) => {
    statusMap[status.id] = status;
    return statusMap;
  },
  {} as Record<OrderStatusId, OrderStatusDefinition>,
);

const LEGACY_ORDER_STATUS_ALIASES: Record<string, OrderStatusId> = {
  NEW: "CREATED",
};

function normalizeOrderStatusId(statusId: string): OrderStatusId | null {
  const normalizedStatusId = statusId.trim().toUpperCase();

  if (normalizedStatusId in ORDER_STATUS_BY_ID) {
    return normalizedStatusId as OrderStatusId;
  }

  return LEGACY_ORDER_STATUS_ALIASES[normalizedStatusId] ?? null;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export function getOrderStatus(
  statusId: string,
): OrderStatusDefinition | null {
  const normalizedStatusId = normalizeOrderStatusId(statusId);

  if (!normalizedStatusId) {
    return null;
  }

  return ORDER_STATUS_BY_ID[normalizedStatusId];
}

export function getOrderStatusLabel(statusId: string): string {
  return getOrderStatus(statusId)?.titleRu ?? "Неизвестный статус";
}

export function getOrderStatusColor(statusId: string): string {
  return getOrderStatus(statusId)?.colorToken ?? "order-status-unknown";
}

export function getOrderStatusesInSortOrder(): OrderStatusDefinition[] {
  return [...ORDER_STATUS_DEFINITIONS].sort(
    (firstStatus, secondStatus) =>
      firstStatus.sortOrder - secondStatus.sortOrder,
  );
}

export const KANBAN_STATUS_SEQUENCE: OrderStatusId[] = [
  "CREATED",
  "CONFIRMED",
  "PREPARING",
  "COURIER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export function getPreviousKanbanStatus(
  statusId: string,
): OrderStatusId | null {
  const normalizedStatusId = getOrderStatus(statusId)?.id;

  if (!normalizedStatusId || normalizedStatusId === "CANCELLED") {
    return null;
  }

  const currentIndex = KANBAN_STATUS_SEQUENCE.indexOf(normalizedStatusId);

  if (currentIndex <= 0) {
    return null;
  }

  return KANBAN_STATUS_SEQUENCE[currentIndex - 1] ?? null;
}

export function getNextKanbanStatus(statusId: string): OrderStatusId | null {
  const normalizedStatusId = getOrderStatus(statusId)?.id;

  if (!normalizedStatusId || normalizedStatusId === "CANCELLED") {
    return null;
  }

  const currentIndex = KANBAN_STATUS_SEQUENCE.indexOf(normalizedStatusId);

  if (
    currentIndex === -1 ||
    currentIndex >= KANBAN_STATUS_SEQUENCE.length - 1
  ) {
    return null;
  }

  return KANBAN_STATUS_SEQUENCE[currentIndex + 1] ?? null;
}

export function canCancelFromKanban(statusId: string): boolean {
  return getOrderStatus(statusId)?.id !== "CANCELLED";
}

export function isKanbanDraggable(statusId: string): boolean {
  const normalizedStatusId = getOrderStatus(statusId)?.id;

  return Boolean(normalizedStatusId && normalizedStatusId !== "CANCELLED");
}

// ==================================================
// SECTION: CUSTOMER STATUS
// РАЗДЕЛ: Статусы заказа для покупателя («Мой заказ»)
//
// Purpose (EN):
// Maps the raw server order status (7 internal values, incl. legacy
// "NEW") down to exactly the 6 customer-facing Russian statuses used
// in the "Мой заказ" section. Additive only — does not change the
// admin/kanban registry above.
//
// Назначение (RU):
// Сопоставляет статус заказа с сервера с 6 статусами для покупателя
// в разделе «Мой заказ». Не изменяет реестр admin/kanban выше.
// ==================================================
export type CustomerOrderStatusId =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "COURIER"
  | "DELIVERED"
  | "CANCELLED";

export type CustomerOrderStatusDefinition = {
  id: CustomerOrderStatusId;
  label: string;
  colorToken: string;
};

const CUSTOMER_ORDER_STATUS_DEFINITIONS: Record<
  CustomerOrderStatusId,
  CustomerOrderStatusDefinition
> = {
  NEW: { id: "NEW", label: "Новый", colorToken: "order-status-created" },
  CONFIRMED: {
    id: "CONFIRMED",
    label: "Подтверждён",
    colorToken: "order-status-confirmed",
  },
  PREPARING: {
    id: "PREPARING",
    label: "Собирается",
    colorToken: "order-status-preparing",
  },
  COURIER: {
    id: "COURIER",
    label: "Передан курьеру",
    colorToken: "order-status-courier-assigned",
  },
  DELIVERED: {
    id: "DELIVERED",
    label: "Доставлен",
    colorToken: "order-status-delivered",
  },
  CANCELLED: {
    id: "CANCELLED",
    label: "Отменён",
    colorToken: "order-status-cancelled",
  },
};

export function getCustomerFacingOrderStatus(
  rawStatus: string,
): CustomerOrderStatusDefinition {
  const normalized = rawStatus.trim().toUpperCase();

  switch (normalized) {
    case "NEW":
    case "CREATED":
      return CUSTOMER_ORDER_STATUS_DEFINITIONS.NEW;
    case "CONFIRMED":
      return CUSTOMER_ORDER_STATUS_DEFINITIONS.CONFIRMED;
    case "PREPARING":
      return CUSTOMER_ORDER_STATUS_DEFINITIONS.PREPARING;
    case "COURIER_ASSIGNED":
    case "OUT_FOR_DELIVERY":
      return CUSTOMER_ORDER_STATUS_DEFINITIONS.COURIER;
    case "DELIVERED":
      return CUSTOMER_ORDER_STATUS_DEFINITIONS.DELIVERED;
    case "CANCELLED":
      return CUSTOMER_ORDER_STATUS_DEFINITIONS.CANCELLED;
    default:
      return CUSTOMER_ORDER_STATUS_DEFINITIONS.NEW;
  }
}

export function getCustomerFacingOrderStatusLabel(rawStatus: string): string {
  return getCustomerFacingOrderStatus(rawStatus).label;
}

export function isValidKanbanDragTarget(
  fromStatusId: string,
  toStatusId: OrderStatusId,
): boolean {
  const normalizedFromStatusId = getOrderStatus(fromStatusId)?.id;

  if (!normalizedFromStatusId || normalizedFromStatusId === "CANCELLED") {
    return false;
  }

  if (toStatusId === "CANCELLED") {
    return false;
  }

  if (normalizedFromStatusId === toStatusId) {
    return false;
  }

  const previousStatus = getPreviousKanbanStatus(normalizedFromStatusId);
  const nextStatus = getNextKanbanStatus(normalizedFromStatusId);

  return toStatusId === previousStatus || toStatusId === nextStatus;
}
