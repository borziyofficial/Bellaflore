import type { AdminProductStatusFilter } from "@/components/adminCatalogManager/adminCatalogTypes";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";

export type AdminProductSort = "updated-desc" | "name-asc" | "price-asc" | "price-desc";

type AdminProductFilterOptions = {
  search: string;
  categoryId: string;
  status: AdminProductStatusFilter;
  stock: string;
  sort: AdminProductSort;
};

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("ru-RU");
}

export function filterAdminProducts(
  products: CatalogProductRecord[],
  options: AdminProductFilterOptions,
): CatalogProductRecord[] {
  const query = normalize(options.search);
  const exactCatalogCodeMatches = query
    ? products.filter((product) => normalize(product.metadata.catalogNumber ?? "") === query)
    : [];

  // A precise BF lookup is the cleanup fast path. Existing filter selections stay
  // in state and resume as soon as the search is cleared.
  if (exactCatalogCodeMatches.length > 0) {
    return exactCatalogCodeMatches;
  }

  return [...products]
    .filter((product) => {
      const searchableValues = [
        product.metadata.catalogNumber ?? "",
        product.title,
        product.slug,
        ...product.tags,
      ];
      const matchesSearch =
        !query || searchableValues.some((value) => normalize(value).includes(query));
      const matchesCategory =
        options.categoryId === "all" || product.categoryIds.includes(options.categoryId);
      const matchesStatus =
        options.status === "all" ||
        (options.status === "published" &&
          product.isPublished &&
          product.status !== "ARCHIVED") ||
        (options.status === "draft" &&
          !product.isPublished &&
          product.status !== "ARCHIVED") ||
        (options.status === "archived" && product.status === "ARCHIVED");
      const matchesStock = options.stock === "all" || product.availability === options.stock;

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    })
    .sort((left, right) => {
      if (options.sort === "name-asc") {
        return left.title.localeCompare(right.title, "ru");
      }
      if (options.sort === "price-asc") {
        return left.basePriceRub - right.basePriceRub;
      }
      if (options.sort === "price-desc") {
        return right.basePriceRub - left.basePriceRub;
      }
      return (
        new Date(right.metadata.updatedAt).getTime() -
        new Date(left.metadata.updatedAt).getTime()
      );
    });
}
