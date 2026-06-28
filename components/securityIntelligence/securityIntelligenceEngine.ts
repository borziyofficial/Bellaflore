// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import { summarizeSecurityPosture } from "@/components/securityIntelligence/aiSecurityFoundation";
import { readSecurityAdminSnapshot } from "@/components/securityIntelligence/securityAdminBridge";
import { readSecurityAiBrainSnapshot } from "@/components/securityIntelligence/securityAiBrainBridge";
import { readSecurityAnalyticsSnapshot } from "@/components/securityIntelligence/securityAnalyticsBridge";
import { readSecurityHealthSnapshot } from "@/components/securityIntelligence/securityHealthBridge";
import {
  canAccessAdminEntryPoint,
  getExampleDeniedAccess,
  hasSecurityPermission,
} from "@/components/securityIntelligence/securityAccessGuards";
import {
  getCurrentSecuritySession,
  getExampleSecuritySession,
  validateSecurityLogin,
  createSecuritySession,
} from "@/components/securityIntelligence/securityAuthFoundation";
import { listSecurityAuditEvents } from "@/components/securityIntelligence/securityAuditFoundation";
import { buildProductionReadinessChecklist } from "@/components/securityIntelligence/securityProductionReadiness";
import {
  detectSecurityRisks,
  getExampleSecurityRisk,
} from "@/components/securityIntelligence/securityRiskEngine";
import {
  listSecurityRouteRules,
  SECURITY_MODULE_ACCESS,
} from "@/components/securityIntelligence/securityRouteAccessFoundation";
import type {
  SecurityPostureSummary,
  SecurityRoutePath,
} from "@/components/securityIntelligence/securityIntelligenceTypes";

export function getSecurityIntelligenceSnapshot() {
  const session = getCurrentSecuritySession();

  return {
    session,
    routeRules: listSecurityRouteRules(),
    moduleAccess: SECURITY_MODULE_ACCESS,
    auditEvents: listSecurityAuditEvents(20),
    risks: detectSecurityRisks(),
    productionChecklist: buildProductionReadinessChecklist(),
    bridges: {
      admin: readSecurityAdminSnapshot(),
      health: readSecurityHealthSnapshot(),
      aiBrain: readSecurityAiBrainSnapshot(),
      analytics: readSecurityAnalyticsSnapshot(),
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function getSecurityPostureReport(): Promise<{
  posture: SecurityPostureSummary;
  risks: ReturnType<typeof detectSecurityRisks>;
  checklist: ReturnType<typeof buildProductionReadinessChecklist>;
}> {
  const posture = await summarizeSecurityPosture();

  return {
    posture,
    risks: detectSecurityRisks(),
    checklist: buildProductionReadinessChecklist(),
  };
}

export function getSecurityIntelligenceExample() {
  const session = getExampleSecuritySession("manager");
  const permissionCheck = hasSecurityPermission("orders.view", session);
  const deniedAccess = getExampleDeniedAccess();
  const routeCheck = canAccessAdminEntryPoint("/admin/security" as SecurityRoutePath, session);
  const exampleRisk = getExampleSecurityRisk();

  return {
    session,
    permissionCheck,
    deniedAccess,
    routeCheck,
    exampleAuditEvent: {
      id: "security-event-example",
      kind: "permission_denied" as const,
      actorId: session.userId,
      actorRole: session.role,
      message: "Permission denied: security.control",
      metadata: { permission: "security.control" },
      createdAt: new Date().toISOString(),
      reviewed: false,
    },
    exampleRisk,
    loginExample: validateSecurityLogin("admin@bellaflore.local", "dev-admin-secure"),
    productionChecklist: buildProductionReadinessChecklist(),
  };
}

export function loginSecurityUser(login: string, password: string) {
  const validation = validateSecurityLogin(login, password);
  if (!validation.ok || !validation.user) {
    return { session: null, message: validation.message };
  }

  const session = createSecuritySession(validation.user);
  return { session, message: validation.ok ? "OK" : validation.message };
}

export function runSecurityIntelligenceEngine() {
  return getSecurityIntelligenceSnapshot();
}
