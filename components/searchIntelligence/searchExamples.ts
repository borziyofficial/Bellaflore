// ==================================================
// SECTION: SEARCH INTELLIGENCE
// РАЗДЕЛ: Seed examples
// ==================================================
import type {
  SearchAiPreparation,
  SearchAnalyticsEvent,
  SearchHistoryEntry,
  SearchIndexEntry,
  SearchPopularQuery,
  SearchRankingRule,
  SearchRelatedQuery,
  SearchSuggestion,
  SearchSynonym,
  SearchTypoCorrection,
} from "@/components/searchIntelligence/searchTypes";

const NOW = new Date().toISOString();

export const SEARCH_EXAMPLE_INDEX: SearchIndexEntry[] = [
  {
    id: "index-rose-title",
    entityId: "product-rose-classic",
    entityKind: "product",
    token: "розы",
    normalizedToken: "розы",
    weight: 10,
    source: "title",
    updatedAt: NOW,
  },
  {
    id: "index-rose-en",
    entityId: "product-rose-classic",
    entityKind: "product",
    token: "rose",
    normalizedToken: "rose",
    weight: 9,
    source: "tag",
    updatedAt: NOW,
  },
  {
    id: "index-peony-title",
    entityId: "product-peony-premium",
    entityKind: "product",
    token: "пионы",
    normalizedToken: "пионы",
    weight: 10,
    source: "title",
    updatedAt: NOW,
  },
  {
    id: "index-tulip-title",
    entityId: "product-tulip-classic",
    entityKind: "product",
    token: "тюльпаны",
    normalizedToken: "тюльпаны",
    weight: 10,
    source: "title",
    updatedAt: NOW,
  },
  {
    id: "index-bouquets-category",
    entityId: "cat-bouquets",
    entityKind: "category",
    token: "букеты",
    normalizedToken: "букеты",
    weight: 8,
    source: "category",
    updatedAt: NOW,
  },
  {
    id: "index-spring-collection",
    entityId: "collection-spring",
    entityKind: "collection",
    token: "весна",
    normalizedToken: "весна",
    weight: 7,
    source: "tag",
    updatedAt: NOW,
  },
];

export const SEARCH_EXAMPLE_SUGGESTIONS: SearchSuggestion[] = [
  {
    id: "suggest-rose-autocomplete",
    kind: "autocomplete",
    label: "Красные розы",
    query: "розы",
    entityId: "product-rose-classic",
    entityKind: "product",
    popularityScore: 92,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "suggest-peony-autocomplete",
    kind: "autocomplete",
    label: "Пионы premium",
    query: "пионы",
    entityId: "product-peony-premium",
    entityKind: "product",
    popularityScore: 85,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "suggest-bouquets-popular",
    kind: "popular",
    label: "Букеты",
    query: "букеты",
    entityId: "cat-bouquets",
    entityKind: "category",
    popularityScore: 88,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "suggest-spring-related",
    kind: "related",
    label: "Весенние цветы",
    query: "весенние цветы",
    entityId: "collection-spring",
    entityKind: "collection",
    popularityScore: 70,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "suggest-recent-rose",
    kind: "recent",
    label: "розы premium",
    query: "розы premium",
    entityId: null,
    entityKind: null,
    popularityScore: 40,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "suggest-ai-gift",
    kind: "ai",
    label: "Букет в подарок маме",
    query: "букет маме",
    entityId: null,
    entityKind: "query",
    popularityScore: 55,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const SEARCH_EXAMPLE_SYNONYMS: SearchSynonym[] = [
  {
    id: "synonym-rose",
    term: "роза",
    synonyms: ["rose", "roses", "розы"],
    direction: "bidirectional",
    locale: "ru",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "synonym-peony",
    term: "пион",
    synonyms: ["peony", "peonies", "пионы"],
    direction: "bidirectional",
    locale: "ru",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "synonym-bouquet",
    term: "букет",
    synonyms: ["bouquet", "композиция", "цветы"],
    direction: "bidirectional",
    locale: "ru",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "synonym-gift",
    term: "подарок",
    synonyms: ["gift", "present", "сюрприз"],
    direction: "forward",
    locale: "ru",
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const SEARCH_EXAMPLE_TYPO_CORRECTIONS: SearchTypoCorrection[] = [
  {
    id: "typo-rozy",
    typo: "rozy",
    correction: "розы",
    confidence: 0.92,
    createdAt: NOW,
  },
  {
    id: "typo-piony",
    typo: "piony",
    correction: "пионы",
    confidence: 0.9,
    createdAt: NOW,
  },
  {
    id: "typo-bukety",
    typo: "bukety",
    correction: "букеты",
    confidence: 0.88,
    createdAt: NOW,
  },
  {
    id: "typo-tulpany",
    typo: "tulpany",
    correction: "тюльпаны",
    confidence: 0.91,
    createdAt: NOW,
  },
];

export const SEARCH_EXAMPLE_RANKING_RULES: SearchRankingRule[] = [
  {
    id: "rank-popularity",
    signal: "popularity",
    weight: 30,
    label: "Популярность",
    isActive: true,
  },
  {
    id: "rank-relevance",
    signal: "relevance",
    weight: 40,
    label: "Релевантность",
    isActive: true,
  },
  {
    id: "rank-recency",
    signal: "recency",
    weight: 10,
    label: "Недавность",
    isActive: true,
  },
  {
    id: "rank-seasonal",
    signal: "seasonal",
    weight: 10,
    label: "Сезонность",
    isActive: true,
  },
  {
    id: "rank-featured",
    signal: "featured",
    weight: 15,
    label: "Featured",
    isActive: true,
  },
  {
    id: "rank-ctr",
    signal: "click_through",
    weight: 20,
    label: "Click-through",
    isActive: true,
  },
];

export const SEARCH_EXAMPLE_POPULAR_QUERIES: SearchPopularQuery[] = [
  {
    id: "popular-rozy",
    query: "розы",
    searchCount: 1240,
    clickCount: 890,
    conversionCount: 210,
    lastSearchedAt: NOW,
  },
  {
    id: "popular-bukety",
    query: "букеты",
    searchCount: 980,
    clickCount: 720,
    conversionCount: 180,
    lastSearchedAt: NOW,
  },
  {
    id: "popular-piony",
    query: "пионы",
    searchCount: 650,
    clickCount: 480,
    conversionCount: 120,
    lastSearchedAt: NOW,
  },
  {
    id: "popular-podarok",
    query: "букет в подарок",
    searchCount: 420,
    clickCount: 310,
    conversionCount: 85,
    lastSearchedAt: NOW,
  },
];

export const SEARCH_EXAMPLE_RELATED_QUERIES: SearchRelatedQuery[] = [
  {
    id: "related-rozy-premium",
    sourceQuery: "розы",
    relatedQuery: "розы premium",
    score: 0.85,
  },
  {
    id: "related-rozy-krasnye",
    sourceQuery: "розы",
    relatedQuery: "красные розы",
    score: 0.82,
  },
  {
    id: "related-piony-vesna",
    sourceQuery: "пионы",
    relatedQuery: "весенние пионы",
    score: 0.78,
  },
  {
    id: "related-bukety-podarok",
    sourceQuery: "букеты",
    relatedQuery: "букет в подарок",
    score: 0.74,
  },
];

export const SEARCH_EXAMPLE_HISTORY: SearchHistoryEntry[] = [
  {
    id: "history-001",
    sessionId: "session-demo-001",
    customerId: "customer-anna-ivanova",
    query: "розы",
    resultCount: 3,
    clickedEntityId: "product-rose-classic",
    searchedAt: "2026-06-20T10:15:00.000Z",
  },
  {
    id: "history-002",
    sessionId: "session-demo-001",
    customerId: "customer-anna-ivanova",
    query: "пионы",
    resultCount: 2,
    clickedEntityId: "product-peony-premium",
    searchedAt: "2026-06-20T10:18:00.000Z",
  },
  {
    id: "history-003",
    sessionId: "session-demo-002",
    customerId: null,
    query: "букет маме",
    resultCount: 5,
    clickedEntityId: null,
    searchedAt: "2026-06-21T14:00:00.000Z",
  },
];

export const SEARCH_EXAMPLE_ANALYTICS: SearchAnalyticsEvent[] = [
  {
    id: "analytics-search-001",
    kind: "search",
    query: "розы",
    entityId: null,
    resultCount: 3,
    occurredAt: "2026-06-20T10:15:00.000Z",
  },
  {
    id: "analytics-click-001",
    kind: "click",
    query: "розы",
    entityId: "product-rose-classic",
    resultCount: 3,
    occurredAt: "2026-06-20T10:15:30.000Z",
  },
  {
    id: "analytics-zero-001",
    kind: "zero_results",
    query: "орхидеи rare",
    entityId: null,
    resultCount: 0,
    occurredAt: "2026-06-19T09:00:00.000Z",
  },
  {
    id: "analytics-autocomplete-001",
    kind: "autocomplete_select",
    query: "пион",
    entityId: "product-peony-premium",
    resultCount: 1,
    occurredAt: "2026-06-21T11:30:00.000Z",
  },
];

export const SEARCH_EXAMPLE_AI_PREPARATIONS: SearchAiPreparation[] = [
  {
    id: "ai-prep-gift-mom",
    title: "Gift search for mom",
    rationale: "Частый запрос «букет маме» — подготовить smart collection",
    suggestedQuery: "букет маме пионы",
    confidence: 0.79,
    status: "suggestion_only",
    createdAt: NOW,
  },
  {
    id: "ai-prep-spring-upsell",
    title: "Spring upsell queries",
    rationale: "Сезонные запросы растут — усилить ranking для spring collection",
    suggestedQuery: "весенние цветы",
    confidence: 0.83,
    status: "suggestion_only",
    createdAt: NOW,
  },
];

export function buildSearchExampleRegistryState() {
  return {
    index: [...SEARCH_EXAMPLE_INDEX],
    suggestions: [...SEARCH_EXAMPLE_SUGGESTIONS],
    synonyms: [...SEARCH_EXAMPLE_SYNONYMS],
    typoCorrections: [...SEARCH_EXAMPLE_TYPO_CORRECTIONS],
    rankingRules: [...SEARCH_EXAMPLE_RANKING_RULES],
    popularQueries: [...SEARCH_EXAMPLE_POPULAR_QUERIES],
    relatedQueries: [...SEARCH_EXAMPLE_RELATED_QUERIES],
    history: [...SEARCH_EXAMPLE_HISTORY],
    analytics: [...SEARCH_EXAMPLE_ANALYTICS],
    aiPreparations: [...SEARCH_EXAMPLE_AI_PREPARATIONS],
  };
}
