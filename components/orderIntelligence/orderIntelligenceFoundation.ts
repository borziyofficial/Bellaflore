// ==================================================
// SECTION: ORDER INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  Order,
  OrderCustomer,
  OrderRecipient,
  OrderDelivery,
  OrderPayment,
  OrderItem,
  OrderStatus,
  OrderTimelineEvent,
  OrderTimelineEventKind,
  OrderListFilters,
  OrderAlert,
  OrderAlertKind,
  OrderInventoryIntegrationPlan,
  AiOrderIntelligenceHooks,
} from "@/components/orderIntelligence/orderIntelligenceTypes";

export {
  ORDER_STATUS_LABELS,
  getOrderStatusLabel,
  buildTimelineEvent,
  seedInitialOrderTimeline,
} from "@/components/orderIntelligence/orderTimelineEngine";

export {
  ORDER_INTELLIGENCE_STORAGE_KEY,
  createOrder,
  updateOrderStatus,
  addOrderTimelineEvent,
  getOrderById,
  listOrders,
  cancelOrder,
  patchOrder,
  canTransitionOrderStatus,
  clearOrderIntelligenceStore,
} from "@/components/orderIntelligence/orderStoreEngine";

export {
  listAdminOrders,
  filterOrdersByStatus,
  searchOrders,
  getAdminOrderDetails,
  changeAdminOrderStatus,
  assignCourierToOrder,
  filterOrders,
  type AdminOrderListItem,
  type AdminOrderDetails,
} from "@/components/orderIntelligence/orderAdminFoundation";

export {
  detectOrderAlerts,
  getOrderAlertsForOrder,
  listActiveOrderAlerts,
} from "@/components/orderIntelligence/orderAlertsFoundation";

export {
  DEFAULT_ORDER_INVENTORY_PLAN,
  reserveInventoryForOrder,
  releaseInventoryForOrder,
  confirmInventoryForDeliveredOrder,
  handleOrderInventoryOnCreate,
  handleOrderInventoryOnCancel,
  handleOrderInventoryOnDelivered,
} from "@/components/orderIntelligence/orderInventoryBridge";

export {
  buildOrderFromCheckoutInput,
  persistOrderIntelligenceFromCheckout,
  getExampleOrderPayload,
  type CheckoutOrderBridgeInput,
} from "@/components/orderIntelligence/checkoutOrderBridge";

export {
  registerAiOrderIntelligenceHooks,
  getAiOrderIntelligenceHooks,
  clearAiOrderIntelligenceHooks,
  analyzeOrderDemand,
  detectProblemOrder,
  suggestCourier,
  predictDeliveryDelay,
  summarizeDailyOrders,
  AI_ORDER_INTELLIGENCE_INTEGRATION_SLOTS,
} from "@/components/orderIntelligence/aiOrderIntelligenceFoundation";

export {
  runOrderIntelligenceEngine,
  getOrderIntelligenceSnapshot,
  getOrderIntelligenceExample,
  searchOrderIntelligence,
  cancelOrderIntelligence,
} from "@/components/orderIntelligence/orderIntelligenceEngine";
