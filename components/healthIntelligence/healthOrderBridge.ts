// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Order health bridge (read-only)
// ==================================================
import type {
  HealthCheckResult,
  HealthIssue,
} from "@/components/healthIntelligence/healthIntelligenceTypes";
import { buildAdminOrderSummary } from "@/components/adminIntelligence/adminOrderBridge";
import { listOrders } from "@/components/orderIntelligence/orderStoreEngine";

const STUCK_ORDER_HOURS = 24;
const LONG_PENDING_HOURS = 4;

function hoursSince(isoDate: string): number {
  return (Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60);
}

function buildResult(
  checkId: string,
  passed: boolean,
  severity: HealthCheckResult["severity"],
  status: HealthCheckResult["status"],
  message: string,
  metadata: Record<string, unknown> = {},
): HealthCheckResult {
  return {
    checkId,
    moduleId: "orderIntelligence",
    status,
    severity,
    passed,
    message,
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

export function readHealthOrderSnapshot() {
  const orders = listOrders();
  const summary = buildAdminOrderSummary(0);

  return {
    summary,
    totalOrders: orders.length,
    generatedAt: new Date().toISOString(),
  };
}

export function runHealthOrderChecks(): HealthCheckResult[] {
  const orders = listOrders();
  const now = new Date().toISOString();

  const stuckOrders = orders.filter(
    (order) =>
      order.status === "new" &&
      !["delivered", "cancelled", "failed"].includes(order.status) &&
      hoursSince(order.updatedAt) >= STUCK_ORDER_HOURS,
  );

  const failedOrders = orders.filter((order) => order.status === "failed");
  const longPendingOrders = orders.filter(
    (order) =>
      order.status === "new" && hoursSince(order.createdAt) >= LONG_PENDING_HOURS,
  );

  return [
    buildResult(
      "orders_stuck",
      stuckOrders.length === 0,
      stuckOrders.length > 0 ? "high" : "info",
      stuckOrders.length > 0 ? "warning" : "healthy",
      stuckOrders.length > 0
        ? `Зависшие заказы: ${stuckOrders.length}`
        : "Зависших заказов нет",
      { orderIds: stuckOrders.map((order) => order.id), checkedAt: now },
    ),
    buildResult(
      "orders_failed",
      failedOrders.length === 0,
      failedOrders.length > 0 ? "critical" : "info",
      failedOrders.length > 0 ? "critical" : "healthy",
      failedOrders.length > 0
        ? `Failed orders: ${failedOrders.length}`
        : "Failed orders нет",
      { orderIds: failedOrders.map((order) => order.id) },
    ),
    buildResult(
      "orders_long_pending",
      longPendingOrders.length === 0,
      longPendingOrders.length >= 3 ? "high" : longPendingOrders.length > 0 ? "medium" : "info",
      longPendingOrders.length > 0 ? "warning" : "healthy",
      longPendingOrders.length > 0
        ? `Long pending orders: ${longPendingOrders.length}`
        : "Long pending orders нет",
      { orderIds: longPendingOrders.map((order) => order.id) },
    ),
  ];
}

export function detectHealthOrderIssues(
  results: HealthCheckResult[],
): HealthIssue[] {
  return results
    .filter((result) => !result.passed)
    .map((result) => ({
      id: `issue-${result.checkId}`,
      moduleId: "orderIntelligence",
      checkId: result.checkId,
      status: result.status,
      severity: result.severity,
      title: result.checkId,
      description: result.message,
      detectedAt: result.checkedAt,
      resourceType: "order",
      resourceId:
        typeof result.metadata.orderIds === "object" &&
        Array.isArray(result.metadata.orderIds)
          ? String(result.metadata.orderIds[0] ?? "")
          : null,
    }));
}
