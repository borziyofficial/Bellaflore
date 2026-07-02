// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: Admin config store
// ==================================================
import type {
  NotificationAdminConfig,
  NotificationChannel,
  NotificationRule,
} from "@/components/notificationIntelligence/notificationIntelligenceTypes";
import { getDefaultNotificationRules } from "@/components/notificationIntelligence/notificationRulesCatalog";

export const NOTIFICATION_ADMIN_STORAGE_KEY =
  "bellaflore_notification_intelligence_admin_v1";

export const DEFAULT_NOTIFICATION_ADMIN_CONFIG: NotificationAdminConfig = {
  enabled: true,
  disabledRuleIds: [],
  disabledChannels: [],
  rulesVersion: "bellaflore_notification_intelligence_admin_v1",
  updatedAt: new Date().toISOString(),
};

export function readNotificationAdminConfig(): NotificationAdminConfig {
  if (typeof window === "undefined") {
    return DEFAULT_NOTIFICATION_ADMIN_CONFIG;
  }

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_ADMIN_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_NOTIFICATION_ADMIN_CONFIG;
    }

    const parsed = JSON.parse(raw) as Partial<NotificationAdminConfig>;
    return {
      ...DEFAULT_NOTIFICATION_ADMIN_CONFIG,
      ...parsed,
      disabledRuleIds: parsed.disabledRuleIds ?? [],
      disabledChannels: parsed.disabledChannels ?? [],
    };
  } catch {
    return DEFAULT_NOTIFICATION_ADMIN_CONFIG;
  }
}

export function writeNotificationAdminConfig(
  config: NotificationAdminConfig,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(NOTIFICATION_ADMIN_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Optional admin storage.
  }
}

export function getActiveNotificationRules(): NotificationRule[] {
  const config = readNotificationAdminConfig();
  const disabledRules = new Set(config.disabledRuleIds);
  const disabledChannels = new Set(config.disabledChannels);

  if (!config.enabled) {
    return [];
  }

  return getDefaultNotificationRules()
    .filter((rule) => rule.enabled && !disabledRules.has(rule.id))
    .map((rule) => ({
      ...rule,
      channels: rule.channels.filter((channel) => !disabledChannels.has(channel)),
    }))
    .filter((rule) => rule.channels.length > 0);
}

export function disableNotificationRule(ruleId: string): NotificationAdminConfig {
  const current = readNotificationAdminConfig();
  const next: NotificationAdminConfig = {
    ...current,
    disabledRuleIds: [...new Set([...current.disabledRuleIds, ruleId])],
    updatedAt: new Date().toISOString(),
  };

  writeNotificationAdminConfig(next);
  return next;
}

export function enableNotificationRule(ruleId: string): NotificationAdminConfig {
  const current = readNotificationAdminConfig();
  const next: NotificationAdminConfig = {
    ...current,
    disabledRuleIds: current.disabledRuleIds.filter((id) => id !== ruleId),
    updatedAt: new Date().toISOString(),
  };

  writeNotificationAdminConfig(next);
  return next;
}

export function setNotificationChannelEnabled(
  channel: NotificationChannel,
  enabled: boolean,
): NotificationAdminConfig {
  const current = readNotificationAdminConfig();
  const disabled = new Set(current.disabledChannels);

  if (enabled) {
    disabled.delete(channel);
  } else {
    disabled.add(channel);
  }

  const next: NotificationAdminConfig = {
    ...current,
    disabledChannels: [...disabled],
    updatedAt: new Date().toISOString(),
  };

  writeNotificationAdminConfig(next);
  return next;
}

export function isNotificationChannelEnabled(
  channel: NotificationChannel,
): boolean {
  const config = readNotificationAdminConfig();
  return config.enabled && !config.disabledChannels.includes(channel);
}
