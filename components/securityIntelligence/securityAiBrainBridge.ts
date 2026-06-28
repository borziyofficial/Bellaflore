// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: AI Brain bridge (read-only)
// ==================================================
import { analyzeSystemState } from "@/components/aiBrain/aiBrainEngine";

export function readSecurityAiBrainSnapshot() {
  const analysis = analyzeSystemState();

  return {
    signalCount: analysis.signals.length,
    riskCount: analysis.risks.length,
    recommendationCount: analysis.recommendations.length,
    attentionScore: analysis.context.attentionScore,
    generatedAt: new Date().toISOString(),
  };
}
