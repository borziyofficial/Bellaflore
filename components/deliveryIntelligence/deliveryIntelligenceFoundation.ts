// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  DeliveryTask,
  DeliveryStatus,
  DeliveryPriority,
  DeliveryWindow,
  DeliveryEta,
  DeliveryRoutePlan,
  DeliveryDelayRisk,
  DeliveryAssignment,
  DeliveryTimelineEvent,
  DeliveryTimelineEventKind,
  DeliveryNotificationEventKind,
  DeliveryNotificationPayload,
  DeliveryListFilters,
  AiDeliveryIntelligenceHooks,
} from "@/components/deliveryIntelligence/deliveryIntelligenceTypes";

export {
  DELIVERY_STATUS_LABELS,
  getDeliveryStatusLabel,
  buildDeliveryTimelineEvent,
  timelineKindForStatus,
} from "@/components/deliveryIntelligence/deliveryTimelineEngine";

export {
  DELIVERY_INTELLIGENCE_STORAGE_KEY,
  createDeliveryTask,
  updateDeliveryStatus,
  getDeliveryTaskByOrderId,
  getDeliveryTaskById,
  listDeliveryTasks,
  cancelDeliveryTask,
  rescheduleDeliveryTask,
  assignDeliveryCourier,
  clearDeliveryIntelligenceStore,
  buildDeliveryTaskId,
  mapOrderPriorityToDeliveryPriority,
} from "@/components/deliveryIntelligence/deliveryTaskEngine";

export {
  getAvailableDeliveryWindows,
  findNearestDeliveryWindow,
  detectDeliveryWindowRisk,
  suggestRescheduleWindow,
} from "@/components/deliveryIntelligence/deliveryWindowEngine";

export {
  calculateDeliveryEta,
  predictDeliveryDelay,
  calculateCourierLoadImpact,
  getExampleDeliveryEta,
  getExampleDeliveryDelayRisk,
} from "@/components/deliveryIntelligence/deliveryEtaEngine";

export {
  buildDeliveryTaskFromOrder,
  createDeliveryTaskFromOrder,
  getExampleDeliveryTask,
} from "@/components/deliveryIntelligence/orderDeliveryBridge";

export {
  buildDeliveryRoutePlanForTask,
  enrichDeliveryTaskWithCourierContext,
  buildCourierDeliverySnapshot,
} from "@/components/deliveryIntelligence/courierDeliveryBridge";

export {
  buildDeliveryNotificationPayload,
  buildDeliveryDelayNotificationPayload,
  listDeliveryNotificationPayloads,
  mapDeliveryNotificationToOrderBridgePayload,
} from "@/components/deliveryIntelligence/notificationDeliveryBridge";

export {
  listDeliveryZoneCatalogEntries,
  getDeliveryZoneCatalogEntry,
  resolveDeliveryZonePriceRub,
  resolveDeliveryZoneEtaLabel,
  buildDeliveryZoneSnapshot,
} from "@/components/deliveryIntelligence/deliveryZoneBridge";

export {
  listAdminDeliveries,
  filterDeliveriesByStatus,
  filterDeliveriesByCourier,
  getAdminDeliveryDetails,
  getAdminDeliveryDetailsByOrderId,
  manuallyAssignDeliveryCourier,
  manuallyRescheduleDelivery,
  markDeliveryDelivered,
  markDeliveryFailed,
  cancelAdminDelivery,
  filterDeliveries,
  type AdminDeliveryListItem,
  type AdminDeliveryDetails,
} from "@/components/deliveryIntelligence/deliveryAdminFoundation";

export {
  registerAiDeliveryIntelligenceHooks,
  getAiDeliveryIntelligenceHooks,
  clearAiDeliveryIntelligenceHooks,
  predictDeliveryDelayAi,
  suggestBestDeliveryWindow,
  suggestCourierForDelivery,
  optimizeDeliveryRoute,
  detectDeliveryRisk,
  summarizeDeliveryPerformance,
  AI_DELIVERY_INTELLIGENCE_INTEGRATION_SLOTS,
} from "@/components/deliveryIntelligence/aiDeliveryIntelligenceFoundation";

export {
  runDeliveryIntelligenceEngine,
  getDeliveryIntelligenceExample,
  bootstrapDeliveryTaskForOrder,
  getDeliveryIntelligenceSnapshot,
} from "@/components/deliveryIntelligence/deliveryIntelligenceEngine";
