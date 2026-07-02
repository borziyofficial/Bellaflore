// ==================================================
// SECTION: SUPPLIER INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import { getFastestSuppliers, listDeliverySchedules, seedSupplierDeliveryRegistry } from "@/components/supplierIntelligence/supplierDeliveryRegistry";
import { buildSupplierExampleRegistryState } from "@/components/supplierIntelligence/supplierExamples";
import {
  listAiSupplierPreparations,
  listSupplierAnalytics,
  listSupplierHistory,
  seedSupplierHistoryRegistry,
} from "@/components/supplierIntelligence/supplierHistory";
import {
  listLowStockItems,
  listOutOfStockItems,
  listPurchasePrices,
  listSupplierContracts,
  listStockAvailability,
  seedSupplierPriceRegistry,
} from "@/components/supplierIntelligence/supplierPriceRegistry";
import {
  listBackupSuppliers,
  listPreferredSuppliers,
  listSuppliers,
  seedSupplierRegistry,
} from "@/components/supplierIntelligence/supplierRegistry";
import type {
  SupplierIntelligenceSnapshot,
  SupplierReadOnlySummary,
  SupplierStatistics,
} from "@/components/supplierIntelligence/supplierTypes";

export const SUPPLIER_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_supplier_intelligence_v1";

export function calculateSupplierStatistics(): SupplierStatistics {
  const suppliers = listSuppliers();
  const active = suppliers.filter((s) => s.status === "active");

  const averageRating =
    active.length > 0
      ? Math.round((active.reduce((sum, s) => sum + s.rating, 0) / active.length) * 10) / 10
      : 0;

  const averageReliabilityScore =
    active.length > 0
      ? Math.round(active.reduce((sum, s) => sum + s.reliabilityScore, 0) / active.length)
      : 0;

  return {
    totalSuppliers: suppliers.length,
    activeSuppliers: active.length,
    preferredSuppliers: listPreferredSuppliers().length,
    backupSuppliers: listBackupSuppliers().length,
    averageRating,
    averageReliabilityScore,
    activeContracts: listSupplierContracts(undefined, true).length,
    lowStockItems: listLowStockItems().length + listOutOfStockItems().length,
    calculatedAt: new Date().toISOString(),
  };
}

export function buildSupplierIntelligenceSnapshot(
  at: Date = new Date(),
): SupplierIntelligenceSnapshot {
  return {
    suppliers: listSuppliers(),
    prices: listPurchasePrices(undefined, at),
    deliverySchedules: listDeliverySchedules(),
    stock: listStockAvailability(),
    contracts: listSupplierContracts(),
    history: listSupplierHistory(),
    analytics: listSupplierAnalytics(),
    aiPreparations: listAiSupplierPreparations(),
    statistics: calculateSupplierStatistics(),
    generatedAt: at.toISOString(),
  };
}

export function initializeSupplierIntelligence(): SupplierIntelligenceSnapshot {
  seedSupplierRegistry();
  seedSupplierPriceRegistry();
  seedSupplierDeliveryRegistry();
  seedSupplierHistoryRegistry();
  return buildSupplierIntelligenceSnapshot();
}

export function getSupplierIntelligenceExample() {
  return buildSupplierExampleRegistryState().suppliers[0];
}

export function getSupplierReadOnlySummary(): SupplierReadOnlySummary {
  return {
    supplierCount: listSuppliers().length,
    preferredCount: listPreferredSuppliers().length,
    backupCount: listBackupSuppliers().length,
    contractCount: listSupplierContracts(undefined, true).length,
    lowStockCount: listLowStockItems().length + listOutOfStockItems().length,
  };
}

export function readSupplierFoundationCapabilities() {
  return {
    supplierRegistry: listSuppliers(),
    supplierRating: listSuppliers().map((s) => ({ id: s.id, rating: s.rating })),
    supplierReliability: listSuppliers().map((s) => ({
      id: s.id,
      score: s.reliabilityScore,
      level: s.reliabilityLevel,
    })),
    purchasePrices: listPurchasePrices(),
    stockAvailability: listStockAvailability(),
    deliveryTime: getFastestSuppliers(),
    preferredSuppliers: listPreferredSuppliers(),
    backupSuppliers: listBackupSuppliers(),
    supplierContracts: listSupplierContracts(undefined, true),
    supplierAnalytics: listSupplierAnalytics(),
    supplierStatistics: calculateSupplierStatistics(),
    aiSupplierPreparation: listAiSupplierPreparations(),
    supplierHistory: listSupplierHistory(),
    lowStock: listLowStockItems(),
    outOfStock: listOutOfStockItems(),
  };
}

export const SUPPLIER_INTELLIGENCE_ENGINE_SCHEMA = {
  module: "supplierIntelligence",
  storageKeys: [
    SUPPLIER_INTELLIGENCE_STORAGE_KEY,
    "bellaflore_supplier_intelligence_registry_v1",
    "bellaflore_supplier_intelligence_prices_v1",
    "bellaflore_supplier_intelligence_stock_v1",
    "bellaflore_supplier_intelligence_contracts_v1",
    "bellaflore_supplier_intelligence_delivery_v1",
    "bellaflore_supplier_intelligence_history_v1",
    "bellaflore_supplier_intelligence_analytics_v1",
    "bellaflore_supplier_intelligence_ai_v1",
  ],
  capabilities: [
    "supplier_registry",
    "supplier_rating",
    "supplier_reliability",
    "purchase_prices",
    "stock_availability",
    "delivery_time",
    "preferred_suppliers",
    "backup_suppliers",
    "supplier_contracts",
    "supplier_analytics",
    "supplier_statistics",
    "ai_supplier_preparation",
  ],
  layers: [
    { id: "types", file: "supplierTypes.ts" },
    { id: "examples", file: "supplierExamples.ts" },
    {
      id: "registries",
      files: [
        "supplierRegistry.ts",
        "supplierPriceRegistry.ts",
        "supplierDeliveryRegistry.ts",
        "supplierHistory.ts",
      ],
    },
    { id: "engine", file: "supplierEngine.ts" },
    { id: "foundation", file: "supplierIntelligenceFoundation.ts" },
  ],
  mode: "isolated_foundation",
  wired: false,
} as const;

export function listAllSupplierFoundationCapabilities() {
  return readSupplierFoundationCapabilities();
}
