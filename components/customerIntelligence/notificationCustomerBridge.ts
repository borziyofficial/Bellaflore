// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Notification bridge (read-only)
// ==================================================
import { listAllNotifications } from "@/components/notificationIntelligence/notificationQueueEngine";
import { getCustomerProfile } from "@/components/customerIntelligence/customerProfileEngine";

export function readNotificationCustomerSnapshot(customerId: string) {
  const profile = getCustomerProfile(customerId);
  const notifications = listAllNotifications();

  const related = notifications.filter((item) => {
    const orderId = item.payload.orderId;
    if (typeof orderId !== "string" || !orderId || !profile) {
      return false;
    }

    return profile.history.entries.some((entry) => entry.orderId === orderId);
  });

  return {
    customerId,
    totalNotifications: related.length,
    failedNotifications: related.filter((item) => item.status === "failed").length,
    pendingNotifications: related.filter((item) => item.status === "pending").length,
    communicationCount: profile?.communicationHistory.length ?? 0,
    generatedAt: new Date().toISOString(),
  };
}

export function buildNotificationCustomerInsight(customerId: string) {
  const snapshot = readNotificationCustomerSnapshot(customerId);

  return {
    engagementLevel:
      snapshot.totalNotifications >= 5
        ? "high"
        : snapshot.totalNotifications >= 1
          ? "medium"
          : "low",
    failedNotifications: snapshot.failedNotifications,
  };
}
