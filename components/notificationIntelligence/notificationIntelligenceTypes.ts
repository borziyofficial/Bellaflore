// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================
export type NotificationChannel =
  | "telegram"
  | "sms"
  | "whatsapp"
  | "email"
  | "push"
  | "in_app"
  | "admin_sound";

export type NotificationPriority = "low" | "normal" | "high" | "critical";

export type NotificationStatus =
  | "pending"
  | "sent"
  | "failed"
  | "cancelled"
  | "suppressed";

export type NotificationSourceModule = "order" | "courier" | "inventory" | "system";

export type NotificationSourceEventKind =
  | "new_order"
  | "order_confirmed"
  | "order_preparing"
  | "order_ready"
  | "order_courier_assigned"
  | "order_in_delivery"
  | "order_delivered"
  | "order_cancelled"
  | "order_failed"
  | "courier_assigned"
  | "courier_departed"
  | "courier_arrived"
  | "courier_delivered"
  | "courier_delay_detected"
  | "low_stock"
  | "out_of_stock"
  | "replacement_needed"
  | "telegram_failed"
  | "payment_attention"
  | "order_not_confirmed"
  | "delivery_delay";

export type NotificationRecipientRole =
  | "admin"
  | "customer"
  | "courier"
  | "system";

export type NotificationRecipient = {
  role: NotificationRecipientRole;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  telegramChatId?: string | null;
  userId?: string | null;
};

export type NotificationEventPayload = Record<string, string | number | boolean | null>;

export type NotificationEvent = {
  id: string;
  kind: NotificationSourceEventKind;
  source: NotificationSourceModule;
  title: string;
  payload: NotificationEventPayload;
  occurredAt: string;
  orderId?: string | null;
  courierId?: string | null;
  stockItemId?: string | null;
};

export type NotificationTemplate = {
  id: string;
  eventKind: NotificationSourceEventKind;
  title: string;
  body: string;
  channels: NotificationChannel[];
  variables: string[];
};

export type NotificationRule = {
  id: string;
  eventKind: NotificationSourceEventKind;
  enabled: boolean;
  channels: NotificationChannel[];
  recipientRole: NotificationRecipientRole;
  priority: NotificationPriority;
  repeatAfterMinutes: number[];
  escalateAfterMinutes: number | null;
  escalateToPriority: NotificationPriority | null;
  escalateToChannels: NotificationChannel[];
  suppressIfSent: boolean;
};

export type NotificationQueueItem = {
  id: string;
  eventId: string;
  ruleId: string;
  eventKind: NotificationSourceEventKind;
  channel: NotificationChannel;
  recipient: NotificationRecipient;
  priority: NotificationPriority;
  status: NotificationStatus;
  templateId: string;
  renderedTitle: string;
  renderedMessage: string;
  payload: NotificationEventPayload;
  scheduledAt: string;
  sentAt: string | null;
  failedAt: string | null;
  cancelledAt: string | null;
  retryCount: number;
  escalationLevel: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationAdminConfig = {
  enabled: boolean;
  disabledRuleIds: string[];
  disabledChannels: NotificationChannel[];
  rulesVersion: string;
  updatedAt: string;
};

export type EscalationPlan = {
  notificationId: string;
  nextPriority: NotificationPriority;
  nextChannels: NotificationChannel[];
  scheduledAt: string;
  reason: string;
};

export type AiNotificationHooks = {
  detectNotificationRisk?: (
    event: NotificationEvent,
  ) => Promise<{ riskLevel: NotificationPriority; reasons: string[] }>;
  suggestEscalation?: (
    item: NotificationQueueItem,
  ) => Promise<EscalationPlan | null>;
  summarizeNotificationFailures?: () => Promise<{
    summary: string;
    failedCount: number;
    topChannels: NotificationChannel[];
  }>;
  optimizeNotificationRules?: () => Promise<
    Array<{ ruleId: string; suggestion: string }>
  >;
};
