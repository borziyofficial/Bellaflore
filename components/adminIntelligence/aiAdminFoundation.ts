// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: AI hooks foundation
// ==================================================
import type {
  AdminNavigationSectionId,
  AiAdminHooks,
} from "@/components/adminIntelligence/adminIntelligenceTypes";

let aiAdminHooks: AiAdminHooks = {};

export function registerAiAdminHooks(hooks: AiAdminHooks): AiAdminHooks {
  aiAdminHooks = { ...aiAdminHooks, ...hooks };
  return aiAdminHooks;
}

export function getAiAdminHooks(): AiAdminHooks {
  return aiAdminHooks;
}

export function clearAiAdminHooks(): void {
  aiAdminHooks = {};
}

export async function summarizeAdminDashboard() {
  return (
    aiAdminHooks.summarizeAdminDashboard?.() ?? {
      summary: "",
      highlights: [],
    }
  );
}

export async function detectAdminAttention() {
  return (
    aiAdminHooks.detectAdminAttention?.() ?? {
      level: "normal" as const,
      items: [],
    }
  );
}

export async function suggestAdminAction(context: {
  section: AdminNavigationSectionId;
  metadata?: Record<string, unknown>;
}) {
  return aiAdminHooks.suggestAdminAction?.(context) ?? null;
}

export async function explainSystemState() {
  return (
    aiAdminHooks.explainSystemState?.() ?? {
      explanation: "",
      modules: [],
    }
  );
}

export async function summarizeDailyOperations() {
  return (
    aiAdminHooks.summarizeDailyOperations?.() ?? {
      summary: "",
      metrics: {},
    }
  );
}

export const AI_ADMIN_INTEGRATION_SLOTS = [
  {
    id: "summarizeAdminDashboard",
    label: "Summarize admin dashboard",
    status: "ready_for_integration" as const,
  },
  {
    id: "detectAdminAttention",
    label: "Detect admin attention items",
    status: "ready_for_integration" as const,
  },
  {
    id: "suggestAdminAction",
    label: "Suggest admin action",
    status: "ready_for_integration" as const,
  },
  {
    id: "explainSystemState",
    label: "Explain system state",
    status: "ready_for_integration" as const,
  },
  {
    id: "summarizeDailyOperations",
    label: "Summarize daily operations",
    status: "ready_for_integration" as const,
  },
];
