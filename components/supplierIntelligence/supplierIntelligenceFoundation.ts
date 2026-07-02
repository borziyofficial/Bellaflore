// ==================================================
// SECTION: SUPPLIER INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  SupplierStatus,
  SupplierReliabilityLevel,
  SupplierContractStatus,
  SupplierStockStatus,
  SupplierAiPreparationStatus,
  SupplierCategory,
  Supplier,
  SupplierPriceEntry,
  SupplierDeliverySchedule,
  SupplierStockEntry,
  SupplierContract,
  SupplierHistoryEntry,
  SupplierAnalyticsMetric,
  SupplierAiPreparation,
  SupplierStatistics,
  SupplierIntelligenceSnapshot,
  SupplierListFilters,
  SupplierRegistryState,
  SupplierReadOnlySummary,
} from "@/components/supplierIntelligence/supplierTypes";

export {
  SUPPLIER_EXAMPLE_SUPPLIERS,
  SUPPLIER_EXAMPLE_PRICES,
  SUPPLIER_EXAMPLE_DELIVERY,
  SUPPLIER_EXAMPLE_STOCK,
  SUPPLIER_EXAMPLE_CONTRACTS,
  SUPPLIER_EXAMPLE_HISTORY,
  SUPPLIER_EXAMPLE_ANALYTICS,
  SUPPLIER_EXAMPLE_AI,
  buildSupplierExampleRegistryState,
} from "@/components/supplierIntelligence/supplierExamples";

export {
  SUPPLIER_REGISTRY_STORAGE_KEY,
  resolveReliabilityLevel,
  listSuppliers,
  getSupplierById,
  getSupplierByCode,
  listPreferredSuppliers,
  listBackupSuppliers,
  listSuppliersByCategory,
  getSupplierRating,
  getSupplierReliability,
  registerSupplier,
  seedSupplierRegistry,
  clearSupplierRegistry,
  findBestSupplierForCategory,
} from "@/components/supplierIntelligence/supplierRegistry";

export {
  SUPPLIER_PRICE_STORAGE_KEY,
  SUPPLIER_STOCK_STORAGE_KEY,
  SUPPLIER_CONTRACT_STORAGE_KEY,
  listPurchasePrices,
  getPurchasePriceBySku,
  listStockAvailability,
  getStockBySku,
  listStockByStatus,
  listLowStockItems,
  listOutOfStockItems,
  listSupplierContracts,
  getSupplierContractById,
  registerPurchasePrice,
  registerStockEntry,
  registerSupplierContract,
  seedSupplierPriceRegistry,
  clearSupplierPriceRegistry,
  comparePurchasePrices,
} from "@/components/supplierIntelligence/supplierPriceRegistry";

export {
  SUPPLIER_DELIVERY_STORAGE_KEY,
  listDeliverySchedules,
  getDeliveryScheduleByZone,
  getSupplierDeliveryTimeDays,
  estimateDeliveryTime,
  registerDeliverySchedule,
  seedSupplierDeliveryRegistry,
  clearSupplierDeliveryRegistry,
  getFastestSuppliers,
} from "@/components/supplierIntelligence/supplierDeliveryRegistry";

export {
  SUPPLIER_HISTORY_STORAGE_KEY,
  SUPPLIER_ANALYTICS_STORAGE_KEY,
  SUPPLIER_AI_STORAGE_KEY,
  listSupplierHistory,
  listSupplierAnalytics,
  getSupplierAnalyticsById,
  listAiSupplierPreparations,
  getAiSupplierPreparationById,
  registerSupplierHistoryEntry,
  registerSupplierAnalytics,
  registerAiSupplierPreparation,
  seedSupplierHistoryRegistry,
  clearSupplierHistoryRegistry,
  buildSupplierAnalyticsSummary,
} from "@/components/supplierIntelligence/supplierHistory";

export {
  SUPPLIER_INTELLIGENCE_STORAGE_KEY,
  calculateSupplierStatistics,
  buildSupplierIntelligenceSnapshot,
  initializeSupplierIntelligence,
  getSupplierIntelligenceExample,
  getSupplierReadOnlySummary,
  readSupplierFoundationCapabilities,
  SUPPLIER_INTELLIGENCE_ENGINE_SCHEMA,
  listAllSupplierFoundationCapabilities,
} from "@/components/supplierIntelligence/supplierEngine";
