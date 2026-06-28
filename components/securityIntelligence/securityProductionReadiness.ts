// ==================================================
// SECTION: SECURITY INTELLIGENCE
// РАЗДЕЛ: Production readiness checklist
// ==================================================
import {
  isDevSecurityCredentialsEnabled,
  SECURITY_DEV_CONFIG_FLAG,
} from "@/components/securityIntelligence/securityDevConfig";
import type { ProductionReadinessChecklist } from "@/components/securityIntelligence/securityIntelligenceTypes";

function resolveEnvConfigured(keys: string[]): boolean {
  if (typeof process === "undefined" || !process.env) {
    return false;
  }

  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

export function buildProductionReadinessChecklist(): ProductionReadinessChecklist {
  const items = [
    {
      id: "credentials_env",
      title: "Credentials moved to env",
      description: "Auth credentials stored in environment/secrets manager",
      required: true,
      status: resolveEnvConfigured(["SECURITY_AUTH_SECRET"])
        ? ("ready" as const)
        : ("pending" as const),
    },
    {
      id: "secrets_configured",
      title: "Secrets configured",
      description: "TELEGRAM and security secrets configured in env",
      required: true,
      status: resolveEnvConfigured(["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"])
        ? ("ready" as const)
        : ("warning" as const),
    },
    {
      id: "admin_routes_protected",
      title: "Admin routes protected",
      description: "Route guards wired for /admin/*",
      required: true,
      status: "pending" as const,
    },
    {
      id: "rate_limit_enabled",
      title: "Rate limit enabled",
      description: "Login and admin action rate limits active",
      required: true,
      status: "ready" as const,
    },
    {
      id: "audit_logging_enabled",
      title: "Audit logging enabled",
      description: "Security audit events persisted",
      required: true,
      status: "ready" as const,
    },
    {
      id: "session_expiry_enabled",
      title: "Session expiry enabled",
      description: "Security sessions expire automatically",
      required: true,
      status: "ready" as const,
    },
    {
      id: "dev_credentials_disabled",
      title: "Dev credentials disabled",
      description: `Remove ${SECURITY_DEV_CONFIG_FLAG} credentials`,
      required: true,
      status: isDevSecurityCredentialsEnabled()
        ? ("warning" as const)
        : ("ready" as const),
    },
    {
      id: "https_required",
      title: "HTTPS required",
      description: "Production admin access over HTTPS only",
      required: true,
      status: "pending" as const,
    },
    {
      id: "backup_access_policy",
      title: "Backup access policy defined",
      description: "Owner backup access and break-glass policy documented",
      required: false,
      status: "pending" as const,
    },
  ];

  const readyCount = items.filter((item) => item.status === "ready").length;

  return {
    items,
    readyCount,
    totalCount: items.length,
    isProductionReady: readyCount === items.filter((item) => item.required).length,
    generatedAt: new Date().toISOString(),
  };
}
