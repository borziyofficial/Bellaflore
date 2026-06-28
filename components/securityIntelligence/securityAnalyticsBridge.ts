// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Analytics bridge (read-only)
// ==================================================
import { collectAnalyticsSnapshot } from "@/components/analyticsIntelligence/analyticsIntelligenceEngine";

export function readSecurityAnalyticsSnapshot() {
  const snapshot = collectAnalyticsSnapshot("today");

  return {
    kpiCount: snapshot.kpis.length,
    metricCount: snapshot.metrics.length,
    moduleSummaryCount: snapshot.moduleSummaries.length,
    generatedAt: new Date().toISOString(),
  };
}
