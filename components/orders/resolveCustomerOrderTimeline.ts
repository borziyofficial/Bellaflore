// ==================================================
// SECTION: ORDERS
// РАЗДЕЛ: Заказы
//
// Purpose (EN):
// Resolves backend order data into customer timeline views.
//
// Назначение (RU):
// Преобразование backend-данных заказа в клиентский таймлайн.
// ==================================================
import {
  getOrderStatus,
  getOrderStatusLabel,
  type OrderStatusId,
} from "@/components/orders/orderStatus";
import {
  createTimelineEvent,
  getVisibleTimeline,
  type OrderTimelineEvent,
} from "@/components/orders/orderTimeline";

const ORDER_STATUS_ICON_SYMBOLS: Record<string, string> = {
  sparkles: "✨",
  "check-circle": "✓",
  bouquet: "💐",
  courier: "🛵",
  delivery: "🚚",
  delivered: "✅",
  cancelled: "✕",
};


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
export type CustomerOrderTimelineItem = {
  status: OrderStatusId;
  titleRu: string;
  icon: string;
  createdAt: string;
  createdAtLabel: string;
  note: string;
  isLatest: boolean;
};

type ResolveCustomerOrderTimelineInput = {
  status: string;
  createdAt: string;
  createdAtDisplay?: string;
  timeline?: OrderTimelineEvent[];
};


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
function formatTimelineDateTime(
  createdAt: string,
  createdAtDisplay?: string,
): string {
  if (createdAtDisplay?.trim()) {
    return createdAtDisplay.trim();
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOrderStatusIconSymbol(statusId: OrderStatusId): string {
  const statusDefinition = getOrderStatus(statusId);
  const iconId = statusDefinition?.icon ?? "sparkles";

  return ORDER_STATUS_ICON_SYMBOLS[iconId] ?? "•";
}

function resolveDefaultTimelineEvent(
  order: ResolveCustomerOrderTimelineInput,
): OrderTimelineEvent[] {
  const defaultEvent = createTimelineEvent({
    status: order.status === "NEW" ? "CREATED" : order.status,
    updatedBy: "BellaFlore",
    source: "system",
    visibleToCustomer: true,
    createdAt: order.createdAt,
  });

  return defaultEvent ? [defaultEvent] : [];
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
export function resolveCustomerOrderTimeline(
  order: ResolveCustomerOrderTimelineInput,
): CustomerOrderTimelineItem[] {
  const sourceTimeline =
    order.timeline && order.timeline.length > 0
      ? getVisibleTimeline(order.timeline)
      : resolveDefaultTimelineEvent(order);

  if (sourceTimeline.length === 0) {
    return [];
  }

  const latestIndex = sourceTimeline.length - 1;

  return sourceTimeline.map((event, index) => ({
    status: event.status,
    titleRu: getOrderStatusLabel(event.status),
    icon: getOrderStatusIconSymbol(event.status),
    createdAt: event.createdAt,
    createdAtLabel: formatTimelineDateTime(
      event.createdAt,
      index === 0 ? order.createdAtDisplay : undefined,
    ),
    note: event.note.trim(),
    isLatest: index === latestIndex,
  }));
}

export function getCustomerOrderStatusLabel(
  order: ResolveCustomerOrderTimelineInput,
): string {
  const timeline = resolveCustomerOrderTimeline(order);
  const latestStatus = timeline.at(-1)?.status;

  if (latestStatus) {
    return getOrderStatusLabel(latestStatus);
  }

  return getOrderStatusLabel(order.status === "NEW" ? "CREATED" : order.status);
}
