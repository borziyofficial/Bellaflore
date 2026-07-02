// ==================================================
// SECTION: ORDER INTELLIGENCE
// РАЗДЕЛ: AI hooks foundation
// ==================================================
import type { AiOrderIntelligenceHooks } from "@/components/orderIntelligence/orderIntelligenceTypes";

let aiOrderIntelligenceHooks: AiOrderIntelligenceHooks = {};

export function registerAiOrderIntelligenceHooks(
  hooks: AiOrderIntelligenceHooks,
): AiOrderIntelligenceHooks {
  aiOrderIntelligenceHooks = { ...aiOrderIntelligenceHooks, ...hooks };
  return aiOrderIntelligenceHooks;
}

export function getAiOrderIntelligenceHooks(): AiOrderIntelligenceHooks {
  return aiOrderIntelligenceHooks;
}

export function clearAiOrderIntelligenceHooks(): void {
  aiOrderIntelligenceHooks = {};
}

export async function analyzeOrderDemand() {
  return aiOrderIntelligenceHooks.analyzeOrderDemand?.() ?? [];
}

export async function detectProblemOrder(orderId: string) {
  return (
    aiOrderIntelligenceHooks.detectProblemOrder?.(orderId) ?? {
      isProblem: false,
      reasons: [],
    }
  );
}

export async function suggestCourier(orderId: string) {
  return aiOrderIntelligenceHooks.suggestCourier?.(orderId) ?? null;
}

export async function predictDeliveryDelay(orderId: string) {
  return aiOrderIntelligenceHooks.predictDeliveryDelay?.(orderId) ?? null;
}

export async function summarizeDailyOrders(date: string) {
  return (
    aiOrderIntelligenceHooks.summarizeDailyOrders?.(date) ?? {
      summary: "",
      highlights: [],
    }
  );
}

export const AI_ORDER_INTELLIGENCE_INTEGRATION_SLOTS = [
  {
    id: "analyzeOrderDemand",
    label: "Analyze order demand",
    status: "ready_for_integration" as const,
  },
  {
    id: "detectProblemOrder",
    label: "Detect problem orders",
    status: "ready_for_integration" as const,
  },
  {
    id: "suggestCourier",
    label: "Suggest courier assignment",
    status: "ready_for_integration" as const,
  },
  {
    id: "predictDeliveryDelay",
    label: "Predict delivery delay",
    status: "ready_for_integration" as const,
  },
  {
    id: "summarizeDailyOrders",
    label: "Summarize daily orders",
    status: "ready_for_integration" as const,
  },
];
