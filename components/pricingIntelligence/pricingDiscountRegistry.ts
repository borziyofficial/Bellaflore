// ==================================================
// SECTION: PRICING INTELLIGENCE
// РАЗДЕЛ: Discount registry
// ==================================================
import { buildPricingExampleRegistryState } from "@/components/pricingIntelligence/pricingExamples";
import type {
  PricingAiPreparation,
  PricingDiscountRule,
  PricingRuleStatus,
  PricingSuggestion,
} from "@/components/pricingIntelligence/pricingTypes";

export const PRICING_DISCOUNT_STORAGE_KEY =
  "bellaflore_pricing_intelligence_discounts_v1";

export const PRICING_SUGGESTIONS_STORAGE_KEY =
  "bellaflore_pricing_intelligence_suggestions_v1";

export const PRICING_AI_STORAGE_KEY =
  "bellaflore_pricing_intelligence_ai_v1";

let inMemoryDiscounts: PricingDiscountRule[] | null = null;
let inMemorySuggestions: PricingSuggestion[] | null = null;
let inMemoryAi: PricingAiPreparation[] | null = null;

function readDiscountsFromStorage(): PricingDiscountRule[] {
  if (typeof window === "undefined") {
    return inMemoryDiscounts ?? buildPricingExampleRegistryState().discounts;
  }

  try {
    const raw = window.localStorage.getItem(PRICING_DISCOUNT_STORAGE_KEY);
    if (!raw) {
      return inMemoryDiscounts ?? buildPricingExampleRegistryState().discounts;
    }

    const parsed = JSON.parse(raw) as PricingDiscountRule[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildPricingExampleRegistryState().discounts;
  } catch {
    return inMemoryDiscounts ?? buildPricingExampleRegistryState().discounts;
  }
}

function writeDiscountsToStorage(discounts: PricingDiscountRule[]): void {
  inMemoryDiscounts = discounts;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PRICING_DISCOUNT_STORAGE_KEY,
      JSON.stringify(discounts),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function readSuggestionsFromStorage(): PricingSuggestion[] {
  if (typeof window === "undefined") {
    return inMemorySuggestions ?? buildPricingExampleRegistryState().suggestions;
  }

  try {
    const raw = window.localStorage.getItem(PRICING_SUGGESTIONS_STORAGE_KEY);
    if (!raw) {
      return inMemorySuggestions ?? buildPricingExampleRegistryState().suggestions;
    }

    const parsed = JSON.parse(raw) as PricingSuggestion[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildPricingExampleRegistryState().suggestions;
  } catch {
    return inMemorySuggestions ?? buildPricingExampleRegistryState().suggestions;
  }
}

function writeSuggestionsToStorage(suggestions: PricingSuggestion[]): void {
  inMemorySuggestions = suggestions;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      PRICING_SUGGESTIONS_STORAGE_KEY,
      JSON.stringify(suggestions),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function readAiFromStorage(): PricingAiPreparation[] {
  if (typeof window === "undefined") {
    return inMemoryAi ?? buildPricingExampleRegistryState().aiPreparations;
  }

  try {
    const raw = window.localStorage.getItem(PRICING_AI_STORAGE_KEY);
    if (!raw) {
      return inMemoryAi ?? buildPricingExampleRegistryState().aiPreparations;
    }

    const parsed = JSON.parse(raw) as PricingAiPreparation[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildPricingExampleRegistryState().aiPreparations;
  } catch {
    return inMemoryAi ?? buildPricingExampleRegistryState().aiPreparations;
  }
}

function writeAiToStorage(preparations: PricingAiPreparation[]): void {
  inMemoryAi = preparations;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PRICING_AI_STORAGE_KEY, JSON.stringify(preparations));
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

export function listDiscountRules(at: Date = new Date()): PricingDiscountRule[] {
  return readDiscountsFromStorage()
    .filter((rule) => rule.status === "active")
    .filter((rule) => isWithinWindow(rule.validFrom, rule.validUntil, at));
}

export function getDiscountRuleById(ruleId: string): PricingDiscountRule | null {
  return readDiscountsFromStorage().find((rule) => rule.id === ruleId) ?? null;
}

export function getDiscountRuleByCode(code: string): PricingDiscountRule | null {
  const normalized = code.trim().toUpperCase();
  return (
    readDiscountsFromStorage().find(
      (rule) => rule.code?.toUpperCase() === normalized,
    ) ?? null
  );
}

export function calculateDiscountAmount(
  orderTotalRub: number,
  rule: PricingDiscountRule,
): number {
  if (rule.minOrderRub !== null && orderTotalRub < rule.minOrderRub) {
    return 0;
  }

  if (rule.discountType === "percent") {
    return Math.round((orderTotalRub * rule.discountValue) / 100);
  }

  if (rule.discountType === "fixed_rub") {
    return Math.min(orderTotalRub, rule.discountValue);
  }

  return 0;
}

export function listPriceSuggestions(): PricingSuggestion[] {
  return readSuggestionsFromStorage();
}

export function getPriceSuggestionById(suggestionId: string): PricingSuggestion | null {
  return readSuggestionsFromStorage().find((item) => item.id === suggestionId) ?? null;
}

export function listPriceSuggestionsByProduct(productId: string): PricingSuggestion[] {
  return readSuggestionsFromStorage().filter((item) => item.productId === productId);
}

export function listAiPricePreparations(): PricingAiPreparation[] {
  return readAiFromStorage();
}

export function getAiPricePreparationById(
  preparationId: string,
): PricingAiPreparation | null {
  return readAiFromStorage().find((item) => item.id === preparationId) ?? null;
}

export function registerDiscountRule(rule: PricingDiscountRule): PricingDiscountRule {
  const rules = readDiscountsFromStorage();
  const index = rules.findIndex((entry) => entry.id === rule.id);
  const next =
    index === -1
      ? [...rules, rule]
      : rules.map((entry, entryIndex) => (entryIndex === index ? rule : entry));

  writeDiscountsToStorage(next);
  return rule;
}

export function registerPriceSuggestion(suggestion: PricingSuggestion): PricingSuggestion {
  const suggestions = readSuggestionsFromStorage();
  const index = suggestions.findIndex((entry) => entry.id === suggestion.id);
  const next =
    index === -1
      ? [...suggestions, suggestion]
      : suggestions.map((entry, entryIndex) => (entryIndex === index ? suggestion : entry));

  writeSuggestionsToStorage(next);
  return suggestion;
}

export function registerAiPricePreparation(
  preparation: PricingAiPreparation,
): PricingAiPreparation {
  const items = readAiFromStorage();
  const index = items.findIndex((entry) => entry.id === preparation.id);
  const next =
    index === -1
      ? [...items, preparation]
      : items.map((entry, entryIndex) => (entryIndex === index ? preparation : entry));

  writeAiToStorage(next);
  return preparation;
}

export function seedPricingDiscountRegistry(): PricingDiscountRule[] {
  const seed = buildPricingExampleRegistryState();
  writeDiscountsToStorage(seed.discounts);
  writeSuggestionsToStorage(seed.suggestions);
  writeAiToStorage(seed.aiPreparations);
  return listDiscountRules();
}

export function clearPricingDiscountRegistry(): void {
  writeDiscountsToStorage([]);
  writeSuggestionsToStorage([]);
  writeAiToStorage([]);
}

export function resolveDiscountStatus(
  rule: PricingDiscountRule,
  at: Date = new Date(),
): PricingRuleStatus {
  if (rule.maxUses !== null && rule.usedCount >= rule.maxUses) {
    return "expired";
  }

  if (!isWithinWindow(rule.validFrom, rule.validUntil, at)) {
    return "expired";
  }

  return rule.status;
}
