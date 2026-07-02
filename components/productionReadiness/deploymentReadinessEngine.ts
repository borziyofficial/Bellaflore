// ==================================================
// SECTION: PRODUCTION READINESS
// РАЗДЕЛ: Deployment readiness engine
// ==================================================
import { buildProductionExampleRegistryState } from "@/components/productionReadiness/productionExamples";
import {
  calculateCategoryReadiness,
  getDeploymentChecklist,
  listChecklistByCategory,
} from "@/components/productionReadiness/productionChecklist";
import type {
  CategoryReadinessSummary,
  RollbackPlan,
  RollbackStep,
} from "@/components/productionReadiness/productionTypes";

export const PRODUCTION_ROLLBACK_STORAGE_KEY =
  "bellaflore_production_readiness_rollback_v1";

let inMemoryRollbackPlan: RollbackPlan | null = null;

function readRollbackPlanFromStorage(): RollbackPlan {
  if (typeof window === "undefined") {
    return inMemoryRollbackPlan ?? buildProductionExampleRegistryState().rollbackPlan;
  }

  try {
    const raw = window.localStorage.getItem(PRODUCTION_ROLLBACK_STORAGE_KEY);
    if (!raw) {
      return inMemoryRollbackPlan ?? buildProductionExampleRegistryState().rollbackPlan;
    }

    const parsed = JSON.parse(raw) as RollbackPlan;
    return parsed?.id ? parsed : buildProductionExampleRegistryState().rollbackPlan;
  } catch {
    return inMemoryRollbackPlan ?? buildProductionExampleRegistryState().rollbackPlan;
  }
}

function writeRollbackPlanToStorage(plan: RollbackPlan): void {
  inMemoryRollbackPlan = plan;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PRODUCTION_ROLLBACK_STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // In-memory fallback remains active.
  }
}

export function assessDeploymentReadiness(): CategoryReadinessSummary {
  return calculateCategoryReadiness("deployment");
}

export function listDeploymentChecklistItems() {
  return getDeploymentChecklist();
}

export function isDeploymentReady(): boolean {
  return assessDeploymentReadiness().isReady;
}

export function getRollbackPlan(): RollbackPlan {
  return readRollbackPlanFromStorage();
}

export function listRollbackSteps(): RollbackStep[] {
  return readRollbackPlanFromStorage().steps.sort((a, b) => a.order - b.order);
}

export function getRollbackStepById(stepId: string): RollbackStep | null {
  return listRollbackSteps().find((s) => s.id === stepId) ?? null;
}

export function estimateRollbackDurationMinutes(): number {
  return listRollbackSteps().reduce((sum, step) => sum + step.estimatedMinutes, 0);
}

export function registerRollbackPlan(plan: RollbackPlan): RollbackPlan {
  writeRollbackPlanToStorage(plan);
  return plan;
}

export function seedDeploymentReadiness(): RollbackPlan {
  writeRollbackPlanToStorage(buildProductionExampleRegistryState().rollbackPlan);
  return getRollbackPlan();
}

export function clearDeploymentReadiness(): void {
  inMemoryRollbackPlan = null;

  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(PRODUCTION_ROLLBACK_STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }
}

export function buildDeploymentReadinessReport() {
  const summary = assessDeploymentReadiness();
  const rollbackPlan = getRollbackPlan();

  return {
    summary,
    items: listDeploymentChecklistItems(),
    rollbackPlan,
    rollbackSteps: listRollbackSteps(),
    estimatedRollbackMinutes: estimateRollbackDurationMinutes(),
    isReady: summary.isReady,
    generatedAt: new Date().toISOString(),
  };
}

export function listDeploymentBlockers(): string[] {
  return listChecklistByCategory("deployment")
    .filter((i) => i.status === "failed" || (i.priority === "critical" && i.status === "pending"))
    .map((i) => i.title);
}
