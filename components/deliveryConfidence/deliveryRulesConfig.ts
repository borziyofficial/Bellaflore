// ==================================================
// SECTION: DELIVERY CONFIDENCE
// РАЗДЕЛ: Уверенность доставки
//
// Purpose (EN):
// Business rules and thresholds for delivery confidence scoring.
//
// Назначение (RU):
// Бизнес-правила и пороги оценки уверенности доставки.
// ==================================================
import {
  DELIVERY_ZONE_DEFINITIONS,
  DELIVERY_ZONE_MAX_DISTANCE_KM,
} from "@/components/deliveryZones/deliveryZoneConfig";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import type {
  DeliveryRulesConfig,
  DeliveryZoneRule,
  ZoneEstimatedDeliveryTime,
} from "@/components/deliveryConfidence/deliveryConfidenceTypes";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export const DELIVERY_RULES_STORAGE_KEY = "bellaflore_delivery_rules_v1";
export const DELIVERY_RULES_VERSION = "bellaflore_delivery_rules_v1";

const DEFAULT_ZONE_ETA: Record<DeliveryZoneId, ZoneEstimatedDeliveryTime> = {
  base: { label: "1–1.5 ч", minMinutes: 60, maxMinutes: 90 },
  "7km": { label: "1.5–2 ч", minMinutes: 90, maxMinutes: 120 },
  "14km": { label: "2–2.5 ч", minMinutes: 120, maxMinutes: 150 },
  "21km": { label: "2.5–3 ч", minMinutes: 150, maxMinutes: 180 },
  "28km": { label: "3–3.5 ч", minMinutes: 180, maxMinutes: 210 },
  "38km": { label: "3.5–4 ч", minMinutes: 210, maxMinutes: 240 },
  "48km": { label: "4–4.5 ч", minMinutes: 240, maxMinutes: 270 },
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN):
// Private helper functions used within this module.
//
// Назначение (RU):
// Приватные вспомогательные функции модуля.
// ==================================================
function buildDefaultZoneRules(): DeliveryRulesConfig["zones"] {
  const zones: DeliveryRulesConfig["zones"] = {};

  for (const zone of DELIVERY_ZONE_DEFINITIONS) {
    const isFarZone = zone.zoneId === "38km" || zone.zoneId === "48km";

    zones[zone.zoneId] = {
      deliveryPrice: zone.priceRub,
      freeDeliveryEnabled: !isFarZone,
      freeDeliveryFromAmount: isFarZone ? null : 15000,
    };
  }

  return zones;
}

function buildDefaultDeliveryPriceByZone(): DeliveryRulesConfig["deliveryPriceByZone"] {
  const prices: DeliveryRulesConfig["deliveryPriceByZone"] = {};

  for (const zone of DELIVERY_ZONE_DEFINITIONS) {
    prices[zone.zoneId] = zone.priceRub;
  }

  return prices;
}

export const DEFAULT_DELIVERY_RULES: DeliveryRulesConfig = {
  enabled: true,
  freeDeliveryEnabled: true,
  defaultFreeDeliveryFromAmount: 15000,
  freeDeliveryMessage: "Бесплатная доставка",
  minimumOrderAmount: 1500,
  maxDeliveryDistanceKm: DELIVERY_ZONE_MAX_DISTANCE_KM,
  allowOutsideZone: false,
  deliveryPriceByZone: buildDefaultDeliveryPriceByZone(),
  estimatedDeliveryTimeByZone: DEFAULT_ZONE_ETA,
  workingHours: {
    startTime: "09:00",
    endTime: "23:00",
  },
  sameDayCutoffTime: "18:00",
  holidayRules: {
    enabled: false,
    holidays: [],
  },
  zones: buildDefaultZoneRules(),
  rulesVersion: DELIVERY_RULES_VERSION,
  updatedAt: new Date().toISOString(),
};

function isDeliveryRulesConfig(value: unknown): value is Partial<DeliveryRulesConfig> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<DeliveryRulesConfig>;

  return (
    typeof candidate.freeDeliveryEnabled === "boolean" &&
    typeof candidate.rulesVersion === "string" &&
    candidate.zones !== undefined &&
    typeof candidate.zones === "object"
  );
}

export function mergeDeliveryRulesConfig(
  base: DeliveryRulesConfig,
  override: Partial<DeliveryRulesConfig> | null,
): DeliveryRulesConfig {
  if (!override) {
    return base;
  }

  return {
    ...base,
    ...override,
    deliveryPriceByZone: {
      ...base.deliveryPriceByZone,
      ...override.deliveryPriceByZone,
    },
    estimatedDeliveryTimeByZone: {
      ...base.estimatedDeliveryTimeByZone,
      ...override.estimatedDeliveryTimeByZone,
    },
    workingHours: {
      ...base.workingHours,
      ...override.workingHours,
    },
    holidayRules: {
      ...base.holidayRules,
      ...override.holidayRules,
      holidays: override.holidayRules?.holidays ?? base.holidayRules.holidays,
    },
    zones: {
      ...base.zones,
      ...override.zones,
    },
    updatedAt: override.updatedAt ?? base.updatedAt,
    rulesVersion: override.rulesVersion ?? base.rulesVersion,
  };
}

export function readDeliveryRulesOverride(): DeliveryRulesConfig | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(DELIVERY_RULES_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!isDeliveryRulesConfig(parsedValue)) {
      return null;
    }

    return mergeDeliveryRulesConfig(DEFAULT_DELIVERY_RULES, parsedValue);
  } catch {
    return null;
  }
}

export function writeDeliveryRulesOverride(config: DeliveryRulesConfig): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      DELIVERY_RULES_STORAGE_KEY,
      JSON.stringify(config),
    );
  } catch {
    // Admin override storage is optional.
  }
}

export function getDeliveryRulesConfig(): DeliveryRulesConfig {
  return readDeliveryRulesOverride() ?? DEFAULT_DELIVERY_RULES;
}

export function resolveZoneDeliveryRule(
  rules: DeliveryRulesConfig,
  zoneId: DeliveryZoneId,
): DeliveryZoneRule | null {
  return rules.zones[zoneId] ?? null;
}

export function resolveZoneDeliveryPriceFromRules(
  rules: DeliveryRulesConfig,
  zoneId: DeliveryZoneId,
): number | null {
  const configuredPrice = rules.deliveryPriceByZone[zoneId];
  if (typeof configuredPrice === "number" && Number.isFinite(configuredPrice)) {
    return configuredPrice;
  }

  const zoneRule = resolveZoneDeliveryRule(rules, zoneId);
  return zoneRule?.deliveryPrice ?? null;
}

export function resolveZoneEstimatedDeliveryTime(
  rules: DeliveryRulesConfig,
  zoneId: DeliveryZoneId,
): ZoneEstimatedDeliveryTime | null {
  return rules.estimatedDeliveryTimeByZone[zoneId] ?? null;
}
