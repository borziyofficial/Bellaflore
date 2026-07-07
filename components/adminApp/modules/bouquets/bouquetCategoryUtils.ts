// ==================================================
// SECTION: ADMIN APP — Bouquet category helpers (Stage 2.3.1)
// ==================================================
import { getAllCatalogCategories } from "@/components/catalogEngine/categoriesEngine";
import type { AdminBouquetCategory } from "@/components/adminApp/modules/bouquets/bouquetCategoryTypes";
import { slugifyBouquetName } from "@/components/adminApp/modules/bouquets/bouquetUtils";

export function createAdminBouquetCategoryId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `admin-cat_${crypto.randomUUID()}`;
  }

  return `admin-cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function slugifyAdminBouquetCategoryName(name: string): string {
  return slugifyBouquetName(name) || "category";
}

export function mapCatalogCategoryToAdmin(
  category: { id: string; slug: string; title: string },
  now = new Date().toISOString(),
): AdminBouquetCategory {
  return {
    id: category.id,
    name: category.title,
    slug: category.slug,
    createdAt: now,
    updatedAt: now,
  };
}

export function getBuiltinAdminBouquetCategories(): AdminBouquetCategory[] {
  const now = new Date().toISOString();
  return getAllCatalogCategories().map((category) =>
    mapCatalogCategoryToAdmin(category, now),
  );
}

export function sortAdminBouquetCategories(
  categories: AdminBouquetCategory[],
): AdminBouquetCategory[] {
  return [...categories].sort((left, right) =>
    left.name.localeCompare(right.name, "ru"),
  );
}

export function findAdminBouquetCategoryById(
  categories: AdminBouquetCategory[],
  id: string,
): AdminBouquetCategory | null {
  return categories.find((category) => category.id === id) ?? null;
}
