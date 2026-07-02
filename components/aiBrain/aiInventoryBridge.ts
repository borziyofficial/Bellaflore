// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Inventory bridge (read-only)
// ==================================================
import { buildAdminInventorySummary } from "@/components/adminIntelligence/adminInventoryBridge";

export type AiInventoryBridgeSnapshot = {
  summary: ReturnType<typeof buildAdminInventorySummary>;
  lowStockItemIds: string[];
  outOfStockItemIds: string[];
  generatedAt: string;
};

export function readAiInventorySnapshot(): AiInventoryBridgeSnapshot {
  const summary = buildAdminInventorySummary(20);

  return {
    summary,
    lowStockItemIds: summary.items
      .filter((item) => item.isLowStock && item.availableQuantity > 0)
      .map((item) => item.id),
    outOfStockItemIds: summary.items
      .filter((item) => item.availableQuantity <= 0)
      .map((item) => item.id),
    generatedAt: new Date().toISOString(),
  };
}
