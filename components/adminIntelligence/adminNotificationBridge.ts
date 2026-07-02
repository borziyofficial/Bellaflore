// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Notification bridge (read-only)
// ==================================================
import {
  listAdminNotifications,
  filterAdminNotificationsByStatus,
} from "@/components/notificationIntelligence/notificationAdminFoundation";

export type AdminNotificationBridgeSummary = {
  totalNotifications: number;
  pendingNotifications: number;
  failedNotifications: number;
  highPriorityNotifications: number;
  recentNotifications: ReturnType<typeof listAdminNotifications>;
  generatedAt: string;
};

export function buildAdminNotificationSummary(
  limit = 5,
): AdminNotificationBridgeSummary {
  const all = listAdminNotifications();
  const pending = filterAdminNotificationsByStatus("pending");
  const failed = filterAdminNotificationsByStatus("failed");

  return {
    totalNotifications: all.length,
    pendingNotifications: pending.length,
    failedNotifications: failed.length,
    highPriorityNotifications: all.filter(
      (item) => item.priority === "high" || item.priority === "critical",
    ).length,
    recentNotifications: all.slice(0, limit),
    generatedAt: new Date().toISOString(),
  };
}

export function getAdminNotificationAttentionCount(): number {
  const summary = buildAdminNotificationSummary(0);
  return summary.pendingNotifications + summary.failedNotifications;
}
