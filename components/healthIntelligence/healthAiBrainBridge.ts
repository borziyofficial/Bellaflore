// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: AI Brain health bridge (read-only)
// ==================================================
import type { HealthCheckResult } from "@/components/healthIntelligence/healthIntelligenceTypes";
import { analyzeSystemState, collectSystemContext } from "@/components/aiBrain/aiBrainEngine";

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
    moduleId: "aiBrain",
    status,
    severity,
    passed,
    message,
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

export function readHealthAiBrainSnapshot() {
  const context = collectSystemContext();
  const analysis = analyzeSystemState();

  return {
    context,
    analysis,
    generatedAt: new Date().toISOString(),
  };
}

export function runHealthAiBrainChecks(): HealthCheckResult[] {
  const analysis = analyzeSystemState();

  return [
    buildResult(
      "ai_brain_available",
      analysis.context.moduleStatuses.length > 0,
      analysis.context.moduleStatuses.length === 0 ? "critical" : "info",
      analysis.context.moduleStatuses.length === 0 ? "offline" : "healthy",
      analysis.context.moduleStatuses.length === 0
        ? "AI Brain context unavailable"
        : "AI Brain available",
      { moduleCount: analysis.context.moduleStatuses.length },
    ),
    buildResult(
      "ai_brain_recommendations",
      true,
      analysis.recommendations.length === 0 ? "info" : "low",
      "healthy",
      `Recommendations generated: ${analysis.recommendations.length}`,
      { recommendationCount: analysis.recommendations.length },
    ),
    buildResult(
      "ai_brain_risk_detection",
      !analysis.risks.some((risk) => risk.priority === "critical"),
      analysis.risks.some((risk) => risk.priority === "critical")
        ? "critical"
        : analysis.risks.length > 0
          ? "medium"
          : "info",
      analysis.risks.some((risk) => risk.priority === "critical")
        ? "critical"
        : analysis.risks.length > 0
          ? "warning"
          : "healthy",
      `Risks detected: ${analysis.risks.length}`,
      { riskCount: analysis.risks.length },
    ),
  ];
}
