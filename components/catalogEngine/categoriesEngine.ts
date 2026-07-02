// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: Categories Engine
//
// Purpose (EN): Query and resolve catalog categories separately from products.
//
// Назначение (RU): Запросы категорий отдельно от товаров.
// ==================================================
import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_BY_ID,
  CATALOG_CATEGORY_BY_SLUG,
} from "@/components/catalogEngine/categoriesCatalog";
import type { CatalogCategoryRecord } from "@/components/catalogEngine/catalogTypes";

export function getAllCatalogCategories(): CatalogCategoryRecord[] {
  return CATALOG_CATEGORIES.filter((category) => category.isActive).sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
}

export function getCatalogCategoryById(
  categoryId: string,
): CatalogCategoryRecord | null {
  const category = CATALOG_CATEGORY_BY_ID[categoryId];
  return category?.isActive ? category : null;
}

export function getCatalogCategoryBySlug(
  slug: string,
): CatalogCategoryRecord | null {
  const category = CATALOG_CATEGORY_BY_SLUG[slug];
  return category?.isActive ? category : null;
}

export function getCatalogCategoriesByParent(
  parentId: string | null,
): CatalogCategoryRecord[] {
  return getAllCatalogCategories().filter(
    (category) => category.parentId === parentId,
  );
}

export function resolveProductCategoryTitles(
  categoryIds: string[],
): string[] {
  return categoryIds
    .map((id) => CATALOG_CATEGORY_BY_ID[id]?.title)
    .filter((title): title is string => Boolean(title));
}

export function productBelongsToCategory(
  categoryIds: string[],
  categoryId: string,
): boolean {
  return categoryIds.includes(categoryId);
}
