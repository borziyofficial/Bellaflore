// ==================================================
// SECTION: COURIER INTELLIGENCE
// РАЗДЕЛ: AI hooks foundation
// ==================================================
import type {
  AiCourierIntelligenceHooks,
  CourierAssignmentCandidate,
  CourierAssignmentRequest,
} from "@/components/courierIntelligence/courierIntelligenceTypes";

let aiCourierIntelligenceHooks: AiCourierIntelligenceHooks = {};

export function registerAiCourierIntelligenceHooks(
  hooks: AiCourierIntelligenceHooks,
): AiCourierIntelligenceHooks {
  aiCourierIntelligenceHooks = { ...aiCourierIntelligenceHooks, ...hooks };
  return aiCourierIntelligenceHooks;
}

export function getAiCourierIntelligenceHooks(): AiCourierIntelligenceHooks {
  return aiCourierIntelligenceHooks;
}

export function clearAiCourierIntelligenceHooks(): void {
  aiCourierIntelligenceHooks = {};
}

export async function suggestBestCourier(
  request: CourierAssignmentRequest,
): Promise<CourierAssignmentCandidate | null> {
  return aiCourierIntelligenceHooks.suggestBestCourier?.(request) ?? null;
}

export async function predictCourierDelay(
  courierId: string,
  orderId: string,
): Promise<{ delayMinutes: number; reason: string } | null> {
  return aiCourierIntelligenceHooks.predictCourierDelay?.(courierId, orderId) ?? null;
}

export async function detectCourierOverload(
  courierId: string,
): Promise<{ overloaded: boolean; reasons: string[] }> {
  return (
    aiCourierIntelligenceHooks.detectCourierOverload?.(courierId) ?? {
      overloaded: false,
      reasons: [],
    }
  );
}

export async function recommendOrderRebalancing(): Promise<
  Array<{ orderId: string; fromCourierId: string; toCourierId: string; reason: string }>
> {
  return aiCourierIntelligenceHooks.recommendOrderRebalancing?.() ?? [];
}

export const AI_COURIER_INTELLIGENCE_INTEGRATION_SLOTS = [
  {
    id: "suggestBestCourier",
    label: "Suggest best courier",
    status: "ready_for_integration" as const,
  },
  {
    id: "predictCourierDelay",
    label: "Predict courier delay",
    status: "ready_for_integration" as const,
  },
  {
    id: "detectCourierOverload",
    label: "Detect courier overload",
    status: "ready_for_integration" as const,
  },
  {
    id: "recommendOrderRebalancing",
    label: "Recommend order rebalancing",
    status: "ready_for_integration" as const,
  },
];
