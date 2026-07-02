// ==================================================
// SECTION: CONFIG
// РАЗДЕЛ: Конфигурация
//
// Purpose (EN): Configuration constants for deliveryOrchestration.
//
// Назначение (RU): Константы конфигурации для deliveryOrchestration.
// ==================================================
import type { DeliveryOrchestrationConfig } from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";

export const DELIVERY_ORCHESTRATION_CONFIG_STORAGE_KEY =
  "bellaflore_delivery_orchestration_config_v1";

export const DEFAULT_DELIVERY_ORCHESTRATION_CONFIG: DeliveryOrchestrationConfig =
  {
    enabled: true,
    manualAssignmentEnabled: true,
    autoAssignmentEnabled: false,
    routePlannerEnabled: false,
    etaRecalculationEnabled: true,
  };


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function isDeliveryOrchestrationConfig(
  value: unknown,
): value is Partial<DeliveryOrchestrationConfig> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DeliveryOrchestrationConfig>;
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
export function readDeliveryOrchestrationConfigOverride(): DeliveryOrchestrationConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(
      DELIVERY_ORCHESTRATION_CONFIG_STORAGE_KEY,
    );
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!isDeliveryOrchestrationConfig(parsedValue)) {
      return null;
    }

    return {
      ...DEFAULT_DELIVERY_ORCHESTRATION_CONFIG,
      ...parsedValue,
    };
  } catch {
    return null;
  }
}

export function getDeliveryOrchestrationConfig(): DeliveryOrchestrationConfig {
  return readDeliveryOrchestrationConfigOverride() ?? DEFAULT_DELIVERY_ORCHESTRATION_CONFIG;
}

export function writeDeliveryOrchestrationConfigOverride(
  config: DeliveryOrchestrationConfig,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      DELIVERY_ORCHESTRATION_CONFIG_STORAGE_KEY,
      JSON.stringify(config),
    );
  } catch {
    // Config override storage is optional.
  }
}
