// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Admin bridge (read-only)
// ==================================================
import type { AnalyticsTimeRange } from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";
import { buildAdminDashboardSummary } from "@/components/adminIntelligence/adminIntelligenceEngine";
import { getAdminModuleRegistrySnapshot } from "@/components/adminIntelligence/adminModuleRegistry";

export function readAnalyticsAdminSnapshot(range: AnalyticsTimeRange) {
  void range;
  return {
    dashboard: buildAdminDashboardSummary(),
    moduleRegistry: getAdminModuleRegistrySnapshot(),
    generatedAt: new Date().toISOString(),
  };
}
