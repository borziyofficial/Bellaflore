// ==================================================
// SECTION: INVENTORY INTELLIGENCE
// РАЗДЕЛ: AI hooks foundation
// ==================================================
import type {
  AiInventoryHooks,
  CompositionReplacementSuggestion,
  InventoryItem,
} from "@/components/inventoryIntelligence/inventoryIntelligenceTypes";

let aiInventoryHooks: AiInventoryHooks = {};

export function registerAiInventoryHooks(
  hooks: AiInventoryHooks,
): AiInventoryHooks {
  aiInventoryHooks = { ...aiInventoryHooks, ...hooks };
  return aiInventoryHooks;
}

export function getAiInventoryHooks(): AiInventoryHooks {
  return aiInventoryHooks;
}

export function clearAiInventoryHooks(): void {
  aiInventoryHooks = {};
}

export async function predictLowStock(): Promise<InventoryItem[]> {
  return aiInventoryHooks.predictLowStock?.() ?? [];
}

export async function suggestPurchaseOrder(): Promise<
  Array<{ stockItemId: string; suggestedQuantity: number; reason: string }>
> {
  return aiInventoryHooks.suggestPurchaseOrder?.() ?? [];
}

export async function suggestReplacement(
  missingStockItemId: string,
): Promise<CompositionReplacementSuggestion[]> {
  return aiInventoryHooks.suggestReplacement?.(missingStockItemId) ?? [];
}

export async function analyzeInventoryDemand(): Promise<
  Array<{ stockItemId: string; demandScore: number; reason: string }>
> {
  return aiInventoryHooks.analyzeInventoryDemand?.() ?? [];
}

export const AI_INVENTORY_INTEGRATION_SLOTS = [
  {
    id: "predictLowStock",
    label: "Predict low stock items",
    status: "ready_for_integration" as const,
  },
  {
    id: "suggestPurchaseOrder",
    label: "Suggest purchase order",
    status: "ready_for_integration" as const,
  },
  {
    id: "suggestReplacement",
    label: "Suggest flower replacement",
    status: "ready_for_integration" as const,
  },
  {
    id: "analyzeInventoryDemand",
    label: "Analyze inventory demand",
    status: "ready_for_integration" as const,
  },
];
