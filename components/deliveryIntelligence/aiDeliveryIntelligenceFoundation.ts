// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: AI hooks foundation
// ==================================================
import type {
  AiDeliveryIntelligenceHooks,
  DeliveryDelayRisk,
  DeliveryRoutePlan,
  DeliveryTask,
  DeliveryWindow,
} from "@/components/deliveryIntelligence/deliveryIntelligenceTypes";

let aiDeliveryIntelligenceHooks: AiDeliveryIntelligenceHooks = {};

export function registerAiDeliveryIntelligenceHooks(
  hooks: AiDeliveryIntelligenceHooks,
): AiDeliveryIntelligenceHooks {
  aiDeliveryIntelligenceHooks = { ...aiDeliveryIntelligenceHooks, ...hooks };
  return aiDeliveryIntelligenceHooks;
}

export function getAiDeliveryIntelligenceHooks(): AiDeliveryIntelligenceHooks {
  return aiDeliveryIntelligenceHooks;
}

export function clearAiDeliveryIntelligenceHooks(): void {
  aiDeliveryIntelligenceHooks = {};
}

export async function predictDeliveryDelayAi(
  task: DeliveryTask,
): Promise<DeliveryDelayRisk | null> {
  return aiDeliveryIntelligenceHooks.predictDeliveryDelay?.(task) ?? null;
}

export async function suggestBestDeliveryWindow(
  orderId: string,
  date: string,
): Promise<DeliveryWindow | null> {
  return aiDeliveryIntelligenceHooks.suggestBestDeliveryWindow?.(orderId, date) ?? null;
}

export async function suggestCourierForDelivery(
  task: DeliveryTask,
): Promise<{ courierId: string; reason: string } | null> {
  return aiDeliveryIntelligenceHooks.suggestCourierForDelivery?.(task) ?? null;
}

export async function optimizeDeliveryRoute(
  task: DeliveryTask,
): Promise<DeliveryRoutePlan | null> {
  return aiDeliveryIntelligenceHooks.optimizeDeliveryRoute?.(task) ?? null;
}

export async function detectDeliveryRisk(
  task: DeliveryTask,
): Promise<DeliveryDelayRisk | null> {
  return aiDeliveryIntelligenceHooks.detectDeliveryRisk?.(task) ?? null;
}

export async function summarizeDeliveryPerformance(date: string) {
  return (
    aiDeliveryIntelligenceHooks.summarizeDeliveryPerformance?.(date) ?? {
      summary: "",
      onTimeRate: null,
    }
  );
}

export const AI_DELIVERY_INTELLIGENCE_INTEGRATION_SLOTS = [
  {
    id: "predictDeliveryDelay",
    label: "Predict delivery delay",
    status: "ready_for_integration" as const,
  },
  {
    id: "suggestBestDeliveryWindow",
    label: "Suggest best delivery window",
    status: "ready_for_integration" as const,
  },
  {
    id: "suggestCourierForDelivery",
    label: "Suggest courier for delivery",
    status: "ready_for_integration" as const,
  },
  {
    id: "optimizeDeliveryRoute",
    label: "Optimize delivery route",
    status: "ready_for_integration" as const,
  },
  {
    id: "detectDeliveryRisk",
    label: "Detect delivery risk",
    status: "ready_for_integration" as const,
  },
  {
    id: "summarizeDeliveryPerformance",
    label: "Summarize delivery performance",
    status: "ready_for_integration" as const,
  },
];
