// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Risk engine
// ==================================================
import {
  isDevSecurityCredentialsEnabled,
  SECURITY_DEV_CONFIG_FLAG,
} from "@/components/securityIntelligence/securityDevConfig";
import {
  getCurrentSecuritySession,
  isSessionExpired,
} from "@/components/securityIntelligence/securityAuthFoundation";
import { filterSecurityAuditEvents } from "@/components/securityIntelligence/securityAuditFoundation";
import type {
  SecurityRisk,
  SecurityRiskKind,
} from "@/components/securityIntelligence/securityIntelligenceTypes";

let riskCounter = 0;

function nextRiskId(kind: SecurityRiskKind): string {
  riskCounter += 1;
  return `security-risk-${kind}-${riskCounter}`;
}

function buildRisk(
  input: Omit<SecurityRisk, "id" | "detectedAt">,
): SecurityRisk {
  return {
    id: nextRiskId(input.kind),
    ...input,
    detectedAt: new Date().toISOString(),
  };
}

function resolveTelegramEnvMissing(): boolean {
  if (typeof process === "undefined" || !process.env) {
    return true;
  }

  return (
    !process.env.TELEGRAM_BOT_TOKEN?.trim() ||
    !process.env.TELEGRAM_CHAT_ID?.trim()
  );
}

export function detectSecurityRisks(): SecurityRisk[] {
  const risks: SecurityRisk[] = [];

  if (isDevSecurityCredentialsEnabled()) {
    risks.push(
      buildRisk({
        kind: "dev_credentials_enabled",
        severity: "high",
        title: "Dev credentials enabled",
        description: `Development credentials are active (${SECURITY_DEV_CONFIG_FLAG})`,
        mitigation: "Disable dev credentials and move auth to env-backed provider",
        metadata: { flag: SECURITY_DEV_CONFIG_FLAG },
      }),
    );
  }

  const failedLogins = filterSecurityAuditEvents({ kind: "login_failed" });
  if (failedLogins.length >= 3) {
    risks.push(
      buildRisk({
        kind: "repeated_failed_login",
        severity: failedLogins.length >= 5 ? "critical" : "high",
        title: "Repeated failed login attempts",
        description: `${failedLogins.length} failed login events detected`,
        mitigation: "Enable rate limiting and review audit log",
        metadata: { failedCount: failedLogins.length },
      }),
    );
  }

  const session = getCurrentSecuritySession();
  if (session && isSessionExpired(session)) {
    risks.push(
      buildRisk({
        kind: "expired_session",
        severity: "medium",
        title: "Expired session detected",
        description: "Active session reference is expired",
        mitigation: "Force re-authentication",
        metadata: { sessionId: session.sessionId },
      }),
    );
  }

  if (resolveTelegramEnvMissing()) {
    risks.push(
      buildRisk({
        kind: "missing_env_secret",
        severity: "medium",
        title: "Missing Telegram env secrets",
        description: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured",
        mitigation: "Configure secrets in environment",
        metadata: { secrets: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] },
      }),
    );
  }

  const suspicious = filterSecurityAuditEvents({ kind: "suspicious_activity" });
  if (suspicious.length > 0) {
    risks.push(
      buildRisk({
        kind: "suspicious_admin_action",
        severity: "high",
        title: "Suspicious admin activity",
        description: `${suspicious.length} suspicious events logged`,
        mitigation: "Review security audit events",
        metadata: { count: suspicious.length },
      }),
    );
  }

  risks.push(
    buildRisk({
      kind: "public_admin_route",
      severity: "info",
      title: "Admin routes require protection",
      description: "Foundation rules exist; production route guards must be wired",
      mitigation: "Protect /admin/* routes before production",
      metadata: { foundationOnly: true },
    }),
  );

  return risks;
}

export function getExampleSecurityRisk(): SecurityRisk {
  return {
    id: "security-risk-example",
    kind: "dev_credentials_enabled",
    severity: "high",
    title: "Dev credentials enabled",
    description: `Development credentials are active (${SECURITY_DEV_CONFIG_FLAG})`,
    mitigation: "Disable dev credentials before production",
    detectedAt: new Date().toISOString(),
    metadata: { example: true },
  };
}

export function resetSecurityRiskCounter(): void {
  riskCounter = 0;
}

export const SECURITY_RISK_KINDS: SecurityRiskKind[] = [
  "weak_password",
  "repeated_failed_login",
  "expired_session",
  "missing_permission",
  "dev_credentials_enabled",
  "public_admin_route",
  "missing_env_secret",
  "suspicious_admin_action",
];
