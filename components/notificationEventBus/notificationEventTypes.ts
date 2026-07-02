// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for notificationEventBus.
//
// Назначение (RU): Определения типов для notificationEventBus.
// ==================================================
export type NotificationEventType =
  | "order.created"
  | "order.accepted"
  | "order.preparing"
  | "order.ready_for_courier"
  | "order.assigned_to_courier"
  | "order.courier_on_the_way"
  | "order.delivered"
  | "order.cancelled"
  | "order.failed";

export type NotificationSourceModule =
  | "orderLifecycle"
  | "deliveryOrchestration"
  | "checkout"
  | "admin"
  | "system";

export type NotificationActorType =
  | "system"
  | "customer"
  | "admin"
  | "courier"
  | "telegram"
  | "crm";

export type NotificationChannelTarget =
  | "telegram"
  | "crm"
  | "admin"
  | "customer"
  | "courier"
  | "analytics";

export type NotificationEventPriority = "low" | "normal" | "high" | "urgent";

export type NotificationEvent = {
  eventId: string;
  eventType: NotificationEventType;
  sourceModule: NotificationSourceModule;
  orderId: string;
  logisticsOrderId: string | null;
  lifecycleOrderId: string | null;
  status: string;
  actorType: NotificationActorType;
  actorId: string | null;
  actorName: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  processedAt: string | null;
  deliveryStatus: string | null;
  priority: NotificationEventPriority;
  channelTargets: NotificationChannelTarget[];
};

export type CreateNotificationEventInput = {
  eventType: NotificationEventType;
  sourceModule: NotificationSourceModule;
  orderId: string;
  logisticsOrderId?: string | null;
  lifecycleOrderId?: string | null;
  status: string;
  actorType: NotificationActorType;
  actorId?: string | null;
  actorName?: string | null;
  payload?: Record<string, unknown>;
  deliveryStatus?: string | null;
  priority?: NotificationEventPriority;
  channelTargets: NotificationChannelTarget[];
  createdAt?: string;
};

export type PublishNotificationEventResult = {
  event: NotificationEvent;
  subscriberResults: NotificationSubscriberDispatchResult[];
};

export type NotificationSubscriberDispatchResult =
  | {
      status: "prepared";
      channel: NotificationChannelTarget;
      payload: Record<string, unknown>;
    }
  | {
      status: "skipped";
      channel: NotificationChannelTarget;
      reason: string;
    }
  | {
      status: "disabled";
      channel: NotificationChannelTarget;
    };

export type NotificationSubscriberHandler = (
  event: NotificationEvent,
) => NotificationSubscriberDispatchResult;

export type NotificationEventConfig = {
  enabled: boolean;
  telegramEnabled: boolean;
  crmEnabled: boolean;
  adminEnabled: boolean;
  customerEnabled: boolean;
  courierEnabled: boolean;
  analyticsEnabled: boolean;
  persistEvents: boolean;
  autoProcessEvents: boolean;
};

export const NOTIFICATION_ORDER_EVENT_TYPES: NotificationEventType[] = [
  "order.created",
  "order.accepted",
  "order.preparing",
  "order.ready_for_courier",
  "order.assigned_to_courier",
  "order.courier_on_the_way",
  "order.delivered",
  "order.cancelled",
  "order.failed",
];
