// ==================================================
// SECTION: SMART SEARCH
// РАЗДЕЛ: Empty Search State
//
// Purpose (EN): Helpful fallback when smart search finds no products.
//
// Назначение (RU): Полезное пустое состояние поиска.
// ==================================================
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import { getPublishedCatalogProducts } from "@/components/catalogEngine/productCatalogEngine";
import type { ParsedSearchQuery, SmartSearchEmptyState } from "@/components/smartSearch/smartSearchTypes";
import { rankSmartSearchResults } from "@/components/smartSearch/searchScoringEngine";

function getPopularProducts(
  products: CatalogProductRecord[],
  limit = 4,
): CatalogProductRecord[] {
  return [...products]
    .filter((product) => product.isPublished)
    .sort((left, right) => right.popularityScore - left.popularityScore)
    .slice(0, limit);
}

function getSimilarProducts(
  products: CatalogProductRecord[],
  parsedQuery: ParsedSearchQuery,
  limit = 4,
): CatalogProductRecord[] {
  const relaxedQuery: ParsedSearchQuery = {
    ...parsedQuery,
    stemCount: null,
    maxPriceRub: null,
    minPriceRub: null,
  };

  const ranked = rankSmartSearchResults(products, relaxedQuery, limit);
  return ranked.map((result) => result.product);
}

export function resolveSmartSearchEmptyState(
  parsedQuery: ParsedSearchQuery,
  products: CatalogProductRecord[] = getPublishedCatalogProducts(),
): SmartSearchEmptyState {
  const similarProducts = getSimilarProducts(products, parsedQuery);
  const popularProducts = getPopularProducts(products);

  const filterHints: string[] = [];

  if (parsedQuery.maxPriceRub !== null) {
    filterHints.push("увеличить бюджет");
  }

  if (parsedQuery.stemCount !== null) {
    filterHints.push("изменить количество стеблей");
  }

  if (parsedQuery.colors.length > 0 || parsedQuery.flowers.length > 0) {
    filterHints.push("попробовать другой цвет или цветок");
  }

  const filterHint =
    filterHints.length > 0
      ? `Попробуйте ${filterHints.join(" или ")}.`
      : "Попробуйте более общий запрос: розы, пионы, букет маме.";

  return {
    title: "Точного совпадения нет",
    message:
      "Мы подобрали похожие и популярные букеты — возможно, среди них есть подходящий вариант.",
    similarProducts,
    popularProducts,
    filterHint,
  };
}
