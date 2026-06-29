// ==================================================
// SECTION: CATALOG ADMIN
// РАЗДЕЛ: Foundation filters (client-side only)
// ==================================================
import type {
  CatalogAdminProduct,
  CatalogProductStatus,
} from "@/components/catalogAdmin/catalogAdminTypes";

export type CatalogAdminFilterState = {
  searchQuery: string;
  category: string;
};

export const CATALOG_ADMIN_ALL_CATEGORIES = "all";

export function filterCatalogAdminProducts(
  products: CatalogAdminProduct[],
  filters: CatalogAdminFilterState,
): CatalogAdminProduct[] {
  const normalizedQuery = filters.searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    const matchesCategory =
      filters.category === CATALOG_ADMIN_ALL_CATEGORIES ||
      product.category === filters.category;

    if (!matchesCategory) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    return (
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.shortDescription.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function formatCatalogProductPrice(priceRub: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(priceRub);
}

export function getCatalogProductStatusLabel(status: CatalogProductStatus): string {
  switch (status) {
    case "active":
      return "активен";
    case "draft":
      return "черновик";
    case "hidden":
      return "скрыт";
    default:
      return status;
  }
}
