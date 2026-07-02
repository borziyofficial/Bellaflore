// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: Timeline engine
// ==================================================
import type {
  DeliveryStatus,
  DeliveryTimelineEvent,
  DeliveryTimelineEventKind,
} from "@/components/deliveryIntelligence/deliveryIntelligenceTypes";

const TIMELINE_TITLES: Record<DeliveryTimelineEventKind, string> = {
  delivery_created: "Доставка создана",
  window_selected: "Интервал выбран",
  courier_assigned: "Курьер назначен",
  pickup_preparing: "Подготовка к выдаче",
  picked_up: "Заказ забран",
  in_transit: "В пути",
  near_recipient: "Курьер рядом с адресом",
  delivered: "Доставлено",
  failed: "Доставка не выполнена",
  rescheduled: "Доставка перенесена",
  cancelled: "Доставка отменена",
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pending: "Ожидает",
  scheduled: "Запланирована",
  courier_assigned: "Курьер назначен",
  preparing_pickup: "Готовится к выдаче",
  picked_up: "Забрано",
  in_transit: "В пути",
  near_recipient: "Рядом с адресом",
  delivered: "Доставлено",
  failed: "Ошибка",
  cancelled: "Отменена",
  rescheduled: "Перенесена",
};

export function timelineKindForStatus(
  status: DeliveryStatus,
): DeliveryTimelineEventKind {
  switch (status) {
    case "pending":
      return "delivery_created";
    case "scheduled":
      return "window_selected";
    case "courier_assigned":
      return "courier_assigned";
    case "preparing_pickup":
      return "pickup_preparing";
    case "picked_up":
      return "picked_up";
    case "in_transit":
      return "in_transit";
    case "near_recipient":
      return "near_recipient";
    case "delivered":
      return "delivered";
    case "failed":
      return "failed";
    case "rescheduled":
      return "rescheduled";
    case "cancelled":
      return "cancelled";
    default:
      return "delivery_created";
  }
}

export function buildDeliveryTimelineEvent(input: {
  taskId: string;
  kind: DeliveryTimelineEventKind;
  status: DeliveryStatus;
  message?: string;
  actorType?: DeliveryTimelineEvent["actorType"];
  actorName?: string | null;
  createdAt?: string;
}): DeliveryTimelineEvent {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: `DTE-${input.taskId}-${input.kind}-${Date.parse(createdAt)}`,
    kind: input.kind,
    status: input.status,
    title: TIMELINE_TITLES[input.kind],
    message: input.message ?? TIMELINE_TITLES[input.kind],
    createdAt,
    actorType: input.actorType ?? "system",
    actorName: input.actorName ?? "Bellaflore",
  };
}

export function appendDeliveryTimelineEvent(
  timeline: DeliveryTimelineEvent[],
  event: DeliveryTimelineEvent,
): DeliveryTimelineEvent[] {
  return [...timeline, event];
}

export function getDeliveryStatusLabel(status: DeliveryStatus): string {
  return DELIVERY_STATUS_LABELS[status];
}
