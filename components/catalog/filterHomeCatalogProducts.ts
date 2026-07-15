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
      product.seoTitle,
      product.seoDescription,
      ...(product.tags ?? []),
      ...(product.searchTerms ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
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

  const haystack = productHaystack(product);

  if (haystack.includes(normalizedQuery)) {
    return true;
  }

  const tokens = expandSearchTokens(normalizedQuery);
  return tokens.some((token) => token.length >= 2 && haystack.includes(token));
}

export function filterHomeCatalogProducts(
  products: CatalogProduct[],
  options: {
    categoryId: string;
    quickFilterId: string;
    searchQuery: string;
    customCategoryTitleById?: Record<string, string>;
  },
): CatalogProduct[] {
  return products.filter(
    (product) =>
      matchesCategory(product, options.categoryId, options.customCategoryTitleById) &&
      matchesQuickFilter(product, options.quickFilterId) &&
      matchesSearch(product, options.searchQuery),
  );
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
