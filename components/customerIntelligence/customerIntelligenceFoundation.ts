// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  CustomerSegment,
  CustomerVipLevel,
  CustomerOccasionKind,
  CustomerReminderStatus,
  CustomerReminderPriority,
  CustomerCommunicationChannel,
  CustomerTag,
  CustomerAddress,
  CustomerRecipient,
  CustomerFavorite,
  CustomerPreference,
  CustomerOccasion,
  CustomerHistoryEntry,
  CustomerHistory,
  CustomerStatistics,
  CustomerLifetimeValue,
  CustomerRiskScore,
  CustomerReminder,
  CustomerCommunicationHistory,
  CustomerProfile,
  CustomerProfileInput,
  CustomerListFilters,
  AdminCustomerListItem,
  AdminCustomerDetails,
  CustomerTimelineEvent,
  CustomerPublicSummary,
  AiCustomerHooks,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

export {
  DEFAULT_CUSTOMER_PREFERENCES,
  DEFAULT_CUSTOMER_STATISTICS,
  DEFAULT_CUSTOMER_LTV,
  DEFAULT_CUSTOMER_RISK,
  buildEmptyCustomerProfile,
  CUSTOMER_INTELLIGENCE_SEED,
} from "@/components/customerIntelligence/customerCatalogSeed";

export {
  CUSTOMER_INTELLIGENCE_STORAGE_KEY,
  createCustomerProfile,
  updateCustomerProfile,
  getCustomerProfile,
  getCustomerProfileByPhone,
  listCustomerProfiles,
  addCustomerAddress,
  addCustomerRecipient,
  addCustomerFavorite,
  addCustomerCommunication,
  saveCustomerProfileState,
  clearCustomerIntelligenceStore,
  seedCustomerIntelligenceStore,
} from "@/components/customerIntelligence/customerProfileEngine";

export {
  buildCustomerHistoryFromOrders,
  syncCustomerHistory,
  appendCustomerHistoryEntry,
} from "@/components/customerIntelligence/customerHistoryEngine";

export {
  updateCustomerPreferences,
  mergeCustomerPreferences,
  CUSTOMER_PREFERENCE_FIELDS,
} from "@/components/customerIntelligence/customerPreferenceEngine";

export {
  addCustomerOccasion,
  listCustomerOccasions,
  CUSTOMER_OCCASION_KINDS,
} from "@/components/customerIntelligence/customerOccasionEngine";

export {
  createCustomerReminder,
  listCustomerReminders,
  listCustomerReminderQueue,
  updateCustomerReminderStatus,
  buildRemindersForOccasions,
} from "@/components/customerIntelligence/customerReminderEngine";

export { calculateCustomerStatistics } from "@/components/customerIntelligence/customerStatisticsEngine";

export { calculateCustomerLifetimeValue } from "@/components/customerIntelligence/customerLifetimeValueEngine";

export { calculateCustomerRiskScore } from "@/components/customerIntelligence/customerRiskEngine";

export {
  CUSTOMER_SEGMENTS,
  detectCustomerSegment,
  getSegmentLabel,
} from "@/components/customerIntelligence/customerSegmentEngine";

export {
  readOrderCustomerSnapshot,
  buildOrderCustomerInsight,
} from "@/components/customerIntelligence/orderCustomerBridge";

export {
  readNotificationCustomerSnapshot,
  buildNotificationCustomerInsight,
} from "@/components/customerIntelligence/notificationCustomerBridge";

export {
  readAnalyticsCustomerSnapshot,
  buildAnalyticsCustomerInsight,
} from "@/components/customerIntelligence/analyticsCustomerBridge";

export {
  readPromotionCustomerSnapshot,
  buildPromotionCustomerInsight,
} from "@/components/customerIntelligence/promotionCustomerBridge";

export {
  readDeliveryCustomerSnapshot,
  buildDeliveryCustomerInsight,
} from "@/components/customerIntelligence/deliveryCustomerBridge";

export {
  listAdminCustomers,
  getAdminCustomerDetails,
  filterCustomersBySegment,
  getVIPCustomers,
  getAtRiskCustomers,
  getCustomerTimeline,
  getCustomerReminderQueue,
} from "@/components/customerIntelligence/customerAdminFoundation";

export {
  registerAiCustomerHooks,
  getAiCustomerHooks,
  clearAiCustomerHooks,
  suggestNextPurchase,
  detectVIPCustomer,
  detectCustomerRisk,
  recommendBouquetForCustomer,
  detectImportantDate,
  summarizeCustomerProfile,
  suggestCustomerRetentionAction,
  AI_CUSTOMER_INTEGRATION_SLOTS,
  buildAiCustomerContext,
} from "@/components/customerIntelligence/aiCustomerFoundation";

export {
  getCustomerPublicSummary,
  updateCustomerPublicPreferences,
  listCustomerPublicFavorites,
  CUSTOMER_PUBLIC_API_FOUNDATION,
} from "@/components/customerIntelligence/customerPublicFoundation";

export {
  recalculateCustomerProfile,
  recalculateAllCustomerProfiles,
  buildCustomerIntelligenceSnapshot,
  getCustomerIntelligenceExample,
  initializeCustomerIntelligence,
  CUSTOMER_INTELLIGENCE_ENGINE_SCHEMA,
} from "@/components/customerIntelligence/customerIntelligenceEngine";

export type { CustomerIntelligenceSnapshot } from "@/components/customerIntelligence/customerIntelligenceEngine";

export type { OrderCustomerSnapshot, OrderCustomerSnapshotOrder } from "@/components/customerIntelligence/orderCustomerBridge";
