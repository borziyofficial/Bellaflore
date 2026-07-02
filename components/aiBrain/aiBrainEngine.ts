// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Core engine
// ==================================================
import { assertAiBrainReadOnly } from "@/components/aiBrain/aiBrainActionSafety";
import { readAiAdminSnapshot } from "@/components/aiBrain/aiAdminBridge";
import { readAiCatalogSnapshot } from "@/components/aiBrain/aiCatalogBridge";
import { readAiCourierSnapshot } from "@/components/aiBrain/aiCourierBridge";
import { readAiDeliverySnapshot } from "@/components/aiBrain/aiDeliveryBridge";
import { readAiInventorySnapshot } from "@/components/aiBrain/aiInventoryBridge";
import { readAiNotificationSnapshot } from "@/components/aiBrain/aiNotificationBridge";
import { readAiOrderSnapshot } from "@/components/aiBrain/aiOrderBridge";
import { readAiWorkflowSnapshot } from "@/components/aiBrain/aiWorkflowBridge";
import { generateAiBrainRecommendations } from "@/components/aiBrain/aiBrainRecommendationEngine";
import {
  dailyOperationsReport,
  generateAllAiBrainReports,
} from "@/components/aiBrain/aiBrainReportEngine";
import { detectAiBrainRisks } from "@/components/aiBrain/aiBrainRiskEngine";
import {
  detectAiBrainSignals,
  type AiBrainBridgeSnapshots,
} from "@/components/aiBrain/aiBrainSignalEngine";
import type {
  AiBrainAnalysisResult,
  AiBrainContext,
  AiBrainInsight,
  AiBrainModuleId,
  AiBrainModuleStatus,
  AiBrainPriority,
  AiBrainRecommendation,
  AiBrainReport,
} from "@/components/aiBrain/aiBrainTypes";

function readAllBridgeSnapshots(): AiBrainBridgeSnapshots {
  assertAiBrainReadOnly();

  return {
    orders: readAiOrderSnapshot(),
    inventory: readAiInventorySnapshot(),
    couriers: readAiCourierSnapshot(),
    delivery: readAiDeliverySnapshot(),
    notifications: readAiNotificationSnapshot(),
    workflow: readAiWorkflowSnapshot(),
    admin: readAiAdminSnapshot(),
    catalog: readAiCatalogSnapshot(),
  };
}

function resolveModuleStatus(
  moduleId: AiBrainModuleId,
  title: string,
  attentionCount: number,
  summary: string,
): AiBrainModuleStatus {
  let status: AiBrainModuleStatus["status"] = "healthy";
  let priority: AiBrainPriority = "low";

  if (attentionCount >= 5) {
    status = "degraded";
    priority = "critical";
  } else if (attentionCount >= 2) {
    status = "attention";
    priority = "high";
  } else if (attentionCount >= 1) {
    status = "attention";
    priority = "normal";
  }

  return {
    moduleId,
    title,
    status,
    priority,
    attentionCount,
    summary,
    lastCheckedAt: new Date().toISOString(),
  };
}

function buildModuleStatuses(snapshots: AiBrainBridgeSnapshots): AiBrainModuleStatus[] {
  return [
    resolveModuleStatus(
      "orderIntelligence",
      "Order Intelligence",
      snapshots.orders.summary.newOrders + snapshots.orders.summary.inProgressOrders,
      `Orders total ${snapshots.orders.summary.totalOrders}`,
    ),
    resolveModuleStatus(
      "inventoryIntelligence",
      "Inventory Intelligence",
      snapshots.inventory.summary.lowStockItems +
        snapshots.inventory.outOfStockItemIds.length,
      `Low stock ${snapshots.inventory.summary.lowStockItems}`,
    ),
    resolveModuleStatus(
      "courierIntelligence",
      "Courier Intelligence",
      snapshots.couriers.overloadedCourierIds.length +
        snapshots.couriers.summary.blockedCouriers,
      `Available couriers ${snapshots.couriers.summary.availableCouriers}`,
    ),
    resolveModuleStatus(
      "deliveryIntelligence",
      "Delivery Intelligence",
      snapshots.delivery.summary.delayedTasks +
        snapshots.delivery.summary.activeTasks,
      `Active deliveries ${snapshots.delivery.summary.activeTasks}`,
    ),
    resolveModuleStatus(
      "notificationIntelligence",
      "Notification Intelligence",
      snapshots.notifications.summary.pendingNotifications +
        snapshots.notifications.summary.failedNotifications,
      `Failed notifications ${snapshots.notifications.summary.failedNotifications}`,
    ),
    resolveModuleStatus(
      "workflowIntelligence",
      "Workflow Intelligence",
      snapshots.workflow.summary.failedWorkflows +
        snapshots.workflow.summary.waitingWorkflows,
      `Running workflows ${snapshots.workflow.summary.runningWorkflows}`,
    ),
    resolveModuleStatus(
      "adminIntelligence",
      "Admin Intelligence",
      snapshots.admin.attentionItemsCount,
      `Attention items ${snapshots.admin.attentionItemsCount}`,
    ),
    resolveModuleStatus(
      "catalogEngine",
      "Catalog Engine",
      snapshots.catalog.unavailableProductIds.length,
      `Published products ${snapshots.catalog.publishedProducts}`,
    ),
  ];
}

function buildInsights(
  snapshots: AiBrainBridgeSnapshots,
  signalCount: number,
  riskCount: number,
): AiBrainInsight[] {
  const now = new Date().toISOString();
  const insights: AiBrainInsight[] = [];

  if (snapshots.orders.summary.newOrders > 0) {
    insights.push({
      id: `insight-orders-${now}`,
      category: "operations",
      priority: snapshots.orders.summary.newOrders >= 3 ? "high" : "normal",
      title: "Новые заказы требуют внимания",
      summary: `${snapshots.orders.summary.newOrders} заказ(ов) в статусе new`,
      moduleId: "orderIntelligence",
      createdAt: now,
    });
  }

  if (snapshots.inventory.outOfStockItemIds.length > 0) {
    insights.push({
      id: `insight-inventory-${now}`,
      category: "inventory",
      priority: "critical",
      title: "Критичные позиции склада",
      summary: `${snapshots.inventory.outOfStockItemIds.length} позиций out of stock`,
      moduleId: "inventoryIntelligence",
      createdAt: now,
    });
  }

  if (signalCount > 0 || riskCount > 0) {
    insights.push({
      id: `insight-system-${now}`,
      category: "system",
      priority: riskCount >= 3 ? "high" : "normal",
      title: "Системный анализ завершён",
      summary: `Signals: ${signalCount}, risks: ${riskCount}`,
      moduleId: "adminIntelligence",
      createdAt: now,
    });
  }

  return insights;
}

export function collectSystemContext(): AiBrainContext {
  const snapshots = readAllBridgeSnapshots();
  const moduleStatuses = buildModuleStatuses(snapshots);
  const attentionScore = moduleStatuses.reduce(
    (total, module) => total + module.attentionCount,
    0,
  );

  return {
    collectedAt: new Date().toISOString(),
    moduleStatuses,
    moduleSnapshots: {
      orderIntelligence: snapshots.orders as unknown as Record<string, unknown>,
      inventoryIntelligence: snapshots.inventory as unknown as Record<
        string,
        unknown
      >,
      courierIntelligence: snapshots.couriers as unknown as Record<string, unknown>,
      deliveryIntelligence: snapshots.delivery as unknown as Record<string, unknown>,
      notificationIntelligence: snapshots.notifications as unknown as Record<
        string,
        unknown
      >,
      workflowIntelligence: snapshots.workflow as unknown as Record<string, unknown>,
      adminIntelligence: snapshots.admin as unknown as Record<string, unknown>,
      catalogEngine: snapshots.catalog as unknown as Record<string, unknown>,
    },
    signalCount: 0,
    riskCount: 0,
    attentionScore,
  };
}

export function analyzeSystemState(): AiBrainAnalysisResult {
  const snapshots = readAllBridgeSnapshots();
  const signals = detectAiBrainSignals(snapshots);
  const risks = detectAiBrainRisks(signals);
  const recommendations = generateAiBrainRecommendations(
    snapshots,
    signals,
    risks,
  );
  const moduleStatuses = buildModuleStatuses(snapshots);
  const attentionScore = moduleStatuses.reduce(
    (total, module) => total + module.attentionCount,
    0,
  );

  const context: AiBrainContext = {
    collectedAt: new Date().toISOString(),
    moduleStatuses,
    moduleSnapshots: {
      orderIntelligence: snapshots.orders as unknown as Record<string, unknown>,
      inventoryIntelligence: snapshots.inventory as unknown as Record<
        string,
        unknown
      >,
      courierIntelligence: snapshots.couriers as unknown as Record<string, unknown>,
      deliveryIntelligence: snapshots.delivery as unknown as Record<string, unknown>,
      notificationIntelligence: snapshots.notifications as unknown as Record<
        string,
        unknown
      >,
      workflowIntelligence: snapshots.workflow as unknown as Record<string, unknown>,
      adminIntelligence: snapshots.admin as unknown as Record<string, unknown>,
      catalogEngine: snapshots.catalog as unknown as Record<string, unknown>,
    },
    signalCount: signals.length,
    riskCount: risks.length,
    attentionScore,
  };

  return {
    context,
    signals,
    risks,
    insights: buildInsights(snapshots, signals.length, risks.length),
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

export function detectRisks() {
  const snapshots = readAllBridgeSnapshots();
  const signals = detectAiBrainSignals(snapshots);
  return detectAiBrainRisks(signals);
}

export function generateRecommendations(): AiBrainRecommendation[] {
  const snapshots = readAllBridgeSnapshots();
  const signals = detectAiBrainSignals(snapshots);
  const risks = detectAiBrainRisks(signals);
  return generateAiBrainRecommendations(snapshots, signals, risks);
}

export function createAiBrainReport(): AiBrainReport {
  const snapshots = readAllBridgeSnapshots();
  const analysis = analyzeSystemState();
  return dailyOperationsReport(snapshots, analysis);
}

export function explainSystemState(): {
  explanation: string;
  moduleSummaries: string[];
  priority: AiBrainPriority;
} {
  const analysis = analyzeSystemState();
  const degradedModules = analysis.context.moduleStatuses.filter(
    (module) => module.status !== "healthy",
  );

  const explanation =
    degradedModules.length === 0
      ? "Все модули в нормальном состоянии. Критических рисков не обнаружено."
      : `Обнаружено модулей с вниманием: ${degradedModules.length}. Рисков: ${analysis.risks.length}. Рекомендаций: ${analysis.recommendations.length}.`;

  const priority =
    analysis.risks.find((risk) => risk.priority === "critical")?.priority ??
    analysis.risks.find((risk) => risk.priority === "high")?.priority ??
    "normal";

  return {
    explanation,
    moduleSummaries: analysis.context.moduleStatuses.map(
      (module) => `${module.title}: ${module.summary} (${module.status})`,
    ),
    priority,
  };
}

export function suggestNextActions(): AiBrainRecommendation[] {
  return generateRecommendations()
    .sort((left, right) => {
      const priorityWeight = { critical: 4, high: 3, normal: 2, low: 1 };
      return priorityWeight[right.priority] - priorityWeight[left.priority];
    })
    .slice(0, 5);
}

export function getAiBrainExample() {
  const context = collectSystemContext();
  const analysis = analyzeSystemState();
  const snapshots = readAllBridgeSnapshots();
  const reports = generateAllAiBrainReports(snapshots, analysis);

  return {
    context,
    analysis,
    exampleRisk: analysis.risks[0] ?? null,
    exampleRecommendation: analysis.recommendations[0] ?? null,
    dailyReport: reports.find((report) => report.kind === "daily_operations") ?? null,
    reports,
    explanation: explainSystemState(),
    suggestedActions: suggestNextActions(),
  };
}

export function runAiBrainEngine() {
  const analysis = analyzeSystemState();
  const snapshots = readAllBridgeSnapshots();

  return {
    analysis,
    reports: generateAllAiBrainReports(snapshots, analysis),
    explanation: explainSystemState(),
    suggestedActions: suggestNextActions(),
    generatedAt: new Date().toISOString(),
  };
}
