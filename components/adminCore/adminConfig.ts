// ==================================================
// SECTION: CONFIG
// РАЗДЕЛ: Конфигурация
//
// Purpose (EN): Configuration constants for adminCore.
//
// Назначение (RU): Константы конфигурации для adminCore.
// ==================================================
import type { AdminConfig, AdminUserRole } from "@/components/adminCore/adminTypes";

export const ADMIN_CONFIG_STORAGE_KEY = "bellaflore_admin_config_v1";

export const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  enabled: true,
  defaultRole: "manager",
  auditLogEnabled: true,
  requirePermissionCheck: true,
  allowOwnerOverride: true,
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function isAdminConfig(value: unknown): value is Partial<AdminConfig> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AdminConfig>;
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
export function readAdminConfigOverride(): AdminConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(ADMIN_CONFIG_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!isAdminConfig(parsedValue)) {
      return null;
    }

    return {
      ...DEFAULT_ADMIN_CONFIG,
      ...parsedValue,
    };
  } catch {
    return null;
  }
}

export function getAdminConfig(): AdminConfig {
  return readAdminConfigOverride() ?? DEFAULT_ADMIN_CONFIG;
}

export function writeAdminConfigOverride(config: AdminConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(ADMIN_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Config override storage is optional.
  }
}

export function getDefaultAdminRole(): AdminUserRole {
  return getAdminConfig().defaultRole;
}
