// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for orderLifecycle.
//
// Назначение (RU): Определения типов для orderLifecycle.
// ==================================================
export type OrderLifecycleStatus =
  | "created"
  | "accepted"
  | "preparing"
  | "ready_for_courier"
  | "assigned_to_courier"
  | "courier_on_the_way"
  | "delivered"
  | "cancelled"
  | "failed";

export type OrderLifecycleActorType =
  | "system"
  | "customer"
  | "admin"
  | "courier"
  | "telegram"
  | "crm";

export type OrderLifecycleEventType =
  | "status_change"
  | "note"
  | "courier_assigned"
  | "courier_unassigned"
  | "system"
  | "notification";

export type OrderLifecycleActor = {
  actorType: OrderLifecycleActorType;
  actorId: string | null;
  actorName: string | null;
};

export type OrderLifecycleEvent = {
  lifecycleEventId: string;
  eventType: OrderLifecycleEventType;
  eventTitle: string;
  eventMessage: string;
  currentStatus: OrderLifecycleStatus;
  previousStatus: OrderLifecycleStatus | null;
  actorType: OrderLifecycleActorType;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type OrderLifecycle = {
  lifecycleOrderId: string;
  orderId: string;
  logisticsOrderId: string;
  currentStatus: OrderLifecycleStatus;
  previousStatus: OrderLifecycleStatus | null;
  events: OrderLifecycleEvent[];
  createdAt: string;
  updatedAt: string;
};

export type OrderLifecycleTimelineEntry = OrderLifecycleEvent & {
  statusLabel: string;
  customerMessage: string;
  adminMessage: string;
  courierMessage: string;
  telegramMessage: string;
};

export type AddLifecycleEventInput = {
  eventType: OrderLifecycleEventType;
  eventTitle: string;
  eventMessage: string;
  actor: OrderLifecycleActor;
  currentStatus?: OrderLifecycleStatus;
  previousStatus?: OrderLifecycleStatus | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
};

export type AddLifecycleEventResult =
  | { ok: true; lifecycle: OrderLifecycle; event: OrderLifecycleEvent }
  | { ok: false; lifecycle: OrderLifecycle | null; error: string };

export type ChangeOrderLifecycleStatusResult =
  | { ok: true; lifecycle: OrderLifecycle; event: OrderLifecycleEvent }
  | { ok: false; lifecycle: OrderLifecycle | null; error: string };
