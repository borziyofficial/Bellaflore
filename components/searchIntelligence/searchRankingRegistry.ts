// ==================================================
// SECTION: SEARCH INTELLIGENCE
// РАЗДЕЛ: Ranking registry
// ==================================================
import { buildSearchExampleRegistryState } from "@/components/searchIntelligence/searchExamples";
import type {
  SearchAiPreparation,
  SearchAnalyticsEvent,
  SearchRankingRule,
  SearchRankingSignal,
} from "@/components/searchIntelligence/searchTypes";

export const SEARCH_RANKING_STORAGE_KEY =
  "bellaflore_search_intelligence_ranking_v1";

export const SEARCH_ANALYTICS_STORAGE_KEY =
  "bellaflore_search_intelligence_analytics_v1";

export const SEARCH_AI_STORAGE_KEY =
  "bellaflore_search_intelligence_ai_v1";

let inMemoryRanking: SearchRankingRule[] | null = null;
let inMemoryAnalytics: SearchAnalyticsEvent[] | null = null;
let inMemoryAi: SearchAiPreparation[] | null = null;

function readRankingFromStorage(): SearchRankingRule[] {
  if (typeof window === "undefined") {
    return inMemoryRanking ?? buildSearchExampleRegistryState().rankingRules;
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_RANKING_STORAGE_KEY);
    if (!raw) {
      return inMemoryRanking ?? buildSearchExampleRegistryState().rankingRules;
    }

    const parsed = JSON.parse(raw) as SearchRankingRule[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSearchExampleRegistryState().rankingRules;
  } catch {
    return inMemoryRanking ?? buildSearchExampleRegistryState().rankingRules;
  }
}

function writeRankingToStorage(rules: SearchRankingRule[]): void {
  inMemoryRanking = rules;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SEARCH_RANKING_STORAGE_KEY, JSON.stringify(rules));
  } catch {
    // In-memory fallback remains active.
  }
}

function readAnalyticsFromStorage(): SearchAnalyticsEvent[] {
  if (typeof window === "undefined") {
    return inMemoryAnalytics ?? buildSearchExampleRegistryState().analytics;
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_ANALYTICS_STORAGE_KEY);
    if (!raw) {
      return inMemoryAnalytics ?? buildSearchExampleRegistryState().analytics;
    }

    const parsed = JSON.parse(raw) as SearchAnalyticsEvent[];
    return Array.isArray(parsed) ? parsed : buildSearchExampleRegistryState().analytics;
  } catch {
    return inMemoryAnalytics ?? buildSearchExampleRegistryState().analytics;
  }
}

function writeAnalyticsToStorage(events: SearchAnalyticsEvent[]): void {
  inMemoryAnalytics = events;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SEARCH_ANALYTICS_STORAGE_KEY, JSON.stringify(events));
  } catch {
    // In-memory fallback remains active.
  }
}

function readAiFromStorage(): SearchAiPreparation[] {
  if (typeof window === "undefined") {
    return inMemoryAi ?? buildSearchExampleRegistryState().aiPreparations;
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_AI_STORAGE_KEY);
    if (!raw) {
      return inMemoryAi ?? buildSearchExampleRegistryState().aiPreparations;
    }

    const parsed = JSON.parse(raw) as SearchAiPreparation[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSearchExampleRegistryState().aiPreparations;
  } catch {
    return inMemoryAi ?? buildSearchExampleRegistryState().aiPreparations;
  }
}

function writeAiToStorage(preparations: SearchAiPreparation[]): void {
  inMemoryAi = preparations;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SEARCH_AI_STORAGE_KEY, JSON.stringify(preparations));
  } catch {
    // In-memory fallback remains active.
  }
}

export function listSearchRankingRules(): SearchRankingRule[] {
  return readRankingFromStorage()
    .filter((rule) => rule.isActive)
    .sort((left, right) => right.weight - left.weight);
}

export function getSearchRankingRuleBySignal(
  signal: SearchRankingSignal,
): SearchRankingRule | null {
  return readRankingFromStorage().find((rule) => rule.signal === signal) ?? null;
}

export function applySearchRanking(
  baseScore: number,
  signals: SearchRankingSignal[],
): number {
  const rules = listSearchRankingRules();
  let bonus = 0;

  for (const signal of signals) {
    const rule = rules.find((entry) => entry.signal === signal);
    if (rule) {
      bonus += rule.weight;
    }
  }

  return baseScore + bonus;
}

export function listSearchAnalyticsEvents(): SearchAnalyticsEvent[] {
  return readAnalyticsFromStorage().sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );
}

export function listSearchAnalyticsByKind(
  kind: SearchAnalyticsEvent["kind"],
): SearchAnalyticsEvent[] {
  return listSearchAnalyticsEvents().filter((event) => event.kind === kind);
}

export function calculateSearchAnalyticsSummary() {
  const events = listSearchAnalyticsEvents();
  const searches = events.filter((event) => event.kind === "search");
  const zeroResults = events.filter((event) => event.kind === "zero_results");

  const totalResults = searches.reduce((sum, event) => sum + event.resultCount, 0);

  return {
    totalEvents: events.length,
    totalSearches: searches.length,
    zeroResultCount: zeroResults.length,
    zeroResultRate:
      searches.length > 0
        ? Math.round((zeroResults.length / searches.length) * 1000) / 10
        : 0,
    averageResultCount:
      searches.length > 0 ? Math.round(totalResults / searches.length) : 0,
    generatedAt: new Date().toISOString(),
  };
}

export function listAiSearchPreparations(): SearchAiPreparation[] {
  return readAiFromStorage();
}

export function getAiSearchPreparationById(
  preparationId: string,
): SearchAiPreparation | null {
  return readAiFromStorage().find((item) => item.id === preparationId) ?? null;
}

export function registerSearchRankingRule(rule: SearchRankingRule): SearchRankingRule {
  const rules = readRankingFromStorage();
  const index = rules.findIndex((item) => item.id === rule.id);
  const next =
    index === -1
      ? [...rules, rule]
      : rules.map((item, itemIndex) => (itemIndex === index ? rule : item));

  writeRankingToStorage(next);
  return rule;
}

export function registerSearchAnalyticsEvent(
  event: SearchAnalyticsEvent,
): SearchAnalyticsEvent {
  writeAnalyticsToStorage([event, ...readAnalyticsFromStorage()]);
  return event;
}

export function registerAiSearchPreparation(
  preparation: SearchAiPreparation,
): SearchAiPreparation {
  const items = readAiFromStorage();
  const index = items.findIndex((item) => item.id === preparation.id);
  const next =
    index === -1
      ? [...items, preparation]
      : items.map((item, itemIndex) => (itemIndex === index ? preparation : item));

  writeAiToStorage(next);
  return preparation;
}

export function seedSearchRankingRegistry(): SearchRankingRule[] {
  const seed = buildSearchExampleRegistryState();
  writeRankingToStorage(seed.rankingRules);
  writeAnalyticsToStorage(seed.analytics);
  writeAiToStorage(seed.aiPreparations);
  return listSearchRankingRules();
}

export function clearSearchRankingRegistry(): void {
  writeRankingToStorage([]);
  writeAnalyticsToStorage([]);
  writeAiToStorage([]);
}

export function inferRankingSignals(entityKind: string): SearchRankingSignal[] {
  const signals: SearchRankingSignal[] = ["relevance"];

  if (entityKind === "product") {
    signals.push("popularity", "featured");
  }

  if (entityKind === "collection") {
    signals.push("seasonal");
  }

  return signals;
}
