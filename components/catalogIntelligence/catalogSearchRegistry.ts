// ==================================================
// SECTION: CATALOG INTELLIGENCE
// РАЗДЕЛ: Search registry
// ==================================================
import { buildCatalogExampleRegistryState } from "@/components/catalogIntelligence/catalogExamples";
import {
  getCatalogProductById,
  listCatalogProducts,
} from "@/components/catalogIntelligence/catalogProductRegistry";
import type {
  CatalogAiProductSuggestion,
  CatalogFilterGroup,
  CatalogFilterKind,
  CatalogFilterOption,
  CatalogProductRecord,
  CatalogSearchIndexEntry,
  CatalogSearchResult,
} from "@/components/catalogIntelligence/catalogTypes";

export const CATALOG_SEARCH_INDEX_STORAGE_KEY =
  "bellaflore_catalog_intelligence_search_index_v1";

export const CATALOG_AI_SUGGESTIONS_STORAGE_KEY =
  "bellaflore_catalog_intelligence_ai_suggestions_v1";

let inMemorySearchIndex: CatalogSearchIndexEntry[] | null = null;
let inMemoryAiSuggestions: CatalogAiProductSuggestion[] | null = null;

function readSearchIndexFromStorage(): CatalogSearchIndexEntry[] {
  if (typeof window === "undefined") {
    return inMemorySearchIndex ?? buildCatalogExampleRegistryState().searchIndex;
  }

  try {
    const raw = window.localStorage.getItem(CATALOG_SEARCH_INDEX_STORAGE_KEY);
    if (!raw) {
      return inMemorySearchIndex ?? buildCatalogExampleRegistryState().searchIndex;
    }

    const parsed = JSON.parse(raw) as CatalogSearchIndexEntry[];
    return Array.isArray(parsed)
      ? parsed
      : buildCatalogExampleRegistryState().searchIndex;
  } catch {
    return inMemorySearchIndex ?? buildCatalogExampleRegistryState().searchIndex;
  }
}

function writeSearchIndexToStorage(entries: CatalogSearchIndexEntry[]): void {
  inMemorySearchIndex = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CATALOG_SEARCH_INDEX_STORAGE_KEY,
      JSON.stringify(entries),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function readAiSuggestionsFromStorage(): CatalogAiProductSuggestion[] {
  if (typeof window === "undefined") {
    return inMemoryAiSuggestions ?? buildCatalogExampleRegistryState().aiSuggestions;
  }

  try {
    const raw = window.localStorage.getItem(CATALOG_AI_SUGGESTIONS_STORAGE_KEY);
    if (!raw) {
      return inMemoryAiSuggestions ?? buildCatalogExampleRegistryState().aiSuggestions;
    }

    const parsed = JSON.parse(raw) as CatalogAiProductSuggestion[];
    return Array.isArray(parsed)
      ? parsed
      : buildCatalogExampleRegistryState().aiSuggestions;
  } catch {
    return inMemoryAiSuggestions ?? buildCatalogExampleRegistryState().aiSuggestions;
  }
}

function writeAiSuggestionsToStorage(
  suggestions: CatalogAiProductSuggestion[],
): void {
  inMemoryAiSuggestions = suggestions;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CATALOG_AI_SUGGESTIONS_STORAGE_KEY,
      JSON.stringify(suggestions),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase();
}

export function listSearchIndexEntries(): CatalogSearchIndexEntry[] {
  return readSearchIndexFromStorage();
}

export function listSearchIndexByProduct(productId: string): CatalogSearchIndexEntry[] {
  return readSearchIndexFromStorage().filter((entry) => entry.productId === productId);
}

export function buildSearchIndexFromProducts(
  products: CatalogProductRecord[],
): CatalogSearchIndexEntry[] {
  const entries: CatalogSearchIndexEntry[] = [];
  const now = new Date().toISOString();

  for (const product of products) {
    const pushToken = (
      token: string,
      weight: number,
      source: CatalogSearchIndexEntry["source"],
    ) => {
      if (!token.trim()) {
        return;
      }

      entries.push({
        id: `index-${product.id}-${source}-${normalizeToken(token)}`,
        productId: product.id,
        token: normalizeToken(token),
        weight,
        source,
        updatedAt: now,
      });
    };

    for (const word of product.title.split(/\s+/)) {
      pushToken(word, 10, "title");
    }

    for (const tag of product.tags) {
      pushToken(tag, 7, "tag");
    }

    for (const flower of product.flowerTypes) {
      pushToken(flower, 8, "flower");
    }

    for (const color of product.colors) {
      pushToken(color, 5, "color");
    }

    for (const occasion of product.occasions) {
      pushToken(occasion, 6, "occasion");
    }

    for (const term of product.searchTerms) {
      pushToken(term, 9, "title");
    }
  }

  return entries;
}

export function searchCatalog(query: string, limit = 10): CatalogSearchResult[] {
  const normalizedQuery = normalizeToken(query);
  if (!normalizedQuery) {
    return [];
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const scoreByProduct = new Map<string, { score: number; matched: Set<string> }>();

  for (const entry of readSearchIndexFromStorage()) {
    const matched = tokens.some(
      (token) => entry.token.includes(token) || token.includes(entry.token),
    );

    if (!matched) {
      continue;
    }

    const existing = scoreByProduct.get(entry.productId) ?? {
      score: 0,
      matched: new Set<string>(),
    };

    existing.score += entry.weight;
    existing.matched.add(entry.token);
    scoreByProduct.set(entry.productId, existing);
  }

  const results: CatalogSearchResult[] = [];

  for (const [productId, payload] of scoreByProduct.entries()) {
    const product = getCatalogProductById(productId);
    if (!product || product.status !== "published") {
      continue;
    }

    results.push({
      product,
      score: payload.score,
      matchedTokens: [...payload.matched],
    });
  }

  return results.sort((left, right) => right.score - left.score).slice(0, limit);
}

function buildFilterOptions(
  kind: CatalogFilterKind,
  label: string,
  values: Array<{ value: string; label: string; count: number }>,
): CatalogFilterGroup {
  return {
    kind,
    label,
    options: values.map((item) => ({
      id: `filter-${kind}-${item.value}`,
      kind,
      label: item.label,
      value: item.value,
      count: item.count,
    })),
  };
}

export function buildCatalogFilters(): CatalogFilterGroup[] {
  const products = listCatalogProducts();
  const categoryCounts = new Map<string, number>();
  const colorCounts = new Map<string, number>();
  const flowerCounts = new Map<string, number>();
  const seasonCounts = new Map<string, number>();
  const availabilityCounts = new Map<string, number>();

  for (const product of products) {
    for (const categoryId of product.categoryIds) {
      categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
    }

    for (const color of product.colors) {
      colorCounts.set(color, (colorCounts.get(color) ?? 0) + 1);
    }

    for (const flower of product.flowerTypes) {
      flowerCounts.set(flower, (flowerCounts.get(flower) ?? 0) + 1);
    }

    for (const season of product.seasons) {
      seasonCounts.set(season, (seasonCounts.get(season) ?? 0) + 1);
    }

    availabilityCounts.set(
      product.availability,
      (availabilityCounts.get(product.availability) ?? 0) + 1,
    );
  }

  const toOptions = (map: Map<string, number>) =>
    [...map.entries()].map(([value, count]) => ({
      value,
      label: value,
      count,
    }));

  return [
    buildFilterOptions("category", "Категории", toOptions(categoryCounts)),
    buildFilterOptions("color", "Цвета", toOptions(colorCounts)),
    buildFilterOptions("flower", "Цветы", toOptions(flowerCounts)),
    buildFilterOptions("season", "Сезоны", toOptions(seasonCounts)),
    buildFilterOptions("availability", "Наличие", toOptions(availabilityCounts)),
  ];
}

export function listCatalogFilterOptions(kind: CatalogFilterKind): CatalogFilterOption[] {
  return buildCatalogFilters().find((group) => group.kind === kind)?.options ?? [];
}

export function listAiProductSuggestions(): CatalogAiProductSuggestion[] {
  return readAiSuggestionsFromStorage();
}

export function getAiProductSuggestionById(
  suggestionId: string,
): CatalogAiProductSuggestion | null {
  return (
    readAiSuggestionsFromStorage().find((suggestion) => suggestion.id === suggestionId) ??
    null
  );
}

export function registerSearchIndexEntry(
  entry: CatalogSearchIndexEntry,
): CatalogSearchIndexEntry {
  const entries = readSearchIndexFromStorage();
  const index = entries.findIndex((item) => item.id === entry.id);
  const next =
    index === -1
      ? [...entries, entry]
      : entries.map((item, itemIndex) => (itemIndex === index ? entry : item));

  writeSearchIndexToStorage(next);
  return entry;
}

export function registerAiProductSuggestion(
  suggestion: CatalogAiProductSuggestion,
): CatalogAiProductSuggestion {
  const suggestions = readAiSuggestionsFromStorage();
  const index = suggestions.findIndex((item) => item.id === suggestion.id);
  const next =
    index === -1
      ? [...suggestions, suggestion]
      : suggestions.map((item, itemIndex) => (itemIndex === index ? suggestion : item));

  writeAiSuggestionsToStorage(next);
  return suggestion;
}

export function seedCatalogSearchRegistry(): CatalogSearchIndexEntry[] {
  const seed = buildCatalogExampleRegistryState();
  writeSearchIndexToStorage(seed.searchIndex);
  writeAiSuggestionsToStorage(seed.aiSuggestions);
  return listSearchIndexEntries();
}

export function rebuildCatalogSearchIndex(): CatalogSearchIndexEntry[] {
  const entries = buildSearchIndexFromProducts(listCatalogProducts());
  writeSearchIndexToStorage(entries);
  return entries;
}

export function clearCatalogSearchRegistry(): void {
  writeSearchIndexToStorage([]);
  writeAiSuggestionsToStorage([]);
}
