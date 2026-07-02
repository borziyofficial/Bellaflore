// ==================================================
// SECTION: INVENTORY INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  InventoryItem,
  FlowerStockItem,
  AddOnStockItem,
  ProductCompositionRequirement,
  InventoryProductAvailabilityStatus,
  ProductAvailabilityResult,
  CompositionCheckResult,
  StockReservation,
  StockReservationLine,
  InventoryAdminOverride,
  AiInventoryHooks,
} from "@/components/inventoryIntelligence/inventoryIntelligenceTypes";

export {
  INVENTORY_STOCK_CATALOG_SEED,
  asFlowerStockItem,
  asAddOnStockItem,
} from "@/components/inventoryIntelligence/inventoryStockCatalog";

export {
  PRODUCT_COMPOSITION_CATALOG,
  getProductComposition,
  resolveRequirementQuantity,
} from "@/components/inventoryIntelligence/productCompositionCatalog";

export {
  readInventoryAdminOverride,
  writeInventoryAdminOverride,
  mergeInventoryStockWithAdmin,
  upsertInventoryStockOverride,
  INVENTORY_ADMIN_STORAGE_KEY,
  DEFAULT_INVENTORY_ADMIN_OVERRIDE,
} from "@/components/inventoryIntelligence/inventoryAdminStore";

export {
  checkProductComposition,
  checkBouquetCompositionExample,
  getAvailableStockQuantity,
  isStockSeasonallyAvailable,
} from "@/components/inventoryIntelligence/compositionCheckerEngine";

export {
  INVENTORY_AVAILABILITY_LABELS,
  getInventoryAvailabilityLabel,
  isInventoryProductPurchasable,
  resolveProductAvailability,
  resolveCatalogProductAvailability,
  buildCatalogAvailabilityIndex,
} from "@/components/inventoryIntelligence/productAvailabilityEngine";

export {
  reserveStockForOrder,
  releaseStockReservation,
  confirmStockUsage,
  getStockReservation,
  listStockReservations,
  clearInventoryReservations,
  seedInventoryReservationStock,
  readReservationStockState,
} from "@/components/inventoryIntelligence/inventoryReservationEngine";

export {
  registerAiInventoryHooks,
  getAiInventoryHooks,
  clearAiInventoryHooks,
  predictLowStock,
  suggestPurchaseOrder,
  suggestReplacement,
  analyzeInventoryDemand,
  AI_INVENTORY_INTEGRATION_SLOTS,
} from "@/components/inventoryIntelligence/aiInventoryFoundation";

export {
  getProductCardAvailabilityBadge,
  getCheckoutAvailabilityWarning,
  getInventoryUiLabel,
  type ProductCardAvailabilityBadge,
  type CheckoutAvailabilityWarning,
} from "@/components/inventoryIntelligence/inventoryUiHooks";

export {
  buildInventoryEngineSnapshot,
  mapInventoryStatusToCatalogStatus,
  getCatalogProductInventoryAvailability,
  inspectProductCompositionFromCatalog,
  inspectStockCatalog,
  inspectCompositionCheck,
  type InventoryEngineSnapshot,
} from "@/components/inventoryIntelligence/inventoryCatalogBridge";

export {
  runInventoryIntelligenceEngine,
  getInventoryAvailabilityForProduct,
  getInventoryStockSnapshot,
  runCompositionCheck,
  getInventoryCompositionExample,
} from "@/components/inventoryIntelligence/inventoryIntelligenceEngine";
