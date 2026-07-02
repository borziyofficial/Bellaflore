// ==================================================
// SECTION: CRM INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  CrmCustomerSegment,
  CrmVipLevel,
  CrmTag,
  CrmTimelineEventKind,
  CrmReminderStatus,
  CrmReminderPriority,
  CrmAiPreparationStatus,
  CrmCustomerProfile,
  CrmPurchaseHistoryEntry,
  CrmTimelineEvent,
  CrmCustomerNote,
  CrmCustomerTagAssignment,
  CrmReminder,
  CrmLifetimeValue,
  CrmInsight,
  CrmAiPreparation,
  CrmStatistics,
  CrmIntelligenceSnapshot,
  CrmListFilters,
  CrmRegistryState,
  CrmReadOnlySummary,
} from "@/components/crmIntelligence/crmTypes";

export {
  CRM_EXAMPLE_CUSTOMERS,
  CRM_EXAMPLE_PURCHASE_HISTORY,
  CRM_EXAMPLE_TIMELINE,
  CRM_EXAMPLE_NOTES,
  CRM_EXAMPLE_TAG_ASSIGNMENTS,
  CRM_EXAMPLE_REMINDERS,
  CRM_EXAMPLE_INSIGHTS,
  CRM_EXAMPLE_AI_PREPARATIONS,
  buildCrmExampleRegistryState,
} from "@/components/crmIntelligence/crmExamples";

export {
  CRM_CUSTOMERS_STORAGE_KEY,
  listCrmCustomers,
  getCrmCustomerById,
  getCrmCustomerByPhone,
  listVipCustomers,
  listRepeatCustomers,
  registerCrmCustomer,
  seedCrmCustomerRegistry,
  clearCrmCustomerRegistry,
  getCustomerFavoriteFlowers,
  getCustomerNotesFromProfile,
} from "@/components/crmIntelligence/customerRegistry";

export {
  CRM_CUSTOMER_SEGMENTS,
  getSegmentLabel,
  detectCustomerSegment,
  filterCustomersBySegment,
  calculateCustomerLifetimeValue,
  listAtRiskCustomers,
  listHighValueCustomers,
} from "@/components/crmIntelligence/customerSegments";

export {
  CRM_PURCHASE_HISTORY_STORAGE_KEY,
  CRM_TIMELINE_STORAGE_KEY,
  CRM_NOTES_STORAGE_KEY,
  CRM_REMINDERS_STORAGE_KEY,
  CRM_INSIGHTS_STORAGE_KEY,
  listPurchaseHistory,
  buildCustomerTimeline,
  listCustomerNotes,
  listCrmReminders,
  listReminderQueue,
  listCrmInsights,
  registerPurchaseHistoryEntry,
  registerTimelineEvent,
  registerCustomerNote,
  registerCrmReminder,
  registerCrmInsight,
  seedCrmHistoryRegistry,
  clearCrmHistoryRegistry,
} from "@/components/crmIntelligence/customerHistory";

export {
  CRM_TAGS_STORAGE_KEY,
  CRM_AI_STORAGE_KEY,
  CRM_AVAILABLE_TAGS,
  listCustomerTagAssignments,
  listCustomersByTag,
  getCustomerTags,
  registerCustomerTag,
  removeCustomerTag,
  listAiCrmPreparations,
  getAiCrmPreparationById,
  registerAiCrmPreparation,
  seedCrmTagsRegistry,
  clearCrmTagsRegistry,
  getTagLabel,
} from "@/components/crmIntelligence/customerTags";

export {
  CRM_INTELLIGENCE_STORAGE_KEY,
  calculateCrmStatistics,
  buildCrmIntelligenceSnapshot,
  initializeCrmIntelligence,
  getCrmIntelligenceExample,
  getCrmReadOnlySummary,
  readCrmCustomerInsights,
  readCrmFoundationCapabilities,
  CRM_INTELLIGENCE_ENGINE_SCHEMA,
  listAllCrmFoundationCapabilities,
} from "@/components/crmIntelligence/crmEngine";
