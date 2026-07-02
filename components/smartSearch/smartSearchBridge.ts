// ==================================================
// SECTION: SMART SEARCH
// РАЗДЕЛ: Catalog Search Bridge
//
// Purpose (EN): Extend legacy catalog search with smart search without breaking UI.
//
// Назначение (RU): Мост между smart search и текущим каталогом.
// ==================================================
import { toLegacyCatalogProduct } from "@/components/catalogEngine/legacyCatalogAdapter";
import type { CatalogProduct } from "@/data/catalogProducts";
import type { SmartCatalogGroup } from "@/data/smartCatalog";
import {
  filterCatalogCategoryResults,
  filterSearchResults,
  type CatalogSearchResponse,
} from "@/components/search/searchFoundation";
import { resolveSmartSearchEmptyState } from "@/components/smartSearch/smartSearchEmptyState";
import {
  getSmartSearchResultMap,
  smartSearchProducts,
} from "@/components/smartSearch/smartSearchEngine";
import type {
  SmartSearchEmptyState,
  SmartSearchProductResult,
} from "@/components/smartSearch/smartSearchTypes";

export type SmartCatalogSearchResponse<T extends CatalogProduct> =
  CatalogSearchResponse<T> & {
    smartResults: SmartSearchProductResult[];
    smartResultByProductId: Map<string, SmartSearchProductResult>;
    emptyState: SmartSearchEmptyState | null;
    usedSmartSearch: boolean;
  };

function mapSmartResultsToLegacyProducts<T extends CatalogProduct>(
  legacyBouquets: T[],
  smartResults: SmartSearchProductResult[],
): T[] {
  const legacyById = new Map(legacyBouquets.map((bouquet) => [bouquet.id, bouquet]));

  const mapped = smartResults
    .map((result) => {
      const legacy = legacyById.get(result.product.id);
      if (legacy) {
        return legacy;
      }

      return toLegacyCatalogProduct(result.product) as T;
    })
    .filter(Boolean);

  return mapped;
}

export function runSmartCatalogSearch<T extends CatalogProduct>(
  legacyBouquets: T[],
  searchQuery: string,
  smartCatalogGroups: SmartCatalogGroup[],
): SmartCatalogSearchResponse<T> {
  const trimmedQuery = searchQuery.trim();

  if (!trimmedQuery) {
    return {
      products: [],
      categories: [],
      smartResults: [],
      smartResultByProductId: new Map(),
      emptyState: null,
      usedSmartSearch: false,
    };
  }

  const smartResponse = smartSearchProducts(trimmedQuery);
  let products: T[] = [];
  let usedSmartSearch = false;

  if (smartResponse.results.length > 0) {
    products = mapSmartResultsToLegacyProducts(legacyBouquets, smartResponse.results);
    usedSmartSearch = true;
  } else {
    products = filterSearchResults(legacyBouquets, trimmedQuery, smartCatalogGroups);
  }

  const categories =
    products.length === 0
      ? filterCatalogCategoryResults(trimmedQuery, smartCatalogGroups)
      : [];

  const emptyState =
    products.length === 0
      ? resolveSmartSearchEmptyState(smartResponse.query)
      : null;

  const smartResultByProductId = getSmartSearchResultMap(smartResponse.results);

  return {
    products,
    categories,
    smartResults: smartResponse.results,
    smartResultByProductId,
    emptyState,
    usedSmartSearch,
  };
}

export function getSmartSearchReasonForProduct(
  response: SmartCatalogSearchResponse<CatalogProduct>,
  productId: string,
): string | null {
  return response.smartResultByProductId.get(productId)?.reasonSummary ?? null;
}
