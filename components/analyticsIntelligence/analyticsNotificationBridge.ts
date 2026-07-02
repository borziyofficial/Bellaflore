// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Notification bridge (read-only)
// ==================================================
import type {
  AnalyticsTimeRange,
  NotificationAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";
import { isDateWithinAnalyticsRange } from "@/components/analyticsIntelligence/analyticsTimeRangeEngine";
import { readAiNotificationSnapshot } from "@/components/aiBrain/aiNotificationBridge";
import { listAllNotifications } from "@/components/notificationIntelligence/notificationQueueEngine";

export function readAnalyticsNotificationSnapshot(range: AnalyticsTimeRange) {
  const items = listAllNotifications().filter((item) =>
    isDateWithinAnalyticsRange(item.createdAt, range),
  );

  return {
    summary: readAiNotificationSnapshot().summary,
    itemsInRange: items.length,
    generatedAt: new Date().toISOString(),
  };
}

export function calculateNotificationAnalyticsMetrics(
  range: AnalyticsTimeRange,
): NotificationAnalyticsMetrics {
  const items = listAllNotifications().filter((item) =>
    isDateWithinAnalyticsRange(item.createdAt, range),
  );

  const sentNotifications = items.filter((item) => item.status === "sent").length;
  const failedNotifications = items.filter((item) => item.status === "failed").length;
  const pendingNotifications = items.filter((item) => item.status === "pending").length;
  const retryCount = items.filter((item) => item.retryCount > 0).length;
  const escalationCount = items.filter((item) => item.escalationLevel > 0).length;

  const totalAttempts = sentNotifications + failedNotifications;
  const notificationFailureRate =
    totalAttempts > 0
      ? Math.round((failedNotifications / totalAttempts) * 1000) / 10
      : 0;

  return {
    sentNotifications,
    failedNotifications,
    pendingNotifications,
    retryCount,
    escalationCount,
    notificationFailureRate,
  };
}
