// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: AI hooks foundation
// ==================================================
import type {
  AiNotificationHooks,
  NotificationEvent,
  NotificationQueueItem,
} from "@/components/notificationIntelligence/notificationIntelligenceTypes";

let aiNotificationHooks: AiNotificationHooks = {};

export function registerAiNotificationHooks(
  hooks: AiNotificationHooks,
): AiNotificationHooks {
  aiNotificationHooks = { ...aiNotificationHooks, ...hooks };
  return aiNotificationHooks;
}

export function getAiNotificationHooks(): AiNotificationHooks {
  return aiNotificationHooks;
}

export function clearAiNotificationHooks(): void {
  aiNotificationHooks = {};
}

export async function detectNotificationRisk(event: NotificationEvent) {
  return (
    aiNotificationHooks.detectNotificationRisk?.(event) ?? {
      riskLevel: "normal" as const,
      reasons: [],
    }
  );
}

export async function suggestEscalation(item: NotificationQueueItem) {
  return aiNotificationHooks.suggestEscalation?.(item) ?? null;
}

export async function summarizeNotificationFailures() {
  return (
    aiNotificationHooks.summarizeNotificationFailures?.() ?? {
      summary: "",
      failedCount: 0,
      topChannels: [],
    }
  );
}

export async function optimizeNotificationRules() {
  return aiNotificationHooks.optimizeNotificationRules?.() ?? [];
}

export const AI_NOTIFICATION_INTEGRATION_SLOTS = [
  {
    id: "detectNotificationRisk",
    label: "Detect notification risk",
    status: "ready_for_integration" as const,
  },
  {
    id: "suggestEscalation",
    label: "Suggest escalation plan",
    status: "ready_for_integration" as const,
  },
  {
    id: "summarizeNotificationFailures",
    label: "Summarize notification failures",
    status: "ready_for_integration" as const,
  },
  {
    id: "optimizeNotificationRules",
    label: "Optimize notification rules",
    status: "ready_for_integration" as const,
  },
];
