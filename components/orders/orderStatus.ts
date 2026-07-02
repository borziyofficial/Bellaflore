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
