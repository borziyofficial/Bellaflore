// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Inventory bridge (read-only)
// ==================================================
import type {
  AnalyticsTimeRange,
  InventoryAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";
import { readAiInventorySnapshot } from "@/components/aiBrain/aiInventoryBridge";
import { getAvailableStockQuantity } from "@/components/inventoryIntelligence/compositionCheckerEngine";
import { mergeInventoryStockWithAdmin } from "@/components/inventoryIntelligence/inventoryAdminStore";

export function readAnalyticsInventorySnapshot(range: AnalyticsTimeRange) {
  void range;
  return readAiInventorySnapshot();
}

export function calculateInventoryAnalyticsMetrics(
  range: AnalyticsTimeRange,
): InventoryAnalyticsMetrics {
  void range;
  const snapshot = readAiInventorySnapshot();
  const stockItems = mergeInventoryStockWithAdmin();

  const fastMovingItems = stockItems
    .filter((item) => {
      const available = getAvailableStockQuantity(item);
      return item.reservedQuantity > 0 && available <= item.lowStockThreshold;
    })
    .map((item) => item.id)
    .slice(0, 5);

  const slowMovingItems = stockItems
    .filter((item) => item.reservedQuantity === 0 && item.quantity > 10)
    .map((item) => item.id)
    .slice(0, 5);

  const replacementUsage = stockItems.filter(
    (item) => item.replacementIds.length > 0 && item.reservedQuantity > 0,
  ).length;

  let stockRiskLevel: InventoryAnalyticsMetrics["stockRiskLevel"] = "low";
  if (snapshot.outOfStockItemIds.length > 0) {
    stockRiskLevel = "critical";
  } else if (snapshot.summary.lowStockItems >= 3) {
    stockRiskLevel = "high";
  } else if (snapshot.summary.lowStockItems > 0) {
    stockRiskLevel = "medium";
  }

  return {
    lowStockItems: snapshot.summary.lowStockItems,
    outOfStockItems: snapshot.outOfStockItemIds.length,
    fastMovingItems,
    slowMovingItems,
    replacementUsage,
    stockRiskLevel,
  };
}
