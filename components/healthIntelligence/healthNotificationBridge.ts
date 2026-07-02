// ==================================================
// SECTION: HEALTH INTELLIGENCE
// РАЗДЕЛ: Notification health bridge (read-only)
// ==================================================
import type {
  HealthCheckResult,
  HealthIssue,
} from "@/components/healthIntelligence/healthIntelligenceTypes";
import { readAiNotificationSnapshot } from "@/components/aiBrain/aiNotificationBridge";
import { listAllNotifications } from "@/components/notificationIntelligence/notificationQueueEngine";

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
    moduleId: "notificationIntelligence",
    status,
    severity,
    passed,
    message,
    checkedAt: new Date().toISOString(),
    metadata,
  };
}

export function readHealthNotificationSnapshot() {
  return readAiNotificationSnapshot();
}

export function runHealthNotificationChecks(): HealthCheckResult[] {
  const snapshot = readAiNotificationSnapshot();
  const all = listAllNotifications();

  const failed = snapshot.failedNotificationIds.length;
  const pending = snapshot.pendingNotificationIds.length;
  const escalationQueue = all.filter((item) => item.escalationLevel > 0).length;

  return [
    buildResult(
      "notification_failed",
      failed === 0,
      failed > 0 ? "high" : "info",
      failed > 0 ? "degraded" : "healthy",
      failed > 0 ? `Failed notifications: ${failed}` : "Failed notifications нет",
      { notificationIds: snapshot.failedNotificationIds },
    ),
    buildResult(
      "notification_pending",
      pending < 10,
      pending >= 20 ? "high" : pending >= 10 ? "medium" : "info",
      pending >= 10 ? "warning" : "healthy",
      `Pending notifications: ${pending}`,
      { pendingCount: pending },
    ),
    buildResult(
      "notification_escalation_queue",
      escalationQueue === 0,
      escalationQueue > 0 ? "medium" : "info",
      escalationQueue > 0 ? "warning" : "healthy",
      escalationQueue > 0
        ? `Escalation queue: ${escalationQueue}`
        : "Escalation queue пуста",
      { escalationCount: escalationQueue },
    ),
  ];
}

export function detectHealthNotificationIssues(
  results: HealthCheckResult[],
): HealthIssue[] {
  return results
    .filter((result) => !result.passed)
    .map((result) => ({
      id: `issue-${result.checkId}`,
      moduleId: "notificationIntelligence",
      checkId: result.checkId,
      status: result.status,
      severity: result.severity,
      title: result.checkId,
      description: result.message,
      detectedAt: result.checkedAt,
      resourceType: "notification",
      resourceId: null,
    }));
}
