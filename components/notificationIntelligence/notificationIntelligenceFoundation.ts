// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  NotificationEvent,
  NotificationChannel,
  NotificationRecipient,
  NotificationPriority,
  NotificationStatus,
  NotificationTemplate,
  NotificationRule,
  NotificationQueueItem,
  NotificationSourceEventKind,
  NotificationAdminConfig,
  EscalationPlan,
  AiNotificationHooks,
} from "@/components/notificationIntelligence/notificationIntelligenceTypes";

export {
  DEFAULT_NOTIFICATION_RULES,
  getDefaultNotificationRules,
} from "@/components/notificationIntelligence/notificationRulesCatalog";

export {
  NOTIFICATION_TEMPLATES,
  getTemplateForEvent,
  renderNotificationTemplate,
  renderNotificationFromTemplate,
} from "@/components/notificationIntelligence/notificationTemplateEngine";

export {
  NOTIFICATION_ADMIN_STORAGE_KEY,
  readNotificationAdminConfig,
  writeNotificationAdminConfig,
  getActiveNotificationRules,
  disableNotificationRule,
  enableNotificationRule,
  setNotificationChannelEnabled,
  isNotificationChannelEnabled,
  DEFAULT_NOTIFICATION_ADMIN_CONFIG,
} from "@/components/notificationIntelligence/notificationAdminStore";

export {
  resolveRulesForEvent,
  buildNotificationsFromEvent,
  buildEscalationNotificationsForEvent,
  processNotificationEvent,
} from "@/components/notificationIntelligence/notificationRuleEngine";

export {
  NOTIFICATION_QUEUE_STORAGE_KEY,
  createNotification,
  createNotifications,
  markAsSent,
  markAsFailed,
  cancelNotification,
  listPendingNotifications,
  listAllNotifications,
  retryNotification,
  filterNotificationsByStatus,
  filterNotificationsByPriority,
  clearNotificationQueue,
  getNotificationById,
} from "@/components/notificationIntelligence/notificationQueueEngine";

export {
  buildEscalationPlanForPendingItem,
  scheduleEscalationsForEvent,
  processDueEscalations,
  getExampleNewOrderEscalation,
  applySuggestedEscalation,
  describeEscalationFlow,
} from "@/components/notificationIntelligence/notificationEscalationEngine";

export {
  listAdminNotifications,
  filterAdminNotificationsByStatus,
  filterAdminNotificationsByPriority,
  retryAdminNotification,
  disableAdminNotificationRule,
  enableAdminNotificationRule,
  setAdminNotificationChannelEnabled,
} from "@/components/notificationIntelligence/notificationAdminFoundation";

export {
  registerAiNotificationHooks,
  getAiNotificationHooks,
  clearAiNotificationHooks,
  detectNotificationRisk,
  suggestEscalation,
  summarizeNotificationFailures,
  optimizeNotificationRules,
  AI_NOTIFICATION_INTEGRATION_SLOTS,
} from "@/components/notificationIntelligence/aiNotificationFoundation";

export {
  buildOrderNotificationEvent,
  buildNewOrderNotificationEvent,
  buildOrderNotConfirmedNotificationEvent,
  buildDeliveryDelayNotificationEvent,
} from "@/components/notificationIntelligence/orderNotificationBridge";

export {
  buildCourierNotificationEvent,
  buildCourierAssignedNotificationEvent,
  buildCourierDelayNotificationEvent,
} from "@/components/notificationIntelligence/courierNotificationBridge";

export {
  buildInventoryNotificationEvent,
  buildLowStockNotificationEvent,
  buildOutOfStockNotificationEvent,
  buildReplacementNeededNotificationEvent,
  scanInventoryForNotificationEvents,
} from "@/components/notificationIntelligence/inventoryNotificationBridge";

export {
  buildSystemNotificationEvent,
  buildTelegramFailedNotificationEvent,
  buildPaymentAttentionNotificationEvent,
  buildSystemDeliveryDelayNotificationEvent,
} from "@/components/notificationIntelligence/systemNotificationBridge";

export {
  ingestNotificationEvent,
  runNotificationIntelligenceForOrder,
  getNotificationIntelligenceNewOrderExample,
  getNotificationIntelligenceSnapshot,
} from "@/components/notificationIntelligence/notificationIntelligenceEngine";
