// ==================================================
// SECTION: CONFIG
// РАЗДЕЛ: Конфигурация
//
// Purpose (EN): Configuration constants for crmCore.
//
// Назначение (RU): Константы конфигурации для crmCore.
// ==================================================
import type { CrmConfig } from "@/components/crmCore/crmTypes";

export const CRM_CONFIG_STORAGE_KEY = "bellaflore_crm_config_v1";

export const DEFAULT_CRM_CONFIG: CrmConfig = {
  enabled: true,
  autoCreateCrmOrder: true,
  autoCreateCustomer: true,
  mergeCustomersByPhone: true,
  crmQueueEnabled: true,
  vipThresholdAmount: 50000,
  highPriorityOrderAmount: 15000,
  blacklistEnabled: true,
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function isCrmConfig(value: unknown): value is Partial<CrmConfig> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CrmConfig>;
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
export function readCrmConfigOverride(): CrmConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(CRM_CONFIG_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!isCrmConfig(parsedValue)) {
      return null;
    }

    return {
      ...DEFAULT_CRM_CONFIG,
      ...parsedValue,
    };
  } catch {
    return null;
  }
}

export function getCrmConfig(): CrmConfig {
  return readCrmConfigOverride() ?? DEFAULT_CRM_CONFIG;
}

export function writeCrmConfigOverride(config: CrmConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CRM_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Config override storage is optional.
  }
}
