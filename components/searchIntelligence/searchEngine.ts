// ==================================================
// SECTION: SEARCH INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import { buildSearchExampleRegistryState } from "@/components/searchIntelligence/searchExamples";
import {
  correctSearchTypo,
  listSearchIndexEntries,
  listSearchSynonyms,
  matchSearchIndex,
  normalizeSearchToken,
  resolveSynonymsForTerm,
  seedSearchIndexRegistry,
} from "@/components/searchIntelligence/searchIndexRegistry";
import {
  applySearchRanking,
  calculateSearchAnalyticsSummary,
  inferRankingSignals,
  listAiSearchPreparations,
  listSearchAnalyticsEvents,
  listSearchRankingRules,
  seedSearchRankingRegistry,
} from "@/components/searchIntelligence/searchRankingRegistry";
import {
  listAutocompleteSuggestions,
  listAllRelatedQueries,
  listPopularSearches,
  listRelatedQueries,
  listSearchHistory,
  listSearchSuggestions,
  seedSearchSuggestionRegistry,
} from "@/components/searchIntelligence/searchSuggestionRegistry";
import {
  listTypoCorrections,
} from "@/components/searchIntelligence/searchIndexRegistry";
import type {
  SearchIntelligenceSnapshot,
  SearchQueryResult,
  SearchReadOnlySummary,
  SearchStatistics,
  SmartSearchOptions,
} from "@/components/searchIntelligence/searchTypes";

export const SEARCH_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_search_intelligence_v1";

const ENTITY_TITLES: Record<string, string> = {
  "product-rose-classic": "Классические розы",
  "product-peony-premium": "Пионы Premium",
  "product-tulip-classic": "Весенние тюльпаны",
  "cat-bouquets": "Букеты",
  "collection-spring": "Spring Collection",
};

function resolveEntityTitle(entityId: string, entityKind: string): string {
  return ENTITY_TITLES[entityId] ?? `${entityKind}:${entityId}`;
}

export function smartSearch(
  query: string,
  options: SmartSearchOptions = {},
): SearchQueryResult[] {
  const limit = options.limit ?? 10;
  let effectiveQuery = query;

  if (options.enableTypoCorrection !== false) {
    const correction = correctSearchTypo(query);
    if (correction.wasCorrected) {
      effectiveQuery = correction.corrected;
    }
  }

  const normalized = normalizeSearchToken(effectiveQuery);
  if (!normalized) {
    return [];
  }

  let expandedTerms = [normalized];

  if (options.enableSynonyms !== false) {
    expandedTerms = [
      ...new Set([
        normalized,
        ...normalized.split(/\s+/).flatMap((term) => resolveSynonymsForTerm(term)),
      ]),
    ];
  }

  const matches = matchSearchIndex(effectiveQuery, expandedTerms);
  const indexEntries = listSearchIndexEntries();
  const results: SearchQueryResult[] = [];

  for (const [entityId, payload] of matches.entries()) {
    const entry = indexEntries.find((item) => item.entityId === entityId);
    if (!entry) {
      continue;
    }

    const signals = inferRankingSignals(entry.entityKind);
    const score = applySearchRanking(payload.score, signals);

    results.push({
      entityId,
      entityKind: entry.entityKind,
      title: resolveEntityTitle(entityId, entry.entityKind),
      score,
      matchedTokens: [...payload.matched],
      rankingSignals: signals,
    });
  }

  return results.sort((left, right) => right.score - left.score).slice(0, limit);
}

export function calculateSearchStatistics(): SearchStatistics {
  const analytics = calculateSearchAnalyticsSummary();
  const popular = listPopularSearches(1);

  return {
    totalIndexEntries: listSearchIndexEntries().length,
    totalSuggestions: listSearchSuggestions().length,
    totalSynonyms: listSearchSynonyms().length,
    totalPopularQueries: listPopularSearches().length,
    totalHistoryEntries: listSearchHistory().length,
    zeroResultRate: analytics.zeroResultRate,
    averageResultCount: analytics.averageResultCount,
    topQuery: popular[0]?.query ?? null,
    calculatedAt: new Date().toISOString(),
  };
}

export function buildSearchIntelligenceSnapshot(
  at: Date = new Date(),
): SearchIntelligenceSnapshot {
  return {
    index: listSearchIndexEntries(),
    suggestions: listSearchSuggestions(),
    synonyms: listSearchSynonyms(),
    typoCorrections: listTypoCorrections(),
    rankingRules: listSearchRankingRules(),
    popularQueries: listPopularSearches(),
    relatedQueries: listAllRelatedQueries(),
    history: listSearchHistory(),
    analytics: listSearchAnalyticsEvents(),
    aiPreparations: listAiSearchPreparations(),
    statistics: calculateSearchStatistics(),
    generatedAt: at.toISOString(),
  };
}

export function initializeSearchIntelligence(): SearchIntelligenceSnapshot {
  seedSearchIndexRegistry();
  seedSearchSuggestionRegistry();
  seedSearchRankingRegistry();
  return buildSearchIntelligenceSnapshot();
}

export function getSearchIntelligenceExample() {
  return buildSearchExampleRegistryState().suggestions[0];
}

export function getSearchReadOnlySummary(): SearchReadOnlySummary {
  return {
    indexSize: listSearchIndexEntries().length,
    suggestionCount: listSearchSuggestions().length,
    popularQueryCount: listPopularSearches().length,
    synonymCount: listSearchSynonyms().length,
    historyCount: listSearchHistory().length,
  };
}

export function readSearchFoundationCapabilities(query?: string) {
  const sampleQuery = query ?? "розы";

  return {
    smartSearch: smartSearch(sampleQuery),
    autocomplete: listAutocompleteSuggestions(sampleQuery.slice(0, 3)),
    popularSearches: listPopularSearches(),
    relatedQueries: listRelatedQueries(sampleQuery),
    synonyms: listSearchSynonyms(),
    typoCorrection: correctSearchTypo("rozy"),
    rankingRules: listSearchRankingRules(),
    searchAnalytics: calculateSearchAnalyticsSummary(),
    searchHistory: listSearchHistory(),
    aiSearchPreparation: listAiSearchPreparations(),
    statistics: calculateSearchStatistics(),
  };
}

export const SEARCH_INTELLIGENCE_ENGINE_SCHEMA = {
  module: "searchIntelligence",
  storageKeys: [
    SEARCH_INTELLIGENCE_STORAGE_KEY,
    "bellaflore_search_intelligence_index_v1",
    "bellaflore_search_intelligence_synonyms_v1",
    "bellaflore_search_intelligence_typos_v1",
    "bellaflore_search_intelligence_suggestions_v1",
    "bellaflore_search_intelligence_popular_v1",
    "bellaflore_search_intelligence_related_v1",
    "bellaflore_search_intelligence_history_v1",
    "bellaflore_search_intelligence_ranking_v1",
    "bellaflore_search_intelligence_analytics_v1",
    "bellaflore_search_intelligence_ai_v1",
  ],
  capabilities: [
    "smart_search",
    "search_suggestions",
    "autocomplete",
    "search_ranking",
    "popular_searches",
    "synonyms",
    "typo_correction",
    "related_queries",
    "search_analytics",
    "search_history",
    "ai_search_preparation",
    "search_statistics",
  ],
  layers: [
    { id: "types", file: "searchTypes.ts" },
    { id: "examples", file: "searchExamples.ts" },
    {
      id: "registries",
      files: [
        "searchIndexRegistry.ts",
        "searchSuggestionRegistry.ts",
        "searchRankingRegistry.ts",
      ],
    },
    { id: "engine", file: "searchEngine.ts" },
    { id: "foundation", file: "searchIntelligenceFoundation.ts" },
  ],
  mode: "isolated_foundation",
  wired: false,
} as const;

export function listAllSearchFoundationCapabilities() {
  return readSearchFoundationCapabilities();
}
