// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Notification bridge (read-only)
// ==================================================
import { buildAdminNotificationSummary } from "@/components/adminIntelligence/adminNotificationBridge";
import { filterAdminNotificationsByStatus } from "@/components/notificationIntelligence/notificationAdminFoundation";

export type AiNotificationBridgeSnapshot = {
  summary: ReturnType<typeof buildAdminNotificationSummary>;
  failedNotificationIds: string[];
  pendingNotificationIds: string[];
  generatedAt: string;
};

export function readAiNotificationSnapshot(): AiNotificationBridgeSnapshot {
  const summary = buildAdminNotificationSummary(8);

  return {
    summary,
    failedNotificationIds: filterAdminNotificationsByStatus("failed").map(
      (item) => item.id,
    ),
    pendingNotificationIds: filterAdminNotificationsByStatus("pending").map(
      (item) => item.id,
    ),
    generatedAt: new Date().toISOString(),
  };
}
