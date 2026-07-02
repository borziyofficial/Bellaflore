// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: Search Engine Foundation
//
// Purpose (EN): Local search foundation with AI-ready provider hooks.
//
// Назначение (RU): Основа поиска с hooks для будущего AI Search.
// ==================================================
import { applyCatalogFilters, filtersToSearchTokens } from "@/components/catalogEngine/filtersEngine";
import type {
  CatalogProductRecord,
  CatalogSearchHit,
  CatalogSearchProvider,
  CatalogSearchQuery,
  CatalogSearchResult,
} from "@/components/catalogEngine/catalogTypes";
import { getCatalogAiHooks } from "@/components/catalogEngine/aiCatalogFoundation";
import { isProductVisibleInCatalog } from "@/components/catalogEngine/availabilityEngine";
import { normalizeSearchText } from "@/components/search/searchFoundation";

function tokenizeSearchQuery(query: string): string[] {
  return normalizeSearchText(query)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function scoreProductAgainstQuery(
  product: CatalogProductRecord,
  tokens: string[],
): { score: number; matchedTerms: string[] } {
  if (tokens.length === 0) {
    return { score: product.popularityScore / 100, matchedTerms: [] };
  }

  const haystack = product.searchIndexText;
  const matchedTerms: string[] = [];
  let score = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) {
      matchedTerms.push(token);
      score += 1;
    }

    if (product.title.toLowerCase().includes(token)) {
      score += 0.5;
    }

    if (product.slug.includes(token)) {
      score += 0.25;
    }
  }

  score += product.popularityScore / 200;
  if (product.isFeatured) {
    score += 0.2;
  }
  if (product.isNew) {
    score += 0.15;
  }

  return { score, matchedTerms };
}

function runLocalCatalogSearch(
  products: CatalogProductRecord[],
  query: CatalogSearchQuery,
): CatalogSearchResult {
  const startedAt = Date.now();
  const filterTokens = filtersToSearchTokens(query.filters ?? {});
  const tokens = [
    ...tokenizeSearchQuery(query.text),
    ...filterTokens.map((token) => normalizeSearchText(token)),
  ].filter(Boolean);

  let pool = products.filter((product) =>
    isProductVisibleInCatalog(product.availability, product.isPublished),
  );

  if (query.categoryId) {
    pool = pool.filter((product) =>
      product.categoryIds.includes(query.categoryId as string),
    );
  }

  pool = applyCatalogFilters(pool, query.filters);

  const hits: CatalogSearchHit[] = pool
    .map((product) => {
      const { score, matchedTerms } = scoreProductAgainstQuery(product, tokens);
      return {
        productId: product.id,
        score,
        matchedTerms,
        provider: "local" as CatalogSearchProvider,
      };
    })
    .filter((hit) => (tokens.length === 0 ? true : hit.score > 0))
    .sort((left, right) => right.score - left.score);

  const limitedHits = hits.slice(0, query.limit ?? hits.length);
  const productMap = new Map(pool.map((product) => [product.id, product]));

  return {
    hits: limitedHits,
    products: limitedHits
      .map((hit) => productMap.get(hit.productId))
      .filter((product): product is CatalogProductRecord => Boolean(product)),
    provider: "local",
    tookMs: Date.now() - startedAt,
  };
}

export async function runCatalogEngineSearch(
  products: CatalogProductRecord[],
  query: CatalogSearchQuery,
): Promise<CatalogSearchResult> {
  const provider = query.provider ?? "local";
  const hooks = getCatalogAiHooks();

  if (provider === "ai" && hooks.search) {
    const startedAt = Date.now();
    const hits = await hooks.search(query);
    const productMap = new Map(products.map((product) => [product.id, product]));

    return {
      hits,
      products: hits
        .map((hit) => productMap.get(hit.productId))
        .filter((product): product is CatalogProductRecord => Boolean(product)),
      provider: "ai",
      tookMs: Date.now() - startedAt,
    };
  }

  if (provider === "hybrid" && hooks.search) {
    const localResult = runLocalCatalogSearch(products, query);
    const aiHits = await hooks.search(query);
    const mergedHits = [...aiHits, ...localResult.hits]
      .reduce<CatalogSearchHit[]>((accumulator, hit) => {
        const existing = accumulator.find(
          (item) => item.productId === hit.productId,
        );
        if (existing) {
          existing.score = Math.max(existing.score, hit.score);
          return accumulator;
        }
        accumulator.push(hit);
        return accumulator;
      }, [])
      .sort((left, right) => right.score - left.score);

    const productMap = new Map(products.map((product) => [product.id, product]));

    return {
      hits: mergedHits,
      products: mergedHits
        .map((hit) => productMap.get(hit.productId))
        .filter((product): product is CatalogProductRecord => Boolean(product)),
      provider: "hybrid",
      tookMs: localResult.tookMs,
    };
  }

  return runLocalCatalogSearch(products, query);
}

export function buildCatalogSearchIndexText(
  product: CatalogProductRecord,
): string {
  return product.searchIndexText;
}

export type CatalogSearchFoundation = {
  runSearch: typeof runCatalogEngineSearch;
  tokenize: typeof tokenizeSearchQuery;
  score: typeof scoreProductAgainstQuery;
};

export const catalogSearchFoundation: CatalogSearchFoundation = {
  runSearch: runCatalogEngineSearch,
  tokenize: tokenizeSearchQuery,
  score: scoreProductAgainstQuery,
};
