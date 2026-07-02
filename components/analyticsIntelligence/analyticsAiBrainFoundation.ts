// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: AI Brain ready payload
// ==================================================
import { readAnalyticsAiBrainSnapshot } from "@/components/analyticsIntelligence/analyticsAiBrainBridge";
import { generateAnalyticsInsights } from "@/components/analyticsIntelligence/analyticsInsightEngine";
import type {
  AnalyticsAiBrainPayload,
  AnalyticsTimeRange,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";

export function buildAnalyticsAiBrainPayload(
  range: AnalyticsTimeRange,
): AnalyticsAiBrainPayload {
  const aiBrain = readAnalyticsAiBrainSnapshot(range);
  const insights = generateAnalyticsInsights(range);

  return {
    analyticsSignals: aiBrain.analysis.signals.map((signal) => ({
      id: signal.id,
      title: signal.title,
      priority: signal.priority,
      moduleId: mapModuleId(signal.moduleId),
    })),
    analyticsRisks: aiBrain.analysis.risks.map((risk) => ({
      id: risk.id,
      title: risk.title,
      priority: risk.priority,
      moduleId: mapModuleId(risk.moduleId),
    })),
    analyticsRecommendations: aiBrain.analysis.recommendations.map((rec) => ({
      id: rec.id,
      title: rec.title,
      rationale: rec.rationale,
      moduleId: mapModuleId(rec.action.moduleId),
    })),
    analyticsInsights: insights,
    generatedAt: new Date().toISOString(),
  };
}

function mapModuleId(
  moduleId: string,
): AnalyticsAiBrainPayload["analyticsSignals"][number]["moduleId"] {
  const allowed = new Set([
    "orderIntelligence",
    "catalogEngine",
    "inventoryIntelligence",
    "courierIntelligence",
    "deliveryIntelligence",
    "notificationIntelligence",
    "workflowIntelligence",
    "adminIntelligence",
    "aiBrain",
  ]);

  if (allowed.has(moduleId)) {
    return moduleId as AnalyticsAiBrainPayload["analyticsSignals"][number]["moduleId"];
  }

  return "adminIntelligence";
}

export function readAnalyticsSummaryForAiBrain(range: AnalyticsTimeRange) {
  const payload = buildAnalyticsAiBrainPayload(range);

  return {
    signalCount: payload.analyticsSignals.length,
    riskCount: payload.analyticsRisks.length,
    recommendationCount: payload.analyticsRecommendations.length,
    insightCount: payload.analyticsInsights.length,
    topInsight: payload.analyticsInsights[0] ?? null,
    generatedAt: payload.generatedAt,
  };
}
