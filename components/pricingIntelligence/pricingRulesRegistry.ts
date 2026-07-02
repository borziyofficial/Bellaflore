// ==================================================
// SECTION: PRICING INTELLIGENCE
// РАЗДЕЛ: Rules registry
// ==================================================
import { buildPricingExampleRegistryState } from "@/components/pricingIntelligence/pricingExamples";
import type {
  PricingDeliveryRule,
  PricingListFilters,
  PricingRule,
  PricingRuleKind,
  PricingRuleStatus,
  PricingSeason,
  PricingVipLevel,
  PricingZoneRate,
} from "@/components/pricingIntelligence/pricingTypes";

export const PRICING_RULES_STORAGE_KEY =
  "bellaflore_pricing_intelligence_rules_v1";

export const PRICING_ZONE_RATES_STORAGE_KEY =
  "bellaflore_pricing_intelligence_zone_rates_v1";

export const PRICING_DELIVERY_RULES_STORAGE_KEY =
  "bellaflore_pricing_intelligence_delivery_rules_v1";

let inMemoryRules: PricingRule[] | null = null;
let inMemoryZoneRates: PricingZoneRate[] | null = null;
let inMemoryDeliveryRules: PricingDeliveryRule[] | null = null;

function readRulesFromStorage(): PricingRule[] {
  if (typeof window === "undefined") {
    return inMemoryRules ?? buildPricingExampleRegistryState().rules;
  }

  try {
    const raw = window.localStorage.getItem(PRICING_RULES_STORAGE_KEY);
    if (!raw) {
      return inMemoryRules ?? buildPricingExampleRegistryState().rules;
    }

    const parsed = JSON.parse(raw) as PricingRule[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildPricingExampleRegistryState().rules;
  } catch {
    return inMemoryRules ?? buildPricingExampleRegistryState().rules;
  }
}

function writeRulesToStorage(rules: PricingRule[]): void {
  inMemoryRules = rules;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PRICING_RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch {
    // In-memory fallback remains active.
  }
}

function readZoneRatesFromStorage(): PricingZoneRate[] {
  if (typeof window === "undefined") {
    return inMemoryZoneRates ?? buildPricingExampleRegistryState().zoneRates;
  }

  try {
    const raw = window.localStorage.getItem(PRICING_ZONE_RATES_STORAGE_KEY);
    if (!raw) {
      return inMemoryZoneRates ?? buildPricingExampleRegistryState().zoneRates;
    }

    const parsed = JSON.parse(raw) as PricingZoneRate[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildPricingExampleRegistryState().zoneRates;
  } catch {
    return inMemoryZoneRates ?? buildPricingExampleRegistryState().zoneRates;
  }
}

function writeZoneRatesToStorage(rates: PricingZoneRate[]): void {
  inMemoryZoneRates = rates;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PRICING_ZONE_RATES_STORAGE_KEY, JSON.stringify(rates));
  } catch {
    // In-memory fallback remains active.
  }
}

function readDeliveryRulesFromStorage(): PricingDeliveryRule[] {
  if (typeof window === "undefined") {
    return inMemoryDeliveryRules ?? buildPricingExampleRegistryState().deliveryRules;
  }

  try {
    const raw = window.localStorage.getItem(PRICING_DELIVERY_RULES_STORAGE_KEY);
    if (!raw) {
      return inMemoryDeliveryRules ?? buildPricingExampleRegistryState().deliveryRules;
    }

    const parsed = JSON.parse(raw) as PricingDeliveryRule[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildPricingExampleRegistryState().deliveryRules;
  } catch {
    return inMemoryDeliveryRules ?? buildPricingExampleRegistryState().deliveryRules;
  }
}

function writeDeliveryRulesToStorage(rules: PricingDeliveryRule[]): void {
  inMemoryDeliveryRules = rules;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PRICING_DELIVERY_RULES_STORAGE_KEY,
      JSON.stringify(rules),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function isWithinWindow(
  validFrom: string,
  validUntil: string | null,
  at: Date,
): boolean {
  const timestamp = at.getTime();
  const starts = new Date(validFrom).getTime();
  const ends = validUntil ? new Date(validUntil).getTime() : null;

  return starts <= timestamp && (ends === null || ends >= timestamp);
}

function matchesKind(rule: PricingRule, kind?: PricingListFilters["kind"]): boolean {
  if (!kind) {
    return true;
  }

  if (Array.isArray(kind)) {
    return kind.includes(rule.kind);
  }

  return rule.kind === kind;
}

export function listPricingRules(filters: PricingListFilters = {}): PricingRule[] {
  return readRulesFromStorage()
    .filter((rule) => matchesKind(rule, filters.kind))
    .filter((rule) => (filters.status ? rule.status === filters.status : true))
    .filter((rule) =>
      filters.zoneId ? rule.zoneIds.includes(filters.zoneId) : true,
    )
    .filter((rule) =>
      filters.productId ? rule.productIds.includes(filters.productId) : true,
    )
    .sort((left, right) => right.priority - left.priority);
}

export function getPricingRuleById(ruleId: string): PricingRule | null {
  return readRulesFromStorage().find((rule) => rule.id === ruleId) ?? null;
}

export function listActivePricingRules(at: Date = new Date()): PricingRule[] {
  return listPricingRules({ status: "active" }).filter((rule) =>
    isWithinWindow(rule.validFrom, rule.validUntil, at),
  );
}

export function listPricingRulesByKind(kind: PricingRuleKind): PricingRule[] {
  return listPricingRules({ kind, status: "active" });
}

export function listDynamicPricingRules(): PricingRule[] {
  return listPricingRulesByKind("dynamic");
}

export function listZonePricingRules(): PricingRule[] {
  return listPricingRulesByKind("zone");
}

export function listHolidayPricingRules(): PricingRule[] {
  return listPricingRulesByKind("holiday");
}

export function listSeasonalPricingRules(): PricingRule[] {
  return listPricingRulesByKind("seasonal");
}

export function listVipPricingRules(): PricingRule[] {
  return listPricingRulesByKind("vip");
}

export function listZoneRates(): PricingZoneRate[] {
  return readZoneRatesFromStorage().filter((rate) => rate.isActive);
}

export function getZoneRateById(zoneId: string): PricingZoneRate | null {
  return readZoneRatesFromStorage().find((rate) => rate.zoneId === zoneId) ?? null;
}

export function listDeliveryPriceRules(at: Date = new Date()): PricingDeliveryRule[] {
  return readDeliveryRulesFromStorage()
    .filter((rule) => rule.status === "active")
    .filter((rule) => isWithinWindow(rule.validFrom, rule.validUntil, at));
}

export function getDeliveryPriceRuleByZone(
  zoneId: string,
  at: Date = new Date(),
): PricingDeliveryRule | null {
  return (
    listDeliveryPriceRules(at).find((rule) => rule.zoneId === zoneId) ?? null
  );
}

export function resolveApplicablePricingRules(input: {
  productId: string;
  categoryIds?: string[];
  zoneId?: string | null;
  vipLevel?: PricingVipLevel;
  season?: PricingSeason;
  orderDate?: Date;
}): PricingRule[] {
  const at = input.orderDate ?? new Date();

  return listActivePricingRules(at).filter((rule) => {
    if (rule.productIds.length > 0 && !rule.productIds.includes(input.productId)) {
      return false;
    }

    if (
      rule.categoryIds.length > 0 &&
      !(input.categoryIds ?? []).some((id) => rule.categoryIds.includes(id))
    ) {
      return false;
    }

    if (rule.zoneIds.length > 0 && input.zoneId && !rule.zoneIds.includes(input.zoneId)) {
      return false;
    }

    if (
      rule.vipLevels.length > 0 &&
      input.vipLevel !== undefined &&
      !rule.vipLevels.includes(input.vipLevel)
    ) {
      return false;
    }

    if (rule.seasons.length > 0 && input.season && !rule.seasons.includes(input.season)) {
      return false;
    }

    return true;
  });
}

export function registerPricingRule(rule: PricingRule): PricingRule {
  const rules = readRulesFromStorage();
  const index = rules.findIndex((entry) => entry.id === rule.id);
  const next =
    index === -1
      ? [...rules, rule]
      : rules.map((entry, entryIndex) => (entryIndex === index ? rule : entry));

  writeRulesToStorage(next);
  return rule;
}

export function registerZoneRate(rate: PricingZoneRate): PricingZoneRate {
  const rates = readZoneRatesFromStorage();
  const index = rates.findIndex((entry) => entry.id === rate.id);
  const next =
    index === -1
      ? [...rates, rate]
      : rates.map((entry, entryIndex) => (entryIndex === index ? rate : entry));

  writeZoneRatesToStorage(next);
  return rate;
}

export function registerDeliveryPriceRule(rule: PricingDeliveryRule): PricingDeliveryRule {
  const rules = readDeliveryRulesFromStorage();
  const index = rules.findIndex((entry) => entry.id === rule.id);
  const next =
    index === -1
      ? [...rules, rule]
      : rules.map((entry, entryIndex) => (entryIndex === index ? rule : entry));

  writeDeliveryRulesToStorage(next);
  return rule;
}

export function seedPricingRulesRegistry(): PricingRule[] {
  const seed = buildPricingExampleRegistryState();
  writeRulesToStorage(seed.rules);
  writeZoneRatesToStorage(seed.zoneRates);
  writeDeliveryRulesToStorage(seed.deliveryRules);
  return listPricingRules();
}

export function clearPricingRulesRegistry(): void {
  writeRulesToStorage([]);
  writeZoneRatesToStorage([]);
  writeDeliveryRulesToStorage([]);
}

export function resolveRuleStatus(
  rule: PricingRule,
  at: Date = new Date(),
): PricingRuleStatus {
  if (!isWithinWindow(rule.validFrom, rule.validUntil, at)) {
    return "expired";
  }

  return rule.status;
}
