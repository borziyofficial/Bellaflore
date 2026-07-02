// ==================================================
// SECTION: SMART SEARCH
// РАЗДЕЛ: Smart Search Engine
//
// Purpose (EN): Main smartSearchProducts API with local + AI-ready providers.
//
// Назначение (RU): Главный API умного поиска smartSearchProducts.
// ==================================================
import { getPublishedCatalogProducts } from "@/components/catalogEngine/productCatalogEngine";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import { getAiSearchProvider } from "@/components/smartSearch/aiSearchFoundation";
import { parseSearchQuery } from "@/components/smartSearch/searchQueryParser";
import { rankSmartSearchResults } from "@/components/smartSearch/searchScoringEngine";
import type {
  SmartSearchProductResult,
  SmartSearchResponse,
} from "@/components/smartSearch/smartSearchTypes";

export function smartSearchProducts(
  query: string,
  products: CatalogProductRecord[] = getPublishedCatalogProducts(),
  limit?: number,
): SmartSearchResponse {
  const startedAt = Date.now();
  const parsedQuery = parseSearchQuery(query);

  if (!parsedQuery.normalizedQuery) {
    return {
      query: parsedQuery,
      results: [],
      provider: "local",
      tookMs: Date.now() - startedAt,
    };
  }

  const results = rankSmartSearchResults(products, parsedQuery, limit);

  return {
    query: parsedQuery,
    results,
    provider: "local",
    tookMs: Date.now() - startedAt,
  };
}

export async function smartSearchProductsAsync(
  query: string,
  products: CatalogProductRecord[] = getPublishedCatalogProducts(),
  limit?: number,
): Promise<SmartSearchResponse> {
  const startedAt = Date.now();
  const provider = getAiSearchProvider();

  if (provider?.searchProducts) {
    const parsedQuery = provider.parseQuery
      ? await provider.parseQuery(query)
      : parseSearchQuery(query);
    const aiResults = await provider.searchProducts(query, products);

    return {
      query: parsedQuery,
      results: limit ? aiResults.slice(0, limit) : aiResults,
      provider: "ai",
      tookMs: Date.now() - startedAt,
    };
  }

  return smartSearchProducts(query, products, limit);
}

export function getSmartSearchResultMap(
  results: SmartSearchProductResult[],
): Map<string, SmartSearchProductResult> {
  return new Map(results.map((result) => [result.product.id, result]));
}
