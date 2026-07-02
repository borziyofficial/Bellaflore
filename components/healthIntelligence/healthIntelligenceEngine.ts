// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import { buildHealthAdminDashboardPayload } from "@/components/healthIntelligence/healthAdminFoundation";
import { buildHealthAiBrainPayload } from "@/components/healthIntelligence/healthAiBrainFoundation";
import { runHealthAdminChecks } from "@/components/healthIntelligence/healthAdminBridge";
import { runHealthAiBrainChecks } from "@/components/healthIntelligence/healthAiBrainBridge";
import { runHealthAnalyticsChecks } from "@/components/healthIntelligence/healthAnalyticsBridge";
import { runHealthCatalogChecks } from "@/components/healthIntelligence/healthCatalogBridge";
import { runHealthCourierChecks, detectHealthCourierIssues } from "@/components/healthIntelligence/healthCourierBridge";
import { runHealthDeliveryChecks, detectHealthDeliveryIssues } from "@/components/healthIntelligence/healthDeliveryBridge";
import { runHealthInventoryChecks, detectHealthInventoryIssues } from "@/components/healthIntelligence/healthInventoryBridge";
import { runHealthNotificationChecks, detectHealthNotificationIssues } from "@/components/healthIntelligence/healthNotificationBridge";
import { runHealthOrderChecks, detectHealthOrderIssues } from "@/components/healthIntelligence/healthOrderBridge";
import { runHealthTelegramChecks } from "@/components/healthIntelligence/healthTelegramBridge";
import { runHealthWorkflowChecks, detectHealthWorkflowIssues } from "@/components/healthIntelligence/healthWorkflowBridge";
import {
  createHealthIncident,
  getExampleHealthIncident,
  listHealthIncidents,
} from "@/components/healthIntelligence/healthIncidentFoundation";
import { buildHealthNotificationEventsFromSnapshot } from "@/components/healthIntelligence/healthNotificationFoundation";
import {
  buildSystemHealthSummary,
  calculateSystemHealthScore,
  scoreToHealthStatus,
} from "@/components/healthIntelligence/healthScoreEngine";
import type {
  HealthCheckResult,
  HealthIssue,
  HealthMetric,
  HealthModuleStatus,
  HealthReport,
  HealthSnapshot,
  HealthStatus,
  SystemHealthSummary,
} from "@/components/healthIntelligence/healthIntelligenceTypes";

const MODULE_TITLES: Record<HealthModuleStatus["moduleId"], string> = {
  orderIntelligence: "Orders",
  inventoryIntelligence: "Inventory",
  courierIntelligence: "Couriers",
  deliveryIntelligence: "Delivery",
  notificationIntelligence: "Notifications",
  workflowIntelligence: "Workflow",
  adminIntelligence: "Admin",
  aiBrain: "AI Brain",
  analyticsIntelligence: "Analytics",
  catalogEngine: "Catalog",
  telegram: "Telegram",
};

function groupResultsByModule(
  results: HealthCheckResult[],
): Map<HealthModuleStatus["moduleId"], HealthCheckResult[]> {
  const map = new Map<HealthModuleStatus["moduleId"], HealthCheckResult[]>();

  for (const result of results) {
    const existing = map.get(result.moduleId) ?? [];
    existing.push(result);
    map.set(result.moduleId, existing);
  }

  return map;
}

function moduleScoreFromResults(results: HealthCheckResult[]): number {
  if (results.length === 0) {
    return 100;
  }

  let penalty = 0;
  for (const result of results) {
    if (!result.passed) {
      penalty += result.severity === "critical" ? 25 : result.severity === "high" ? 12 : 5;
    }
  }

  return Math.max(0, 100 - penalty);
}

function worstStatusFromResults(results: HealthCheckResult[]): HealthStatus {
  const failed = results.filter((result) => !result.passed);
  if (failed.some((result) => result.status === "offline")) {
    return "offline";
  }

  if (failed.some((result) => result.status === "critical")) {
    return "critical";
  }

  if (failed.some((result) => result.status === "degraded")) {
    return "degraded";
  }

  if (failed.some((result) => result.status === "warning")) {
    return "warning";
  }

  return failed.length > 0 ? "unknown" : "healthy";
}

export function runHealthChecks(): HealthCheckResult[] {
  return [
    ...runHealthOrderChecks(),
    ...runHealthInventoryChecks(),
    ...runHealthCourierChecks(),
    ...runHealthDeliveryChecks(),
    ...runHealthNotificationChecks(),
    ...runHealthWorkflowChecks(),
    ...runHealthAdminChecks(),
    ...runHealthAiBrainChecks(),
    ...runHealthAnalyticsChecks(),
    ...runHealthCatalogChecks(),
    ...runHealthTelegramChecks(),
  ];
}

export function detectHealthIssues(
  checkResults: HealthCheckResult[] = runHealthChecks(),
): HealthIssue[] {
  return [
    ...detectHealthOrderIssues(checkResults.filter((r) => r.moduleId === "orderIntelligence")),
    ...detectHealthInventoryIssues(checkResults.filter((r) => r.moduleId === "inventoryIntelligence")),
    ...detectHealthCourierIssues(checkResults.filter((r) => r.moduleId === "courierIntelligence")),
    ...detectHealthDeliveryIssues(checkResults.filter((r) => r.moduleId === "deliveryIntelligence")),
    ...detectHealthNotificationIssues(checkResults.filter((r) => r.moduleId === "notificationIntelligence")),
    ...detectHealthWorkflowIssues(checkResults.filter((r) => r.moduleId === "workflowIntelligence")),
    ...checkResults
      .filter(
        (result) =>
          !result.passed &&
          ![
            "orderIntelligence",
            "inventoryIntelligence",
            "courierIntelligence",
            "deliveryIntelligence",
            "notificationIntelligence",
            "workflowIntelligence",
          ].includes(result.moduleId),
      )
      .map((result) => ({
        id: `issue-${result.checkId}`,
        moduleId: result.moduleId,
        checkId: result.checkId,
        status: result.status,
        severity: result.severity,
        title: result.checkId,
        description: result.message,
        detectedAt: result.checkedAt,
        resourceType: null,
        resourceId: null,
      })),
  ];
}

export function summarizeModuleHealth(
  checkResults: HealthCheckResult[] = runHealthChecks(),
  issues: HealthIssue[] = detectHealthIssues(checkResults),
): HealthModuleStatus[] {
  const grouped = groupResultsByModule(checkResults);
  const now = new Date().toISOString();

  return [...grouped.entries()].map(([moduleId, results]) => {
    const moduleIssues = issues.filter((issue) => issue.moduleId === moduleId);
    const passedChecks = results.filter((result) => result.passed).length;

    return {
      moduleId,
      title: MODULE_TITLES[moduleId],
      status: worstStatusFromResults(results),
      score: moduleScoreFromResults(results),
      checkCount: results.length,
      passedChecks,
      failedChecks: results.length - passedChecks,
      issues: moduleIssues,
      lastCheckedAt: now,
    };
  });
}

function buildHealthMetrics(
  checkResults: HealthCheckResult[],
  moduleStatuses: HealthModuleStatus[],
): HealthMetric[] {
  return moduleStatuses.map((module) => ({
    id: `metric-${module.moduleId}-score`,
    label: `${module.title} health score`,
    value: module.score,
    unit: "score",
    moduleId: module.moduleId,
    status: module.status,
  })).concat(
    checkResults
      .filter((result) => !result.passed)
      .map((result) => ({
        id: `metric-${result.checkId}`,
        label: result.checkId,
        value: 1,
        unit: "issue",
        moduleId: result.moduleId,
        status: result.status,
      })),
  );
}

export function collectHealthSnapshot(): HealthSnapshot {
  const checkResults = runHealthChecks();
  const issues = detectHealthIssues(checkResults);
  const moduleStatuses = summarizeModuleHealth(checkResults, issues);
  const systemScore = calculateSystemHealthScore(checkResults);
  const openIncidents = listHealthIncidents().filter(
    (incident) => incident.status !== "resolved",
  ).length;

  return {
    id: `health-snapshot-${Date.now()}`,
    systemStatus: scoreToHealthStatus(systemScore),
    systemScore,
    collectedAt: new Date().toISOString(),
    moduleStatuses,
    checkResults,
    issues,
    metrics: buildHealthMetrics(checkResults, moduleStatuses),
    openIncidents,
  };
}

export function getSystemHealthStatus(): SystemHealthSummary {
  const snapshot = collectHealthSnapshot();
  return buildSystemHealthSummary(snapshot.checkResults, snapshot.moduleStatuses);
}

export function createHealthReport(
  snapshot: HealthSnapshot = collectHealthSnapshot(),
): HealthReport {
  const criticalIssues = snapshot.issues.filter(
    (issue) => issue.severity === "critical" || issue.status === "critical",
  );

  const warnings = snapshot.issues.filter(
    (issue) =>
      issue.severity === "high" ||
      issue.severity === "medium" ||
      issue.status === "warning" ||
      issue.status === "degraded",
  );

  return {
    id: `health-report-${Date.now()}`,
    title: "System Health Report",
    systemStatus: snapshot.systemStatus,
    systemScore: snapshot.systemScore,
    summary: `Health score ${snapshot.systemScore} · ${criticalIssues.length} critical · ${warnings.length} warnings`,
    moduleStatuses: snapshot.moduleStatuses,
    criticalIssues,
    warnings,
    incidents: listHealthIncidents().filter((incident) => incident.status !== "resolved"),
    generatedAt: new Date().toISOString(),
  };
}

export function autoCreateIncidentsFromIssues(
  issues: HealthIssue[],
): void {
  for (const issue of issues) {
    if (issue.severity === "critical" || issue.severity === "high") {
      createHealthIncident({ issue });
    }
  }
}

export function getHealthIntelligenceExample() {
  const snapshot = collectHealthSnapshot();
  const report = createHealthReport(snapshot);
  const exampleIncident = getExampleHealthIncident();

  return {
    snapshot,
    systemHealth: getSystemHealthStatus(),
    report,
    exampleIncident,
    adminDashboard: buildHealthAdminDashboardPayload(snapshot),
    aiBrainPayload: buildHealthAiBrainPayload(snapshot),
    notificationEvents: buildHealthNotificationEventsFromSnapshot(snapshot),
  };
}

export function runHealthIntelligenceEngine() {
  const snapshot = collectHealthSnapshot();

  return {
    snapshot,
    systemHealth: getSystemHealthStatus(),
    report: createHealthReport(snapshot),
    adminDashboard: buildHealthAdminDashboardPayload(snapshot),
    aiBrainPayload: buildHealthAiBrainPayload(snapshot),
    notificationEvents: buildHealthNotificationEventsFromSnapshot(snapshot),
    generatedAt: new Date().toISOString(),
  };
}

// Re-export core API
export {
  calculateSystemHealthScore,
  scoreToHealthStatus,
  buildSystemHealthSummary,
};
