// ==================================================
// SECTION: SEARCH INTELLIGENCE
// РАЗДЕЛ: Suggestion registry
// ==================================================
import { buildSearchExampleRegistryState } from "@/components/searchIntelligence/searchExamples";
import { normalizeSearchToken } from "@/components/searchIntelligence/searchIndexRegistry";
import type {
  SearchHistoryEntry,
  SearchListFilters,
  SearchPopularQuery,
  SearchRelatedQuery,
  SearchSuggestion,
  SearchSuggestionKind,
} from "@/components/searchIntelligence/searchTypes";

export const SEARCH_SUGGESTION_STORAGE_KEY =
  "bellaflore_search_intelligence_suggestions_v1";

export const SEARCH_POPULAR_STORAGE_KEY =
  "bellaflore_search_intelligence_popular_v1";

export const SEARCH_RELATED_STORAGE_KEY =
  "bellaflore_search_intelligence_related_v1";

export const SEARCH_HISTORY_STORAGE_KEY =
  "bellaflore_search_intelligence_history_v1";

let inMemorySuggestions: SearchSuggestion[] | null = null;
let inMemoryPopular: SearchPopularQuery[] | null = null;
let inMemoryRelated: SearchRelatedQuery[] | null = null;
let inMemoryHistory: SearchHistoryEntry[] | null = null;

function readSuggestionsFromStorage(): SearchSuggestion[] {
  if (typeof window === "undefined") {
    return inMemorySuggestions ?? buildSearchExampleRegistryState().suggestions;
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_SUGGESTION_STORAGE_KEY);
    if (!raw) {
      return inMemorySuggestions ?? buildSearchExampleRegistryState().suggestions;
    }

    const parsed = JSON.parse(raw) as SearchSuggestion[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSearchExampleRegistryState().suggestions;
  } catch {
    return inMemorySuggestions ?? buildSearchExampleRegistryState().suggestions;
  }
}

function writeSuggestionsToStorage(suggestions: SearchSuggestion[]): void {
  inMemorySuggestions = suggestions;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SEARCH_SUGGESTION_STORAGE_KEY,
      JSON.stringify(suggestions),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function readPopularFromStorage(): SearchPopularQuery[] {
  if (typeof window === "undefined") {
    return inMemoryPopular ?? buildSearchExampleRegistryState().popularQueries;
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_POPULAR_STORAGE_KEY);
    if (!raw) {
      return inMemoryPopular ?? buildSearchExampleRegistryState().popularQueries;
    }

    const parsed = JSON.parse(raw) as SearchPopularQuery[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSearchExampleRegistryState().popularQueries;
  } catch {
    return inMemoryPopular ?? buildSearchExampleRegistryState().popularQueries;
  }
}

function writePopularToStorage(queries: SearchPopularQuery[]): void {
  inMemoryPopular = queries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SEARCH_POPULAR_STORAGE_KEY, JSON.stringify(queries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readRelatedFromStorage(): SearchRelatedQuery[] {
  if (typeof window === "undefined") {
    return inMemoryRelated ?? buildSearchExampleRegistryState().relatedQueries;
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_RELATED_STORAGE_KEY);
    if (!raw) {
      return inMemoryRelated ?? buildSearchExampleRegistryState().relatedQueries;
    }

    const parsed = JSON.parse(raw) as SearchRelatedQuery[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSearchExampleRegistryState().relatedQueries;
  } catch {
    return inMemoryRelated ?? buildSearchExampleRegistryState().relatedQueries;
  }
}

function writeRelatedToStorage(queries: SearchRelatedQuery[]): void {
  inMemoryRelated = queries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SEARCH_RELATED_STORAGE_KEY, JSON.stringify(queries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readHistoryFromStorage(): SearchHistoryEntry[] {
  if (typeof window === "undefined") {
    return inMemoryHistory ?? buildSearchExampleRegistryState().history;
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
    if (!raw) {
      return inMemoryHistory ?? buildSearchExampleRegistryState().history;
    }

    const parsed = JSON.parse(raw) as SearchHistoryEntry[];
    return Array.isArray(parsed) ? parsed : buildSearchExampleRegistryState().history;
  } catch {
    return inMemoryHistory ?? buildSearchExampleRegistryState().history;
  }
}

function writeHistoryToStorage(history: SearchHistoryEntry[]): void {
  inMemoryHistory = history;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // In-memory fallback remains active.
  }
}

function matchesFilters(
  suggestion: SearchSuggestion,
  filters: SearchListFilters,
): boolean {
  if (filters.kind && suggestion.kind !== filters.kind) {
    return false;
  }

  if (filters.isActive !== undefined && suggestion.isActive !== filters.isActive) {
    return false;
  }

  if (filters.query?.trim()) {
    const normalized = normalizeSearchToken(filters.query);
    const haystack = `${suggestion.label} ${suggestion.query}`.toLowerCase();
    if (!haystack.includes(normalized)) {
      return false;
    }
  }

  return true;
}

export function listSearchSuggestions(
  filters: SearchListFilters = {},
): SearchSuggestion[] {
  return readSuggestionsFromStorage()
    .filter((suggestion) => suggestion.isActive)
    .filter((suggestion) => matchesFilters(suggestion, filters))
    .sort((left, right) => right.popularityScore - left.popularityScore);
}

export function listAutocompleteSuggestions(
  prefix: string,
  limit = 8,
): SearchSuggestion[] {
  const normalized = normalizeSearchToken(prefix);
  if (!normalized) {
    return listSearchSuggestions({ kind: "autocomplete" }).slice(0, limit);
  }

  return listSearchSuggestions({ kind: "autocomplete" })
    .filter(
      (suggestion) =>
        normalizeSearchToken(suggestion.query).startsWith(normalized) ||
        normalizeSearchToken(suggestion.label).includes(normalized),
    )
    .slice(0, limit);
}

export function listPopularSearches(limit = 10): SearchPopularQuery[] {
  return readPopularFromStorage()
    .sort((left, right) => right.searchCount - left.searchCount)
    .slice(0, limit);
}

export function listAllRelatedQueries(): SearchRelatedQuery[] {
  return readRelatedFromStorage();
}

export function listRelatedQueries(sourceQuery: string, limit = 5): SearchRelatedQuery[] {
  const normalized = normalizeSearchToken(sourceQuery);

  return readRelatedFromStorage()
    .filter((item) => normalizeSearchToken(item.sourceQuery) === normalized)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function listSearchHistory(
  sessionId?: string,
  customerId?: string,
): SearchHistoryEntry[] {
  return readHistoryFromStorage()
    .filter((entry) => (sessionId ? entry.sessionId === sessionId : true))
    .filter((entry) => (customerId ? entry.customerId === customerId : true))
    .sort(
      (left, right) =>
        new Date(right.searchedAt).getTime() - new Date(left.searchedAt).getTime(),
    );
}

export function listRecentSearchSuggestions(
  sessionId: string,
  limit = 5,
): SearchSuggestion[] {
  const recentQueries = listSearchHistory(sessionId)
    .slice(0, limit)
    .map((entry) => entry.query);

  return recentQueries.map((query, index) => ({
    id: `recent-${sessionId}-${index}`,
    kind: "recent" as SearchSuggestionKind,
    label: query,
    query,
    entityId: null,
    entityKind: null,
    popularityScore: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function registerSearchSuggestion(suggestion: SearchSuggestion): SearchSuggestion {
  const suggestions = readSuggestionsFromStorage();
  const index = suggestions.findIndex((item) => item.id === suggestion.id);
  const next =
    index === -1
      ? [...suggestions, suggestion]
      : suggestions.map((item, itemIndex) => (itemIndex === index ? suggestion : item));

  writeSuggestionsToStorage(next);
  return suggestion;
}

export function registerPopularQuery(query: SearchPopularQuery): SearchPopularQuery {
  const queries = readPopularFromStorage();
  const index = queries.findIndex((item) => item.id === query.id);
  const next =
    index === -1
      ? [...queries, query]
      : queries.map((item, itemIndex) => (itemIndex === index ? query : item));

  writePopularToStorage(next);
  return query;
}

export function registerRelatedQuery(query: SearchRelatedQuery): SearchRelatedQuery {
  const queries = readRelatedFromStorage();
  const index = queries.findIndex((item) => item.id === query.id);
  const next =
    index === -1
      ? [...queries, query]
      : queries.map((item, itemIndex) => (itemIndex === index ? query : item));

  writeRelatedToStorage(next);
  return query;
}

export function appendSearchHistoryEntry(entry: SearchHistoryEntry): SearchHistoryEntry {
  writeHistoryToStorage([entry, ...readHistoryFromStorage()]);
  return entry;
}

export function seedSearchSuggestionRegistry(): SearchSuggestion[] {
  const seed = buildSearchExampleRegistryState();
  writeSuggestionsToStorage(seed.suggestions);
  writePopularToStorage(seed.popularQueries);
  writeRelatedToStorage(seed.relatedQueries);
  writeHistoryToStorage(seed.history);
  return listSearchSuggestions();
}

export function clearSearchSuggestionRegistry(): void {
  writeSuggestionsToStorage([]);
  writePopularToStorage([]);
  writeRelatedToStorage([]);
  writeHistoryToStorage([]);
}
