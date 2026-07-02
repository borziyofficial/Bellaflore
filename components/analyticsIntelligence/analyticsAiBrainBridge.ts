// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: AI Brain bridge (read-only)
// ==================================================
import type { AnalyticsTimeRange } from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";
import { collectSystemContext, analyzeSystemState } from "@/components/aiBrain/aiBrainEngine";

export function readAnalyticsAiBrainSnapshot(range: AnalyticsTimeRange) {
  void range;
  return {
    context: collectSystemContext(),
    analysis: analyzeSystemState(),
    generatedAt: new Date().toISOString(),
  };
}

export function readAnalyticsAiBrainSummary(range: AnalyticsTimeRange) {
  void range;
  const analysis = analyzeSystemState();

  return {
    signalCount: analysis.signals.length,
    riskCount: analysis.risks.length,
    recommendationCount: analysis.recommendations.length,
    attentionScore: analysis.context.attentionScore,
    generatedAt: new Date().toISOString(),
  };
}
