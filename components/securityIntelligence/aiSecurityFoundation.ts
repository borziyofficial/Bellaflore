// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: AI hooks foundation
// ==================================================
import { detectSecurityRisks } from "@/components/securityIntelligence/securityRiskEngine";
import { listSecurityAuditEvents } from "@/components/securityIntelligence/securityAuditFoundation";
import { listSecurityRouteRules } from "@/components/securityIntelligence/securityRouteAccessFoundation";
import type {
  AiSecurityHooks,
  SecurityEvent,
  SecurityPolicy,
  SecurityPostureSummary,
  SecurityRisk,
} from "@/components/securityIntelligence/securityIntelligenceTypes";
import { buildProductionReadinessChecklist } from "@/components/securityIntelligence/securityProductionReadiness";

let aiSecurityHooks: AiSecurityHooks = {};

export function registerAiSecurityHooks(hooks: AiSecurityHooks): AiSecurityHooks {
  aiSecurityHooks = { ...aiSecurityHooks, ...hooks };
  return aiSecurityHooks;
}

export function getAiSecurityHooks(): AiSecurityHooks {
  return aiSecurityHooks;
}

export function clearAiSecurityHooks(): void {
  aiSecurityHooks = {};
}

export async function detectSecurityRisk(): Promise<SecurityRisk[]> {
  return aiSecurityHooks.detectSecurityRisk?.() ?? detectSecurityRisks();
}

export async function explainSecurityEvent(event: SecurityEvent): Promise<string> {
  return (
    aiSecurityHooks.explainSecurityEvent?.(event) ??
    `${event.kind}: ${event.message}`
  );
}

export async function suggestSecurityAction(risk: SecurityRisk) {
  return (
    aiSecurityHooks.suggestSecurityAction?.(risk) ?? {
      action: risk.mitigation,
      rationale: risk.description,
    }
  );
}

export async function summarizeSecurityPosture(): Promise<SecurityPostureSummary> {
  if (aiSecurityHooks.summarizeSecurityPosture) {
    return aiSecurityHooks.summarizeSecurityPosture();
  }

  const risks = detectSecurityRisks();
  const checklist = buildProductionReadinessChecklist();
  const auditEvents = listSecurityAuditEvents(100);

  const score = Math.max(
    0,
    100 - risks.filter((risk) => risk.severity === "critical").length * 20 -
      risks.filter((risk) => risk.severity === "high").length * 10,
  );

  return {
    score,
    status: score >= 80 ? "secure" : score >= 50 ? "attention" : "at_risk",
    openRisks: risks.length,
    auditEvents24h: auditEvents.length,
    checklistComplete: checklist.readyCount,
    checklistTotal: checklist.totalCount,
    generatedAt: new Date().toISOString(),
  };
}

export async function optimizeSecurityPolicy(): Promise<SecurityPolicy[]> {
  if (aiSecurityHooks.optimizeSecurityPolicy) {
    return aiSecurityHooks.optimizeSecurityPolicy();
  }

  return listSecurityRouteRules().map((rule) => ({
    id: `policy-${rule.route}`,
    title: rule.title,
    description: `Access policy for ${rule.route}`,
    requiredPermissions: rule.requiredPermissions,
    allowedRoles: rule.allowedRoles,
    enabled: rule.enabled,
  }));
}

export const AI_SECURITY_INTEGRATION_SLOTS = [
  { id: "detectSecurityRisk", label: "Detect security risk", status: "ready_for_integration" as const },
  { id: "explainSecurityEvent", label: "Explain security event", status: "ready_for_integration" as const },
  { id: "suggestSecurityAction", label: "Suggest security action", status: "ready_for_integration" as const },
  { id: "summarizeSecurityPosture", label: "Summarize security posture", status: "active_foundation" as const },
  { id: "optimizeSecurityPolicy", label: "Optimize security policy", status: "ready_for_integration" as const },
];
