// ==================================================
// SECTION: HOME CATALOG
// РАЗДЕЛ: Фильтрация каталога на главной
//
// Purpose (EN): Client-side filtering for homepage catalog using existing product data.
//
// Назначение (RU): Клиентская фильтрация каталога на главной по локальным данным.
// ==================================================
import { catalogProductBadges } from "@/components/catalog/catalogConfig";
import { normalizeSearchText } from "@/components/search/searchFoundation";
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
      ...(product.tags ?? []),
      ...(product.searchTerms ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function matchesCategory(product: CatalogProduct, categoryId: string): boolean {
  if (categoryId === "all") {
    return true;
  }

  const haystack = productHaystack(product);

  switch (categoryId) {
    case "roses":
      return (
        haystack.includes("роз") ||
        normalizeSearchText(product.category ?? "").includes("роз")
      );
    case "peonies":
      return haystack.includes("пион");
    case "hydrangeas":
      return haystack.includes("гортенз");
    case "baskets":
      return haystack.includes("корзин");
    case "boxes":
      return (
        haystack.includes("короб") ||
        normalizeSearchText(product.category ?? "").includes("короб")
      );
    case "tulips":
      return haystack.includes("тюльпан");
    case "author":
      return (
        haystack.includes("автор") ||
        normalizeSearchText(product.category ?? "").includes("автор")
      );
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

  return productHaystack(product).includes(normalizedQuery);
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
  if (product.flowerType && product.flowerType !== "микс") {
    return product.flowerType.charAt(0).toUpperCase() + product.flowerType.slice(1);
  }

  if (product.category) {
    return product.category;
  }

  return "Авторский букет";
}
