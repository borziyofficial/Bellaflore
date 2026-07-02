// ==================================================
// SECTION: CONFIG
// РАЗДЕЛ: Конфигурация
//
// Purpose (EN): Configuration constants for notificationEventBus.
//
// Назначение (RU): Константы конфигурации для notificationEventBus.
// ==================================================
import type { NotificationEventConfig } from "@/components/notificationEventBus/notificationEventTypes";

export const NOTIFICATION_EVENT_CONFIG_STORAGE_KEY =
  "bellaflore_notification_event_config_v1";

export const DEFAULT_NOTIFICATION_EVENT_CONFIG: NotificationEventConfig = {
  enabled: true,
  telegramEnabled: false,
  crmEnabled: true,
  adminEnabled: true,
  customerEnabled: true,
  courierEnabled: true,
  analyticsEnabled: true,
  persistEvents: true,
  autoProcessEvents: false,
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function isNotificationEventConfig(
  value: unknown,
): value is Partial<NotificationEventConfig> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<NotificationEventConfig>;
  return typeof candidate.enabled === "boolean";
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function readNotificationEventConfigOverride(): NotificationEventConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(
      NOTIFICATION_EVENT_CONFIG_STORAGE_KEY,
    );
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!isNotificationEventConfig(parsedValue)) {
      return null;
    }

    return {
      ...DEFAULT_NOTIFICATION_EVENT_CONFIG,
      ...parsedValue,
    };
  } catch {
    return null;
  }
}

export function getNotificationEventConfig(): NotificationEventConfig {
  return (
    readNotificationEventConfigOverride() ?? DEFAULT_NOTIFICATION_EVENT_CONFIG
  );
}

export function writeNotificationEventConfigOverride(
  config: NotificationEventConfig,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      NOTIFICATION_EVENT_CONFIG_STORAGE_KEY,
      JSON.stringify(config),
    );
  } catch {
    // Config override storage is optional.
  }
}

export function isNotificationChannelEnabled(
  channel: keyof Pick<
    NotificationEventConfig,
    | "telegramEnabled"
    | "crmEnabled"
    | "adminEnabled"
    | "customerEnabled"
    | "courierEnabled"
    | "analyticsEnabled"
  >,
): boolean {
  const config = getNotificationEventConfig();
  return config[channel];
}
