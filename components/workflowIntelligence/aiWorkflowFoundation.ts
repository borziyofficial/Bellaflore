// ==================================================
// SECTION: WORKFLOW INTELLIGENCE
// РАЗДЕЛ: AI hooks foundation
// ==================================================
import type {
  AiWorkflowHooks,
  Workflow,
} from "@/components/workflowIntelligence/workflowIntelligenceTypes";

let aiWorkflowHooks: AiWorkflowHooks = {};

export function registerAiWorkflowHooks(
  hooks: AiWorkflowHooks,
): AiWorkflowHooks {
  aiWorkflowHooks = { ...aiWorkflowHooks, ...hooks };
  return aiWorkflowHooks;
}

export function getAiWorkflowHooks(): AiWorkflowHooks {
  return aiWorkflowHooks;
}

export function clearAiWorkflowHooks(): void {
  aiWorkflowHooks = {};
}

export async function detectWorkflowRisk(workflow: Workflow) {
  return (
    aiWorkflowHooks.detectWorkflowRisk?.(workflow) ?? {
      level: "low" as const,
      reasons: [],
    }
  );
}

export async function suggestNextWorkflowAction(workflow: Workflow) {
  return aiWorkflowHooks.suggestNextWorkflowAction?.(workflow) ?? null;
}

export async function explainWorkflowFailure(workflow: Workflow) {
  return (
    aiWorkflowHooks.explainWorkflowFailure?.(workflow) ?? {
      summary: "",
      recommendations: [],
    }
  );
}

export async function optimizeWorkflowSequence(workflowType: string) {
  return aiWorkflowHooks.optimizeWorkflowSequence?.(workflowType) ?? [];
}

export async function summarizeWorkflowPerformance(date: string) {
  return (
    aiWorkflowHooks.summarizeWorkflowPerformance?.(date) ?? {
      summary: "",
      completedCount: 0,
      failedCount: 0,
    }
  );
}

export const AI_WORKFLOW_INTEGRATION_SLOTS = [
  {
    id: "detectWorkflowRisk",
    label: "Detect workflow risk",
    status: "ready_for_integration" as const,
  },
  {
    id: "suggestNextWorkflowAction",
    label: "Suggest next workflow action",
    status: "ready_for_integration" as const,
  },
  {
    id: "explainWorkflowFailure",
    label: "Explain workflow failure",
    status: "ready_for_integration" as const,
  },
  {
    id: "optimizeWorkflowSequence",
    label: "Optimize workflow sequence",
    status: "ready_for_integration" as const,
  },
  {
    id: "summarizeWorkflowPerformance",
    label: "Summarize workflow performance",
    status: "ready_for_integration" as const,
  },
];
