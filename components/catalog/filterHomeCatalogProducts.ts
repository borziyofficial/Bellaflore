// ==================================================
// SECTION: HOME CATALOG
// РАЗДЕЛ: Фильтрация каталога на главной (Stage 57A)
// ==================================================
import { catalogProductBadges } from "@/components/catalog/catalogConfig";
import { CATALOG_CATEGORIES } from "@/components/catalogEngine/categoriesCatalog";
import {
  expandSearchTokens,
  normalizeSearchText,
} from "@/components/search/searchFoundation";
import type { CatalogProduct } from "@/data/catalogProducts";
import { getProductSizeOptions } from "@/data/productSizeFoundation";
import { compareCatalogArticles } from "@/lib/catalogArticleOrder";

export type HomeCatalogSortMode = "default" | "price-asc" | "price-desc";

const HOME_CATEGORY_TITLE_MAP: Record<string, string[]> = Object.fromEntries(
  CATALOG_CATEGORIES.map((category) => [category.id, [category.title]]),
);

// Storefront tabs aligned with admin category titles + legacy seed labels.
HOME_CATEGORY_TITLE_MAP.author = ["Авторские", "Авторские букеты"];
HOME_CATEGORY_TITLE_MAP.compositions = ["Композиции"];

const POPULAR_PRODUCT_IDS = new Set([
  "white-pearl",
  "pink-elegance",
  "royal-collection",
  "red-luxury",
]);

function productHaystack(product: CatalogProduct): string {
  return normalizeSearchText(
    [
      product.title,
      product.description,
      product.category,
      product.flowerType,
      product.composition,
      product.catalogNumber,
      product.seoTitle,
      product.seoDescription,
      ...(product.tags ?? []),
      ...(product.searchTerms ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function getCatalogNumberDigits(value: string): string | null {
  const match = value.trim().match(/^(?:bf[\s-]*)?0*(\d+)$/i);
  return match?.[1] ?? null;
}

function isCatalogNumberQuery(searchQuery: string): boolean {
  return /^(?:bf[\s-]*)?\d+$/i.test(searchQuery.trim());
}

function matchesCatalogNumber(product: CatalogProduct, searchQuery: string): boolean {
  const queryDigits = getCatalogNumberDigits(searchQuery);
  const productDigits = product.catalogNumber
    ? getCatalogNumberDigits(product.catalogNumber)
    : null;

  if (!queryDigits || !productDigits) {
    return false;
  }

  // A finished article (BF-006, bf-006, 006) is that number only.
  // Stripping zeros must not turn BF-006 into a prefix of BF-060.
  // A bare in-progress number stays a prefix so typing still works:
  //   1 -> BF-001, BF-010, BF-011, ...
  //   66 / 066 / BF-66 / BF-066 -> BF-066
  if (isExplicitArticleQuery(searchQuery)) {
    return productDigits === queryDigits;
  }

  return productDigits.startsWith(queryDigits);
}

function isExplicitArticleQuery(searchQuery: string): boolean {
  const raw = searchQuery.trim();
  if (/bf/i.test(raw)) {
    return true;
  }

  return /^0+\d+$/.test(raw);
}

function productCategoryEquals(
  product: CatalogProduct,
  acceptedCategories: string[],
): boolean {
  const category = normalizeSearchText(product.category ?? "");
  return acceptedCategories
    .map((acceptedCategory) => normalizeSearchText(acceptedCategory))
    .includes(category);
}

export function matchesHomeCatalogCategory(
  product: CatalogProduct,
  categoryId: string,
  customCategoryTitleById?: Record<string, string>,
): boolean {
  return matchesCategory(product, categoryId, customCategoryTitleById);
}

function matchesCategory(
  product: CatalogProduct,
  categoryId: string,
  customCategoryTitleById?: Record<string, string>,
): boolean {
  if (categoryId === "all") {
    return true;
  }

  if (categoryId === "new") {
    return (
      Boolean(product.isNew) ||
      productCategoryEquals(product, HOME_CATEGORY_TITLE_MAP.new ?? ["Новинки"])
    );
  }

  const acceptedCategories =
    HOME_CATEGORY_TITLE_MAP[categoryId] ??
    (customCategoryTitleById?.[categoryId] ? [customCategoryTitleById[categoryId]] : null);
  if (!acceptedCategories) {
    return false;
  }

  return productCategoryEquals(product, acceptedCategories);
}

function matchesQuickFilter(
  product: CatalogProduct,
  quickFilterId: string,
): boolean {
  switch (quickFilterId) {
    case "popular":
      return (
        POPULAR_PRODUCT_IDS.has(product.id) ||
        Boolean(catalogProductBadges[product.id])
      );
    case "all":
      return true;
    case "under-5000":
      return product.priceRub < 5000;
    case "mid-range":
      return product.priceRub >= 5000 && product.priceRub <= 10000;
    case "premium":
      return (
        product.priceRub >= 14000 ||
        productHaystack(product).includes("премиум") ||
        productHaystack(product).includes("premium")
      );
    case "today":
      return productHaystack(product).includes("сегодня");
    default:
      return true;
  }
}

function matchesSearch(product: CatalogProduct, searchQuery: string): boolean {
  const normalizedQuery = normalizeSearchText(searchQuery);

  if (!normalizedQuery) {
    return true;
  }

  // A numeric/BF query is an article lookup, not a generic text query.
  // Keep it scoped to catalog numbers so "66" does not accidentally match
  // a bouquet whose description happens to contain the number 66.
  if (isCatalogNumberQuery(normalizedQuery)) {
    return matchesCatalogNumber(product, normalizedQuery);
  }

  const haystack = productHaystack(product);

  if (haystack.includes(normalizedQuery)) {
    return true;
  }

  // A multi-word title must hit every word. OR-ing expanded tokens made
  // "Кустовые розы" match any bouquet that merely mentions roses.
  const queryWords = normalizedQuery.split(" ").filter((word) => word.length >= 2);
  if (queryWords.length > 1) {
    return queryWords.every((word) => wordMatchesHaystack(word, haystack));
  }

  const tokens = expandSearchTokens(normalizedQuery);
  return tokens.some((token) => token.length >= 2 && haystack.includes(token));
}

function wordMatchesHaystack(word: string, haystack: string): boolean {
  if (haystack.includes(word)) {
    return true;
  }

  return expandSearchTokens(word).some((token) => {
    if (token.length < 3) {
      return false;
    }

    // Synonym maps can attach a whole phrase ("кустовые розы" -> "роз").
    // Only stems of this word count, otherwise one word matches every rose.
    const related =
      word.includes(token) || token.includes(word) || word.startsWith(token);
    return related && haystack.includes(token);
  });
}

export function getHomeCatalogProductDisplayPrice(product: CatalogProduct): number {
  return getProductSizeOptions(product)[0]?.price ?? product.priceRub;
}

function matchesBudget(
  product: CatalogProduct,
  minPriceRub?: number,
  maxPriceRub?: number,
): boolean {
  const priceRub = getHomeCatalogProductDisplayPrice(product);
  if (!Number.isFinite(priceRub)) {
    return false;
  }

  if (typeof minPriceRub === "number" && priceRub < minPriceRub) {
    return false;
  }

  if (typeof maxPriceRub === "number" && priceRub > maxPriceRub) {
    return false;
  }

  return true;
}

function sortProductsByMode(
  products: CatalogProduct[],
  sortMode: HomeCatalogSortMode,
): CatalogProduct[] {
  if (sortMode === "price-asc") {
    return [...products].sort(
      (left, right) =>
        getHomeCatalogProductDisplayPrice(left) -
        getHomeCatalogProductDisplayPrice(right),
    );
  }

  if (sortMode === "price-desc") {
    return [...products].sort(
      (left, right) =>
        getHomeCatalogProductDisplayPrice(right) -
        getHomeCatalogProductDisplayPrice(left),
    );
  }

  return [...products].sort((left, right) =>
    compareCatalogArticles(left.catalogNumber, right.catalogNumber),
  );
}

export function filterHomeCatalogProducts(
  products: CatalogProduct[],
  options: {
    categoryId: string;
    quickFilterId: string;
    searchQuery: string;
    customCategoryTitleById?: Record<string, string>;
    minPriceRub?: number;
    maxPriceRub?: number;
    sortMode?: HomeCatalogSortMode;
  },
): CatalogProduct[] {
  const filtered = products.filter(
    (product) =>
      matchesCategory(product, options.categoryId, options.customCategoryTitleById) &&
      matchesQuickFilter(product, options.quickFilterId) &&
      matchesSearch(product, options.searchQuery) &&
      matchesBudget(product, options.minPriceRub, options.maxPriceRub),
  );

  return sortProductsByMode(filtered, options.sortMode ?? "default");
}

export function getProductCategoryHint(product: CatalogProduct): string {
  if (product.category) {
    return product.category;
  }

  if (product.flowerType && product.flowerType !== "микс") {
    return product.flowerType.charAt(0).toUpperCase() + product.flowerType.slice(1);
  }

  return "Авторский букет";
}

export function getProductCardDescription(product: CatalogProduct): string {
  return product.description?.trim() || product.composition?.trim() || "";
}
