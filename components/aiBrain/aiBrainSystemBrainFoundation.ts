// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: System Brain page payload
// ==================================================
import {
  analyzeSystemState,
  collectSystemContext,
  explainSystemState,
  suggestNextActions,
} from "@/components/aiBrain/aiBrainEngine";
import { generateAllAiBrainReports } from "@/components/aiBrain/aiBrainReportEngine";
import type { SystemBrainPagePayload } from "@/components/aiBrain/aiBrainTypes";
import {
  detectAiBrainSignals,
  type AiBrainBridgeSnapshots,
} from "@/components/aiBrain/aiBrainSignalEngine";
import { readAiAdminSnapshot } from "@/components/aiBrain/aiAdminBridge";
import { readAiCatalogSnapshot } from "@/components/aiBrain/aiCatalogBridge";
import { readAiCourierSnapshot } from "@/components/aiBrain/aiCourierBridge";
import { readAiDeliverySnapshot } from "@/components/aiBrain/aiDeliveryBridge";
import { readAiInventorySnapshot } from "@/components/aiBrain/aiInventoryBridge";
import { readAiNotificationSnapshot } from "@/components/aiBrain/aiNotificationBridge";
import { readAiOrderSnapshot } from "@/components/aiBrain/aiOrderBridge";
import { readAiWorkflowSnapshot } from "@/components/aiBrain/aiWorkflowBridge";

function readBridgeSnapshotsForSystemBrain(): AiBrainBridgeSnapshots {
  return {
    orders: readAiOrderSnapshot(),
    inventory: readAiInventorySnapshot(),
    couriers: readAiCourierSnapshot(),
    delivery: readAiDeliverySnapshot(),
    notifications: readAiNotificationSnapshot(),
    workflow: readAiWorkflowSnapshot(),
    admin: readAiAdminSnapshot(),
    catalog: readAiCatalogSnapshot(),
  };
}

function resolveSystemHealth(
  attentionScore: number,
  criticalRisks: number,
): SystemBrainPagePayload["systemState"]["health"] {
  if (criticalRisks > 0 || attentionScore >= 15) {
    return "critical";
  }

  if (attentionScore >= 5) {
    return "attention";
  }

  return "healthy";
}

export function buildSystemBrainPagePayload(): SystemBrainPagePayload {
  const context = collectSystemContext();
  const analysis = analyzeSystemState();
  const snapshots = readBridgeSnapshotsForSystemBrain();
  const reports = generateAllAiBrainReports(snapshots, analysis);
  const suggestedActions = suggestNextActions().map(
    (recommendation) => recommendation.action,
  );
  const criticalRisks = analysis.risks.filter(
    (risk) => risk.priority === "critical",
  ).length;

  return {
    routePath: "/admin/system-brain",
    systemState: {
      health: resolveSystemHealth(context.attentionScore, criticalRisks),
      attentionScore: context.attentionScore,
      moduleStatuses: context.moduleStatuses,
    },
    risks: analysis.risks,
    recommendations: analysis.recommendations,
    reports,
    suggestedActions,
    generatedAt: new Date().toISOString(),
  };
}

export function getSystemBrainPreviewSummary() {
  const payload = buildSystemBrainPagePayload();

  return {
    routePath: payload.routePath,
    health: payload.systemState.health,
    attentionScore: payload.systemState.attentionScore,
    riskCount: payload.risks.length,
    recommendationCount: payload.recommendations.length,
    reportCount: payload.reports.length,
    signalCount: detectAiBrainSignals(readBridgeSnapshotsForSystemBrain()).length,
    explanation: explainSystemState().explanation,
    generatedAt: payload.generatedAt,
  };
}
