// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Admin health bridge (read-only)
// ==================================================
import type { HealthCheckResult } from "@/components/healthIntelligence/healthIntelligenceTypes";
import { buildAdminDashboardSummary } from "@/components/adminIntelligence/adminIntelligenceEngine";
import { getAdminModuleRegistrySnapshot } from "@/components/adminIntelligence/adminModuleRegistry";

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
    moduleId: "adminIntelligence",
    status,
    severity,
    passed,
    message,
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

export function readHealthAdminSnapshot() {
  return {
    dashboard: buildAdminDashboardSummary(),
    moduleRegistry: getAdminModuleRegistrySnapshot(),
    generatedAt: new Date().toISOString(),
  };
}

export function runHealthAdminChecks(): HealthCheckResult[] {
  const dashboard = buildAdminDashboardSummary();
  const registry = getAdminModuleRegistrySnapshot();
  const attention = dashboard.attentionItemsCount;

  return [
    buildResult(
      "admin_attention_items",
      attention < 10,
      attention >= 15 ? "critical" : attention >= 10 ? "high" : "info",
      attention >= 10 ? "warning" : "healthy",
      `Attention items: ${attention}`,
      { attentionItemsCount: attention },
    ),
    buildResult(
      "admin_module_registry",
      registry.activeCount > 0,
      registry.activeCount === 0 ? "critical" : "info",
      registry.activeCount === 0 ? "offline" : "healthy",
      `Active modules: ${registry.activeCount}`,
      { activeCount: registry.activeCount },
    ),
  ];
}
