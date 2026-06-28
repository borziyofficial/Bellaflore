// ==================================================
// SECTION: CONFIG
// РАЗДЕЛ: Конфигурация
//
// Purpose (EN): Configuration constants for adminWorkspace.
//
// Назначение (RU): Константы конфигурации для adminWorkspace.
// ==================================================
import type { AdminWorkspaceConfig } from "@/components/adminWorkspace/adminWorkspaceTypes";

export const ADMIN_WORKSPACE_CONFIG_STORAGE_KEY =
  "bellaflore_admin_workspace_config_v1";

export const DEFAULT_ADMIN_WORKSPACE_CONFIG: AdminWorkspaceConfig = {
  enabled: true,
  defaultSection: "orders",
  useAccessGuards: true,
  showDisabledSections: false,
  mobileAdminEnabled: true,
  desktopAdminEnabled: true,
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function isAdminWorkspaceConfig(
  value: unknown,
): value is Partial<AdminWorkspaceConfig> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AdminWorkspaceConfig>;
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
export function readAdminWorkspaceConfigOverride(): AdminWorkspaceConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(
      ADMIN_WORKSPACE_CONFIG_STORAGE_KEY,
    );
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!isAdminWorkspaceConfig(parsedValue)) {
      return null;
    }

    return {
      ...DEFAULT_ADMIN_WORKSPACE_CONFIG,
      ...parsedValue,
    };
  } catch {
    return null;
  }
}

export function getAdminWorkspaceConfig(): AdminWorkspaceConfig {
  return (
    readAdminWorkspaceConfigOverride() ?? DEFAULT_ADMIN_WORKSPACE_CONFIG
  );
}

export function writeAdminWorkspaceConfigOverride(
  config: AdminWorkspaceConfig,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ADMIN_WORKSPACE_CONFIG_STORAGE_KEY,
      JSON.stringify(config),
    );
  } catch {
    // Config override storage is optional.
  }
}
