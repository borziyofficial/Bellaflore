// ==================================================
// SECTION: PRODUCTION READINESS
// РАЗДЕЛ: Launch readiness engine (core orchestrator)
// ==================================================
import { buildBackupReadinessReport } from "@/components/productionReadiness/backupReadinessEngine";
import { buildDeploymentReadinessReport } from "@/components/productionReadiness/deploymentReadinessEngine";
import { buildEnvironmentReadinessReport } from "@/components/productionReadiness/environmentReadinessEngine";
import { buildProductionExampleRegistryState } from "@/components/productionReadiness/productionExamples";
import {
  calculateCategoryReadiness,
  calculateOverallReadinessPercent,
  getAdminChecklist,
  getLaunchChecklist,
  getPaymentChecklist,
  getSecurityChecklist,
  getTelegramChecklist,
  listAllCategorySummaries,
  listChecklistItems,
  listFailedCriticalItems,
  listPendingCriticalItems,
  seedProductionChecklist,
} from "@/components/productionReadiness/productionChecklist";
import { buildPerformanceReadinessReport } from "@/components/productionReadiness/performanceReadinessEngine";
import { seedDeploymentReadiness } from "@/components/productionReadiness/deploymentReadinessEngine";
import type {
  FutureLaunchReport,
  GoNoGoAssessment,
  GoNoGoDecision,
  ProductionReadinessSnapshot,
  ProductionReadOnlySummary,
  ProductionRiskFactor,
  ProductionRiskLevel,
  ProductionRiskScore,
  ProductionStatistics,
} from "@/components/productionReadiness/productionTypes";

export const PRODUCTION_READINESS_STORAGE_KEY =
  "bellaflore_production_readiness_v1";

export const PRODUCTION_RISK_STORAGE_KEY =
  "bellaflore_production_readiness_risk_v1";

export const PRODUCTION_LAUNCH_REPORT_STORAGE_KEY =
  "bellaflore_production_readiness_launch_report_v1";

let inMemoryRiskFactors: ProductionRiskFactor[] | null = null;
let inMemoryLaunchReport: FutureLaunchReport | null = null;

function readRiskFactorsFromStorage(): ProductionRiskFactor[] {
  if (typeof window === "undefined") {
    return inMemoryRiskFactors ?? buildProductionExampleRegistryState().riskFactors;
  }

  try {
    const raw = window.localStorage.getItem(PRODUCTION_RISK_STORAGE_KEY);
    if (!raw) {
      return inMemoryRiskFactors ?? buildProductionExampleRegistryState().riskFactors;
    }

    const parsed = JSON.parse(raw) as ProductionRiskFactor[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildProductionExampleRegistryState().riskFactors;
  } catch {
    return inMemoryRiskFactors ?? buildProductionExampleRegistryState().riskFactors;
  }
}

function writeRiskFactorsToStorage(factors: ProductionRiskFactor[]): void {
  inMemoryRiskFactors = factors;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PRODUCTION_RISK_STORAGE_KEY, JSON.stringify(factors));
  } catch {
    // In-memory fallback remains active.
  }
}

function readLaunchReportFromStorage(): FutureLaunchReport {
  if (typeof window === "undefined") {
    return inMemoryLaunchReport ?? buildProductionExampleRegistryState().futureLaunchReport;
  }

  try {
    const raw = window.localStorage.getItem(PRODUCTION_LAUNCH_REPORT_STORAGE_KEY);
    if (!raw) {
      return inMemoryLaunchReport ?? buildProductionExampleRegistryState().futureLaunchReport;
    }

    const parsed = JSON.parse(raw) as FutureLaunchReport;
    return parsed?.id ? parsed : buildProductionExampleRegistryState().futureLaunchReport;
  } catch {
    return inMemoryLaunchReport ?? buildProductionExampleRegistryState().futureLaunchReport;
  }
}

function writeLaunchReportToStorage(report: FutureLaunchReport): void {
  inMemoryLaunchReport = report;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PRODUCTION_LAUNCH_REPORT_STORAGE_KEY, JSON.stringify(report));
  } catch {
    // In-memory fallback remains active.
  }
}

function resolveRiskLevel(normalizedPercent: number): ProductionRiskLevel {
  if (normalizedPercent >= 80) {
    return "critical";
  }

  if (normalizedPercent >= 60) {
    return "high";
  }

  if (normalizedPercent >= 40) {
    return "elevated";
  }

  if (normalizedPercent >= 20) {
    return "moderate";
  }

  return "low";
}

export function calculateProductionRiskScore(): ProductionRiskScore {
  const factors = readRiskFactorsFromStorage();
  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  const maxScore = factors.reduce((sum, f) => sum + f.weight, 0);
  const normalizedPercent =
    maxScore > 0 ? Math.round((totalScore / maxScore) * 1000) / 10 : 0;

  return {
    totalScore,
    maxScore,
    normalizedPercent,
    level: resolveRiskLevel(normalizedPercent),
    factors,
    calculatedAt: new Date().toISOString(),
  };
}

export function assessGoNoGoDecision(): GoNoGoAssessment {
  const failedCritical = listFailedCriticalItems();
  const pendingCritical = listPendingCriticalItems();
  const risk = calculateProductionRiskScore();
  const readiness = calculateOverallReadinessPercent();

  let decision: GoNoGoDecision = "pending";
  const blockers: string[] = [];
  const conditions: string[] = [];

  if (failedCritical.length > 0) {
    decision = "no_go";
    blockers.push(...failedCritical.map((i) => i.title));
  } else if (pendingCritical.length > 0) {
    decision = "conditional_go";
    conditions.push(
      ...pendingCritical.map((i) => `Complete: ${i.title}`),
    );
  } else if (readiness >= 90 && risk.level === "low") {
    decision = "go";
  } else if (readiness >= 70) {
    decision = "conditional_go";
    conditions.push("Overall readiness below 90% — review pending items");
  } else {
    decision = "no_go";
    blockers.push("Overall readiness below 70%");
  }

  if (risk.level === "critical" || risk.level === "high") {
    if (decision === "go") {
      decision = "conditional_go";
    }

    conditions.push(`Production risk level: ${risk.level}`);
  }

  const rationale =
    decision === "go"
      ? "All critical checks passed and risk is acceptable"
      : decision === "no_go"
        ? "Critical blockers prevent launch"
        : decision === "conditional_go"
          ? "Launch possible after resolving conditions"
          : "Assessment incomplete — foundation mode";

  return {
    decision,
    rationale,
    blockers,
    conditions,
    criticalFailures: failedCritical.length,
    pendingCritical: pendingCritical.length,
    assessedAt: new Date().toISOString(),
  };
}

export function getFutureLaunchReport(): FutureLaunchReport {
  return readLaunchReportFromStorage();
}

export function registerFutureLaunchReport(report: FutureLaunchReport): FutureLaunchReport {
  writeLaunchReportToStorage(report);
  return report;
}

export function registerProductionRiskFactor(factor: ProductionRiskFactor): ProductionRiskFactor {
  const factors = readRiskFactorsFromStorage();
  const index = factors.findIndex((f) => f.id === factor.id);
  const next =
    index === -1
      ? [...factors, factor]
      : factors.map((f, i) => (i === index ? factor : f));

  writeRiskFactorsToStorage(next);
  return factor;
}

export function seedLaunchReadiness(): void {
  seedProductionChecklist();
  seedDeploymentReadiness();
  writeRiskFactorsToStorage(buildProductionExampleRegistryState().riskFactors);
  writeLaunchReportToStorage(buildProductionExampleRegistryState().futureLaunchReport);
}

export function calculateProductionStatistics(): ProductionStatistics {
  const items = listChecklistItems();
  const passed = items.filter((i) => i.status === "passed").length;
  const failed = items.filter((i) => i.status === "failed").length;
  const pending = items.filter((i) => i.status === "pending").length;
  const summaries = listAllCategorySummaries();
  const risk = calculateProductionRiskScore();
  const goNoGo = assessGoNoGoDecision();

  return {
    totalChecklistItems: items.length,
    passedItems: passed,
    failedItems: failed,
    pendingItems: pending,
    overallReadinessPercent: calculateOverallReadinessPercent(),
    categoriesReady: summaries.filter((s) => s.isReady).length,
    categoriesTotal: summaries.length,
    riskLevel: risk.level,
    goNoGoDecision: goNoGo.decision,
    calculatedAt: new Date().toISOString(),
  };
}

export function buildProductionReadinessSnapshot(
  at: Date = new Date(),
): ProductionReadinessSnapshot {
  return {
    checklists: listChecklistItems(),
    categorySummaries: listAllCategorySummaries(),
    rollbackPlan: buildDeploymentReadinessReport().rollbackPlan,
    riskScore: calculateProductionRiskScore(),
    goNoGo: assessGoNoGoDecision(),
    futureLaunchReport: getFutureLaunchReport(),
    statistics: calculateProductionStatistics(),
    generatedAt: at.toISOString(),
  };
}

export function initializeProductionReadiness(): ProductionReadinessSnapshot {
  seedLaunchReadiness();
  return buildProductionReadinessSnapshot();
}

export function getProductionReadinessExample() {
  return buildProductionExampleRegistryState().checklists[0];
}

export function getProductionReadOnlySummary(): ProductionReadOnlySummary {
  const statistics = calculateProductionStatistics();

  return {
    checklistCount: statistics.totalChecklistItems,
    readinessPercent: statistics.overallReadinessPercent,
    riskLevel: statistics.riskLevel,
    goNoGoDecision: statistics.goNoGoDecision,
  };
}

export function readProductionFoundationCapabilities() {
  return {
    launchChecklist: getLaunchChecklist(),
    environmentChecklist: buildEnvironmentReadinessReport(),
    deploymentChecklist: buildDeploymentReadinessReport(),
    backupChecklist: buildBackupReadinessReport(),
    securityChecklist: getSecurityChecklist(),
    monitoringChecklist: buildPerformanceReadinessReport().monitoringItems,
    performanceChecklist: buildPerformanceReadinessReport().performanceItems,
    seoChecklist: buildPerformanceReadinessReport().seoItems,
    telegramChecklist: getTelegramChecklist(),
    paymentChecklist: getPaymentChecklist(),
    adminChecklist: getAdminChecklist(),
    rollbackPlan: buildDeploymentReadinessReport().rollbackPlan,
    productionRiskScore: calculateProductionRiskScore(),
    goNoGoDecision: assessGoNoGoDecision(),
    futureLaunchReport: getFutureLaunchReport(),
    launchReadiness: calculateCategoryReadiness("launch"),
    productionStatistics: calculateProductionStatistics(),
  };
}

export const PRODUCTION_READINESS_ENGINE_SCHEMA = {
  module: "productionReadiness",
  storageKeys: [
    PRODUCTION_READINESS_STORAGE_KEY,
    "bellaflore_production_readiness_checklist_v1",
    "bellaflore_production_readiness_rollback_v1",
    "bellaflore_production_readiness_risk_v1",
    "bellaflore_production_readiness_launch_report_v1",
  ],
  capabilities: [
    "launch_checklist",
    "environment_checklist",
    "deployment_checklist",
    "backup_checklist",
    "security_checklist",
    "monitoring_checklist",
    "performance_checklist",
    "seo_checklist",
    "telegram_checklist",
    "payment_checklist",
    "admin_checklist",
    "rollback_plan",
    "production_risk_score",
    "go_no_go_decision",
    "future_launch_report",
  ],
  layers: [
    { id: "types", file: "productionTypes.ts" },
    { id: "examples", file: "productionExamples.ts" },
    { id: "checklist", file: "productionChecklist.ts" },
    {
      id: "engines",
      files: [
        "launchReadinessEngine.ts",
        "environmentReadinessEngine.ts",
        "deploymentReadinessEngine.ts",
        "backupReadinessEngine.ts",
        "performanceReadinessEngine.ts",
      ],
    },
    { id: "foundation", file: "productionReadinessFoundation.ts" },
  ],
  mode: "isolated_foundation",
  wired: false,
  chapter: "architecture_foundation_chapter_1",
  chapterComplete: true,
} as const;

export function listAllProductionFoundationCapabilities() {
  return readProductionFoundationCapabilities();
}
