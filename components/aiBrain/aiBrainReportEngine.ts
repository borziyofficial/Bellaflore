// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Report engine
// ==================================================
import type {
  AiBrainAnalysisResult,
  AiBrainReport,
  AiBrainReportKind,
} from "@/components/aiBrain/aiBrainTypes";
import type { AiBrainBridgeSnapshots } from "@/components/aiBrain/aiBrainSignalEngine";

let reportCounter = 0;

function nextReportId(kind: AiBrainReportKind): string {
  reportCounter += 1;
  return `report-${kind}-${reportCounter}`;
}

function buildReport(
  input: Omit<AiBrainReport, "id">,
): AiBrainReport {
  return {
    id: nextReportId(input.kind),
    ...input,
  };
}

export function dailyOperationsReport(
  snapshots: AiBrainBridgeSnapshots,
  analysis: AiBrainAnalysisResult,
): AiBrainReport {
  return buildReport({
    kind: "daily_operations",
    title: "Daily Operations Report",
    summary: `Заказов: ${snapshots.orders.summary.totalOrders}, активных доставок: ${snapshots.delivery.summary.activeTasks}, сигналов: ${analysis.signals.length}`,
    priority: analysis.risks.some((risk) => risk.priority === "critical")
      ? "critical"
      : analysis.risks.length > 0
        ? "high"
        : "normal",
    sections: [
      {
        id: "orders",
        title: "Заказы",
        content: `Новых: ${snapshots.orders.summary.newOrders}, в работе: ${snapshots.orders.summary.inProgressOrders}`,
        metrics: {
          totalOrders: snapshots.orders.summary.totalOrders,
          newOrders: snapshots.orders.summary.newOrders,
          deliveredOrders: snapshots.orders.summary.deliveredOrders,
        },
      },
      {
        id: "delivery",
        title: "Доставка",
        content: `Активных задач: ${snapshots.delivery.summary.activeTasks}, с риском задержки: ${snapshots.delivery.summary.delayedTasks}`,
        metrics: {
          activeTasks: snapshots.delivery.summary.activeTasks,
          delayedTasks: snapshots.delivery.summary.delayedTasks,
          completedToday: snapshots.delivery.summary.completedToday,
        },
      },
      {
        id: "notifications",
        title: "Уведомления",
        content: `Pending: ${snapshots.notifications.summary.pendingNotifications}, failed: ${snapshots.notifications.summary.failedNotifications}`,
        metrics: {
          pending: snapshots.notifications.summary.pendingNotifications,
          failed: snapshots.notifications.summary.failedNotifications,
        },
      },
    ],
    generatedAt: new Date().toISOString(),
  });
}

export function riskSummaryReport(analysis: AiBrainAnalysisResult): AiBrainReport {
  return buildReport({
    kind: "risk_summary",
    title: "Risk Summary Report",
    summary:
      analysis.risks.length === 0
        ? "Критических рисков не обнаружено"
        : `Обнаружено рисков: ${analysis.risks.length}`,
    priority:
      analysis.risks.find((risk) => risk.priority === "critical")?.priority ??
      analysis.risks.find((risk) => risk.priority === "high")?.priority ??
      "normal",
    sections: analysis.risks.map((risk) => ({
      id: risk.id,
      title: risk.title,
      content: risk.description,
      metrics: {
        priority: risk.priority,
        signalCount: risk.relatedSignalIds.length,
      },
    })),
    generatedAt: new Date().toISOString(),
  });
}

export function inventoryAttentionReport(
  snapshots: AiBrainBridgeSnapshots,
): AiBrainReport {
  return buildReport({
    kind: "inventory_attention",
    title: "Inventory Attention Report",
    summary: `Low stock: ${snapshots.inventory.summary.lowStockItems}, out of stock: ${snapshots.inventory.outOfStockItemIds.length}`,
    priority:
      snapshots.inventory.outOfStockItemIds.length > 0
        ? "critical"
        : snapshots.inventory.summary.lowStockItems > 0
          ? "high"
          : "normal",
    sections: [
      {
        id: "stock",
        title: "Склад",
        content: "Сводка по остаткам и резервам",
        metrics: {
          totalItems: snapshots.inventory.summary.totalItems,
          lowStockItems: snapshots.inventory.summary.lowStockItems,
          activeReservations: snapshots.inventory.summary.activeReservations,
          outOfStock: snapshots.inventory.outOfStockItemIds.length,
        },
      },
    ],
    generatedAt: new Date().toISOString(),
  });
}

export function deliveryPerformanceReport(
  snapshots: AiBrainBridgeSnapshots,
): AiBrainReport {
  return buildReport({
    kind: "delivery_performance",
    title: "Delivery Performance Report",
    summary: `Active: ${snapshots.delivery.summary.activeTasks}, delayed risk: ${snapshots.delivery.summary.delayedTasks}`,
    priority: snapshots.delivery.summary.delayedTasks > 0 ? "high" : "normal",
    sections: [
      {
        id: "performance",
        title: "Доставка",
        content: "Показатели активных и завершённых задач",
        metrics: {
          totalTasks: snapshots.delivery.summary.totalTasks,
          activeTasks: snapshots.delivery.summary.activeTasks,
          delayedTasks: snapshots.delivery.summary.delayedTasks,
          completedToday: snapshots.delivery.summary.completedToday,
        },
      },
    ],
    generatedAt: new Date().toISOString(),
  });
}

export function orderDemandReport(
  snapshots: AiBrainBridgeSnapshots,
): AiBrainReport {
  return buildReport({
    kind: "order_demand",
    title: "Order Demand Report",
    summary: `New orders: ${snapshots.orders.summary.newOrders}, in progress: ${snapshots.orders.summary.inProgressOrders}`,
    priority:
      snapshots.orders.summary.newOrders >= 5
        ? "high"
        : snapshots.orders.summary.newOrders >= 2
          ? "normal"
          : "low",
    sections: [
      {
        id: "demand",
        title: "Спрос",
        content: "Динамика новых и активных заказов",
        metrics: {
          totalOrders: snapshots.orders.summary.totalOrders,
          newOrders: snapshots.orders.summary.newOrders,
          inProgressOrders: snapshots.orders.summary.inProgressOrders,
          cancelledOrders: snapshots.orders.summary.cancelledOrders,
        },
      },
    ],
    generatedAt: new Date().toISOString(),
  });
}

export function systemHealthReport(
  snapshots: AiBrainBridgeSnapshots,
  analysis: AiBrainAnalysisResult,
): AiBrainReport {
  return buildReport({
    kind: "system_health",
    title: "System Health Report",
    summary: `Attention score: ${analysis.context.attentionScore}, modules degraded: ${analysis.context.moduleStatuses.filter((module) => module.status !== "healthy").length}`,
    priority:
      analysis.context.attentionScore >= 15
        ? "critical"
        : analysis.context.attentionScore >= 8
          ? "high"
          : "normal",
    sections: analysis.context.moduleStatuses.map((module) => ({
      id: module.moduleId,
      title: module.title,
      content: module.summary,
      metrics: {
        attentionCount: module.attentionCount,
        status: module.status,
      },
    })),
    generatedAt: new Date().toISOString(),
  });
}

export function generateAllAiBrainReports(
  snapshots: AiBrainBridgeSnapshots,
  analysis: AiBrainAnalysisResult,
): AiBrainReport[] {
  return [
    dailyOperationsReport(snapshots, analysis),
    riskSummaryReport(analysis),
    inventoryAttentionReport(snapshots),
    deliveryPerformanceReport(snapshots),
    orderDemandReport(snapshots),
    systemHealthReport(snapshots, analysis),
  ];
}

export function resetAiBrainReportCounter(): void {
  reportCounter = 0;
}

export const AI_BRAIN_REPORT_KINDS: AiBrainReportKind[] = [
  "daily_operations",
  "risk_summary",
  "inventory_attention",
  "delivery_performance",
  "order_demand",
  "system_health",
];
