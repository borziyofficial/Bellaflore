// ==================================================
// SECTION: HOME CATALOG SECTIONS
// РАЗДЕЛ: Секции каталога на главной (Stage 56A)
// ==================================================
import { catalogProductBadges } from "@/components/catalog/catalogConfig";
import { matchesHomeCatalogCategory } from "@/components/catalog/filterHomeCatalogProducts";
import type { CatalogProduct } from "@/data/catalogProducts";

export type HomeCatalogSectionId =
  | "popular"
  | "new"
  | "roses"
  | "peonies"
  | "hydrangeas"
  | "baskets-boxes";

export type HomeCatalogSection = {
  id: HomeCatalogSectionId;
  title: string;
  anchorId: string;
};

export const HOME_CATALOG_SECTIONS: HomeCatalogSection[] = [
  { id: "popular", title: "Популярные букеты", anchorId: "catalog-popular" },
  { id: "new", title: "Новинки", anchorId: "catalog-new" },
  { id: "roses", title: "Розы", anchorId: "catalog-roses" },
  { id: "peonies", title: "Пионы", anchorId: "catalog-peonies" },
  { id: "hydrangeas", title: "Гортензии", anchorId: "catalog-hydrangeas" },
  {
    id: "baskets-boxes",
    title: "Корзины и коробки",
    anchorId: "catalog-baskets-boxes",
  },
];

const POPULAR_PRODUCT_IDS = new Set([
  "white-pearl",
  "pink-elegance",
  "royal-collection",
  "red-luxury",
]);

const SECTION_PRODUCT_LIMIT = 6;

function isPopularProduct(product: CatalogProduct): boolean {
  return (
    POPULAR_PRODUCT_IDS.has(product.id) ||
    Boolean(product.isPopular) ||
    Boolean(catalogProductBadges[product.id])
  );
}

function isNewProduct(product: CatalogProduct): boolean {
  return Boolean(product.isNew) || Boolean(product.isAdminProduct);
}

function isBasketsOrBoxesProduct(product: CatalogProduct): boolean {
  return (
    matchesHomeCatalogCategory(product, "baskets") ||
    matchesHomeCatalogCategory(product, "boxes")
  );
}

export function getHomeCatalogSectionProducts(
  sectionId: HomeCatalogSectionId,
  products: CatalogProduct[],
): CatalogProduct[] {
  let filtered: CatalogProduct[];

  switch (sectionId) {
    case "popular":
      filtered = products.filter(isPopularProduct);
      break;
    case "new":
      filtered = products.filter(isNewProduct);
      break;
    case "roses":
      filtered = products.filter((product) =>
        matchesHomeCatalogCategory(product, "roses"),
      );
      break;
    case "peonies":
      filtered = products.filter((product) =>
        matchesHomeCatalogCategory(product, "peonies"),
      );
      break;
    case "hydrangeas":
      filtered = products.filter((product) =>
        matchesHomeCatalogCategory(product, "hydrangeas"),
      );
      break;
    case "baskets-boxes":
      filtered = products.filter(isBasketsOrBoxesProduct);
      break;
    default:
      filtered = products;
  }

  return filtered.slice(0, SECTION_PRODUCT_LIMIT);
}

export function mapHeroCategoryToSectionId(
  categoryId: string,
): HomeCatalogSectionId | null {
  switch (categoryId) {
    case "roses":
      return "roses";
    case "peonies":
      return "peonies";
    case "hydrangeas":
      return "hydrangeas";
    case "baskets":
    case "boxes":
      return "baskets-boxes";
    case "popular":
      return "popular";
    default:
      return null;
  }
}

export function getHomeCatalogSectionAnchor(sectionId: HomeCatalogSectionId): string {
  return (
    HOME_CATALOG_SECTIONS.find((section) => section.id === sectionId)?.anchorId ??
    "collections"
  );
}
