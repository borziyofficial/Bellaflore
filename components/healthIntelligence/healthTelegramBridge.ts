// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Telegram health bridge (read-only)
// ==================================================
import type { HealthCheckResult } from "@/components/healthIntelligence/healthIntelligenceTypes";

export type TelegramHealthSendStatus = "unknown" | "success" | "failed" | "not_configured";

const TELEGRAM_HEALTH_STATUS_STORAGE_KEY =
  "bellaflore_health_telegram_last_send_status_v1";

let inMemoryLastSendStatus: TelegramHealthSendStatus = "unknown";

function readLastSendStatus(): TelegramHealthSendStatus {
  if (typeof window === "undefined") {
    return inMemoryLastSendStatus;
  }

  try {
    const raw = window.localStorage.getItem(TELEGRAM_HEALTH_STATUS_STORAGE_KEY);
    if (!raw) {
      return inMemoryLastSendStatus;
    }

    const parsed = JSON.parse(raw) as { status?: TelegramHealthSendStatus };
    return parsed.status ?? inMemoryLastSendStatus;
  } catch {
    return inMemoryLastSendStatus;
  }
}

function resolveTelegramConfigExists(): boolean {
  if (typeof process !== "undefined" && process.env) {
    return (
      Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim()) &&
      Boolean(process.env.TELEGRAM_CHAT_ID?.trim())
    );
  }

  return false;
}

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
    moduleId: "telegram",
    status,
    severity,
    passed,
    message,
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

export function readHealthTelegramSnapshot() {
  const configExists = resolveTelegramConfigExists();
  const lastSendStatus = readLastSendStatus();

  return {
    configExists,
    apiRoutesAvailable: true,
    lastSendStatus,
    failureRisk:
      !configExists || lastSendStatus === "failed" ? "high" : "low",
    generatedAt: new Date().toISOString(),
  };
}

export function runHealthTelegramChecks(): HealthCheckResult[] {
  const snapshot = readHealthTelegramSnapshot();

  return [
    buildResult(
      "telegram_api_config",
      snapshot.configExists,
      snapshot.configExists ? "info" : "high",
      snapshot.configExists ? "healthy" : "degraded",
      snapshot.configExists
        ? "Telegram API config exists"
        : "Telegram API config missing (server env placeholder check)",
      { configExists: snapshot.configExists },
    ),
    buildResult(
      "telegram_last_send_status",
      snapshot.lastSendStatus !== "failed",
      snapshot.lastSendStatus === "failed" ? "high" : "info",
      snapshot.lastSendStatus === "failed" ? "warning" : "healthy",
      `Last telegram send status: ${snapshot.lastSendStatus}`,
      { lastSendStatus: snapshot.lastSendStatus },
    ),
    buildResult(
      "telegram_failure_risk",
      snapshot.failureRisk === "low",
      snapshot.failureRisk === "high" ? "medium" : "info",
      snapshot.failureRisk === "high" ? "warning" : "healthy",
      `Telegram failure risk: ${snapshot.failureRisk}`,
      { failureRisk: snapshot.failureRisk },
    ),
  ];
}

export function recordTelegramHealthSendStatusPlaceholder(
  status: TelegramHealthSendStatus,
): void {
  inMemoryLastSendStatus = status;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      TELEGRAM_HEALTH_STATUS_STORAGE_KEY,
      JSON.stringify({ status, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // Optional health placeholder storage.
  }
}
