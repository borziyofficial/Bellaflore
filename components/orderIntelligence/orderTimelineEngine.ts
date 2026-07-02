// ==================================================
// SECTION: ORDER INTELLIGENCE
// РАЗДЕЛ: Timeline engine
// ==================================================
import type {
  Order,
  OrderActorType,
  OrderStatus,
  OrderTimelineEvent,
  OrderTimelineEventKind,
} from "@/components/orderIntelligence/orderIntelligenceTypes";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  draft: "Черновик",
  new: "Новый заказ",
  confirmed: "Заказ подтверждён",
  preparing: "Букет собирается",
  ready: "Готов к выдаче",
  courier_assigned: "Курьер назначен",
  in_delivery: "В доставке",
  delivered: "Доставлен",
  cancelled: "Отменён",
  failed: "Ошибка",
};

const TIMELINE_TITLES: Record<OrderTimelineEventKind, string> = {
  order_created: "Заказ создан",
  order_confirmed: "Заказ подтверждён",
  bouquet_preparing: "Букет собирается",
  order_ready: "Заказ готов",
  courier_assigned: "Курьер назначен",
  in_delivery: "В доставке",
  delivered: "Доставлен",
  cancelled: "Заказ отменён",
  failed: "Ошибка заказа",
  status_changed: "Статус изменён",
  note_added: "Добавлена заметка",
};

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

export function createTimelineEventId(
  orderId: string,
  kind: OrderTimelineEventKind,
  createdAt: string,
): string {
  return `OTE-${orderId}-${kind}-${Date.parse(createdAt)}`;
}

export function buildTimelineEvent(input: {
  orderId: string;
  kind: OrderTimelineEventKind;
  status: OrderStatus;
  message?: string;
  actorType?: OrderActorType;
  actorName?: string | null;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}): OrderTimelineEvent {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: createTimelineEventId(input.orderId, input.kind, createdAt),
    kind: input.kind,
    status: input.status,
    title: TIMELINE_TITLES[input.kind],
    message: input.message ?? TIMELINE_TITLES[input.kind],
    createdAt,
    actorType: input.actorType ?? "system",
    actorName: input.actorName ?? "Bellaflore",
    metadata: input.metadata,
  };
}

export function timelineKindForStatus(status: OrderStatus): OrderTimelineEventKind {
  switch (status) {
    case "new":
      return "order_created";
    case "confirmed":
      return "order_confirmed";
    case "preparing":
      return "bouquet_preparing";
    case "ready":
      return "order_ready";
    case "courier_assigned":
      return "courier_assigned";
    case "in_delivery":
      return "in_delivery";
    case "delivered":
      return "delivered";
    case "cancelled":
      return "cancelled";
    case "failed":
      return "failed";
    default:
      return "status_changed";
  }
}

export function appendTimelineEvent(
  order: Order,
  event: OrderTimelineEvent,
): Order {
  return {
    ...order,
    timeline: [...order.timeline, event],
    updatedAt: event.createdAt,
  };
}

export function seedInitialOrderTimeline(order: Order): Order {
  const createdEvent = buildTimelineEvent({
    orderId: order.id,
    kind: "order_created",
    status: order.status,
    message: "Заказ создан в системе Bellaflore",
  });

  return appendTimelineEvent(order, createdEvent);
}
