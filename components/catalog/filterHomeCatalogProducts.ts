// ==================================================
// SECTION: HOME CATALOG
// РАЗДЕЛ: Фильтрация каталога на главной (Stage 57A)
// ==================================================
import { catalogProductBadges } from "@/components/catalog/catalogConfig";
import {
  expandSearchTokens,
  normalizeSearchText,
} from "@/components/search/searchFoundation";
import type { CatalogProduct } from "@/data/catalogProducts";

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
): boolean {
  return matchesCategory(product, categoryId);
}

function matchesCategory(product: CatalogProduct, categoryId: string): boolean {
  if (categoryId === "all") {
    return true;
  }

  switch (categoryId) {
    case "new":
      return Boolean(product.isNew) || Boolean(product.isAdminProduct);
    case "roses":
      return productCategoryEquals(product, ["Розы"]);
    case "peonies":
      return productCategoryEquals(product, ["Пионы"]);
    case "hydrangeas":
      return productCategoryEquals(product, ["Гортензии"]);
    case "baskets":
      return productCategoryEquals(product, ["Корзины"]);
    case "boxes":
      return productCategoryEquals(product, ["Коробки"]);
    case "compositions":
      return productCategoryEquals(product, ["Композиции"]);
    case "tulips":
      return productCategoryEquals(product, ["Тюльпаны"]);
    case "author":
      return productCategoryEquals(product, ["Авторские", "Авторские букеты"]);
    default:
      return true;
  }
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
  },
): CatalogProduct[] {
  return products.filter(
    (product) =>
      matchesCategory(product, options.categoryId) &&
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
