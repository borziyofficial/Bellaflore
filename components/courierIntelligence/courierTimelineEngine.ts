// ==================================================
// SECTION: COURIER INTELLIGENCE
// РАЗДЕЛ: Timeline engine
// ==================================================
import type {
  CourierActorType,
  CourierTimelineEvent,
  CourierTimelineEventKind,
} from "@/components/courierIntelligence/courierIntelligenceTypes";

const TIMELINE_TITLES: Record<CourierTimelineEventKind, string> = {
  assigned: "Курьер назначен",
  accepted: "Курьер принял заказ",
  departed: "Курьер выехал",
  arrived: "Курьер прибыл",
  delivered: "Заказ доставлен",
  cancelled: "Доставка отменена",
  reassigned: "Курьер переназначен",
  unassigned: "Курьер снят с заказа",
};

let inMemoryTimeline: CourierTimelineEvent[] = [];

export function createCourierTimelineEvent(input: {
  courierId: string;
  orderId?: string | null;
  kind: CourierTimelineEventKind;
  message?: string;
  actorType?: CourierActorType;
  actorName?: string | null;
  createdAt?: string;
}): CourierTimelineEvent {
  const createdAt = input.createdAt ?? new Date().toISOString();

  return {
    id: `CTE-${input.courierId}-${input.kind}-${Date.parse(createdAt)}`,
    courierId: input.courierId,
    orderId: input.orderId ?? null,
    kind: input.kind,
    title: TIMELINE_TITLES[input.kind],
    message: input.message ?? TIMELINE_TITLES[input.kind],
    createdAt,
    actorType: input.actorType ?? "system",
    actorName: input.actorName ?? "Bellaflore",
  };
}

export function appendCourierTimelineEvent(
  event: CourierTimelineEvent,
): CourierTimelineEvent {
  inMemoryTimeline = [...inMemoryTimeline, event];
  return event;
}

export function listCourierTimelineEvents(courierId?: string): CourierTimelineEvent[] {
  const events = courierId
    ? inMemoryTimeline.filter((event) => event.courierId === courierId)
    : inMemoryTimeline;

  return [...events].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}

export function clearCourierTimeline(): void {
  inMemoryTimeline = [];
}
