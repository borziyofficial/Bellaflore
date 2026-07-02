// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: Admin foundation
// ==================================================
import {
  disableNotificationRule,
  enableNotificationRule,
  setNotificationChannelEnabled,
} from "@/components/notificationIntelligence/notificationAdminStore";
import {
  filterNotificationsByPriority,
  filterNotificationsByStatus,
  listAllNotifications,
  retryNotification,
} from "@/components/notificationIntelligence/notificationQueueEngine";
import type {
  NotificationChannel,
  NotificationPriority,
  NotificationQueueItem,
  NotificationStatus,
} from "@/components/notificationIntelligence/notificationIntelligenceTypes";

export function listAdminNotifications(): NotificationQueueItem[] {
  return listAllNotifications();
}

export function filterAdminNotificationsByStatus(
  status: NotificationStatus,
): NotificationQueueItem[] {
  return filterNotificationsByStatus(status);
}

export function filterAdminNotificationsByPriority(
  priority: NotificationPriority,
): NotificationQueueItem[] {
  return filterNotificationsByPriority(priority);
}

export function retryAdminNotification(notificationId: string) {
  return retryNotification(notificationId);
}

export function disableAdminNotificationRule(ruleId: string) {
  return disableNotificationRule(ruleId);
}

export function enableAdminNotificationRule(ruleId: string) {
  return enableNotificationRule(ruleId);
}

export function setAdminNotificationChannelEnabled(
  channel: NotificationChannel,
  enabled: boolean,
) {
  return setNotificationChannelEnabled(channel, enabled);
}
