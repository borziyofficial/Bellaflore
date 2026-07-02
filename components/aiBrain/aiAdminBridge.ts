// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Admin bridge (read-only)
// ==================================================
import { buildAdminDashboardSummary } from "@/components/adminIntelligence/adminIntelligenceEngine";
import { getAdminModuleRegistrySnapshot } from "@/components/adminIntelligence/adminModuleRegistry";
import { listAdminAuditEvents } from "@/components/adminIntelligence/adminAuditFoundation";

export type AiAdminBridgeSnapshot = {
  dashboard: ReturnType<typeof buildAdminDashboardSummary>;
  moduleRegistry: ReturnType<typeof getAdminModuleRegistrySnapshot>;
  recentAuditCount: number;
  attentionItemsCount: number;
  generatedAt: string;
};

export function readAiAdminSnapshot(): AiAdminBridgeSnapshot {
  const dashboard = buildAdminDashboardSummary();

  return {
    dashboard,
    moduleRegistry: getAdminModuleRegistrySnapshot(),
    recentAuditCount: listAdminAuditEvents(20).length,
    attentionItemsCount: dashboard.attentionItemsCount,
    generatedAt: new Date().toISOString(),
  };
}
