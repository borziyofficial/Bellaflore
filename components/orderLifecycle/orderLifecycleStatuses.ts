// ==================================================
// SECTION: ORDER LIFECYCLE
// РАЗДЕЛ: Жизненный цикл заказа
//
// Purpose (EN): Order status transitions, storage, and lifecycle messaging.
//
// Назначение (RU): Переходы статусов, хранилище и сообщения жизненного цикла заказа.
// ==================================================
import type { OrderLifecycleStatus } from "@/components/orderLifecycle/orderLifecycleTypes";

export type OrderLifecycleStatusDefinition = {
  id: OrderLifecycleStatus;
  titleRu: string;
  sortOrder: number;
  isTerminal: boolean;
};

export const ORDER_LIFECYCLE_STATUSES: OrderLifecycleStatus[] = [
  "created",
  "accepted",
  "preparing",
  "ready_for_courier",
  "assigned_to_courier",
  "courier_on_the_way",
  "delivered",
  "cancelled",
  "failed",
];

export const ORDER_LIFECYCLE_STATUS_DEFINITIONS: OrderLifecycleStatusDefinition[] =
  [
    { id: "created", titleRu: "Создан", sortOrder: 1, isTerminal: false },
    { id: "accepted", titleRu: "Принят", sortOrder: 2, isTerminal: false },
    { id: "preparing", titleRu: "Сборка", sortOrder: 3, isTerminal: false },
    {
      id: "ready_for_courier",
      titleRu: "Готов к передаче курьеру",
      sortOrder: 4,
      isTerminal: false,
    },
    {
      id: "assigned_to_courier",
      titleRu: "Курьер назначен",
      sortOrder: 5,
      isTerminal: false,
    },
    {
      id: "courier_on_the_way",
      titleRu: "Курьер в пути",
      sortOrder: 6,
      isTerminal: false,
    },
    { id: "delivered", titleRu: "Доставлен", sortOrder: 7, isTerminal: true },
    { id: "cancelled", titleRu: "Отменён", sortOrder: 8, isTerminal: true },
    { id: "failed", titleRu: "Ошибка", sortOrder: 9, isTerminal: true },
  ];


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const TERMINAL_LIFECYCLE_STATUSES = new Set<OrderLifecycleStatus>([
  "delivered",
  "cancelled",
  "failed",
]);

const LIFECYCLE_STATUS_TRANSITIONS: Record<
  OrderLifecycleStatus,
  OrderLifecycleStatus[]
> = {
  created: ["accepted", "cancelled", "failed"],
  accepted: ["preparing", "cancelled", "failed"],
  preparing: ["ready_for_courier", "cancelled", "failed"],
  ready_for_courier: ["assigned_to_courier", "cancelled", "failed"],
  assigned_to_courier: [
    "courier_on_the_way",
    "ready_for_courier",
    "cancelled",
    "failed",
  ],
  courier_on_the_way: ["delivered", "cancelled", "failed"],
  delivered: [],
  cancelled: [],
  failed: [],
};

const STATUS_DEFINITION_BY_ID = ORDER_LIFECYCLE_STATUS_DEFINITIONS.reduce<
  Record<OrderLifecycleStatus, OrderLifecycleStatusDefinition>
>(
  (statusMap, status) => {
    statusMap[status.id] = status;
    return statusMap;
  },
  {} as Record<OrderLifecycleStatus, OrderLifecycleStatusDefinition>,
);


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function isOrderLifecycleStatus(
  value: string,
): value is OrderLifecycleStatus {
  return ORDER_LIFECYCLE_STATUSES.includes(value as OrderLifecycleStatus);
}

export function getOrderLifecycleStatusDefinition(
  status: OrderLifecycleStatus,
): OrderLifecycleStatusDefinition {
  return STATUS_DEFINITION_BY_ID[status];
}

export function getOrderLifecycleStatusLabel(
  status: OrderLifecycleStatus,
): string {
  return getOrderLifecycleStatusDefinition(status).titleRu;
}

export function isTerminalOrderLifecycleStatus(
  status: OrderLifecycleStatus,
): boolean {
  return TERMINAL_LIFECYCLE_STATUSES.has(status);
}

export function canTransitionOrderLifecycleStatus(
  from: OrderLifecycleStatus,
  to: OrderLifecycleStatus,
): boolean {
  if (from === to) {
    return true;
  }

  if (TERMINAL_LIFECYCLE_STATUSES.has(from)) {
    return false;
  }

  return LIFECYCLE_STATUS_TRANSITIONS[from].includes(to);
}

export function getNextOrderLifecycleStatuses(
  status: OrderLifecycleStatus,
): OrderLifecycleStatus[] {
  return LIFECYCLE_STATUS_TRANSITIONS[status];
}

export function getOrderLifecycleStatusPipelineIndex(
  status: OrderLifecycleStatus,
): number {
  return ORDER_LIFECYCLE_STATUSES.indexOf(status);
}
