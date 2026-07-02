// ==================================================
// SECTION: SEARCH INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================

export type SearchResultKind =
  | "product"
  | "category"
  | "collection"
  | "query"
  | "suggestion";

export type SearchSuggestionKind =
  | "autocomplete"
  | "popular"
  | "related"
  | "recent"
  | "ai";

export type SearchSynonymDirection = "bidirectional" | "forward";

export type SearchRankingSignal =
  | "popularity"
  | "relevance"
  | "recency"
  | "seasonal"
  | "featured"
  | "click_through";

export type SearchAiPreparationStatus = "suggestion_only";

export type SearchIndexEntry = {
  id: string;
  entityId: string;
  entityKind: SearchResultKind;
  token: string;
  normalizedToken: string;
  weight: number;
  source: "title" | "tag" | "category" | "synonym" | "query";
  updatedAt: string;
};

export type SearchSuggestion = {
  id: string;
  kind: SearchSuggestionKind;
  label: string;
  query: string;
  entityId: string | null;
  entityKind: SearchResultKind | null;
  popularityScore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SearchSynonym = {
  id: string;
  term: string;
  synonyms: string[];
  direction: SearchSynonymDirection;
  locale: string;
  createdAt: string;
  updatedAt: string;
};

export type SearchTypoCorrection = {
  id: string;
  typo: string;
  correction: string;
  confidence: number;
  createdAt: string;
};

export type SearchRankingRule = {
  id: string;
  signal: SearchRankingSignal;
  weight: number;
  label: string;
  isActive: boolean;
};

export type SearchPopularQuery = {
  id: string;
  query: string;
  searchCount: number;
  clickCount: number;
  conversionCount: number;
  lastSearchedAt: string;
};

export type SearchRelatedQuery = {
  id: string;
  sourceQuery: string;
  relatedQuery: string;
  score: number;
};

export type SearchHistoryEntry = {
  id: string;
  sessionId: string;
  customerId: string | null;
  query: string;
  resultCount: number;
  clickedEntityId: string | null;
  searchedAt: string;
};

export type SearchAnalyticsEvent = {
  id: string;
  kind: "search" | "click" | "zero_results" | "autocomplete_select";
  query: string;
  entityId: string | null;
  resultCount: number;
  occurredAt: string;
};

export type SearchAiPreparation = {
  id: string;
  title: string;
  rationale: string;
  suggestedQuery: string;
  confidence: number;
  status: SearchAiPreparationStatus;
  createdAt: string;
};

export type SearchQueryResult = {
  entityId: string;
  entityKind: SearchResultKind;
  title: string;
  score: number;
  matchedTokens: string[];
  rankingSignals: SearchRankingSignal[];
};

export type SearchStatistics = {
  totalIndexEntries: number;
  totalSuggestions: number;
  totalSynonyms: number;
  totalPopularQueries: number;
  totalHistoryEntries: number;
  zeroResultRate: number;
  averageResultCount: number;
  topQuery: string | null;
  calculatedAt: string;
};

export type SearchIntelligenceSnapshot = {
  index: SearchIndexEntry[];
  suggestions: SearchSuggestion[];
  synonyms: SearchSynonym[];
  typoCorrections: SearchTypoCorrection[];
  rankingRules: SearchRankingRule[];
  popularQueries: SearchPopularQuery[];
  relatedQueries: SearchRelatedQuery[];
  history: SearchHistoryEntry[];
  analytics: SearchAnalyticsEvent[];
  aiPreparations: SearchAiPreparation[];
  statistics: SearchStatistics;
  generatedAt: string;
};

export type SearchListFilters = {
  kind?: SearchSuggestionKind;
  query?: string;
  isActive?: boolean;
};

export type SearchRegistryState = {
  index: SearchIndexEntry[];
  suggestions: SearchSuggestion[];
  synonyms: SearchSynonym[];
  typoCorrections: SearchTypoCorrection[];
  rankingRules: SearchRankingRule[];
  popularQueries: SearchPopularQuery[];
  relatedQueries: SearchRelatedQuery[];
  history: SearchHistoryEntry[];
  analytics: SearchAnalyticsEvent[];
  aiPreparations: SearchAiPreparation[];
};

export type SearchReadOnlySummary = {
  indexSize: number;
  suggestionCount: number;
  popularQueryCount: number;
  synonymCount: number;
  historyCount: number;
};

export type SmartSearchOptions = {
  limit?: number;
  enableTypoCorrection?: boolean;
  enableSynonyms?: boolean;
  sessionId?: string;
};
