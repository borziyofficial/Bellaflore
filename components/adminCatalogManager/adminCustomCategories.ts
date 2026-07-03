// ==================================================
// SECTION: Admin — runtime custom categories
// РАЗДЕЛ: Пользовательские категории (localStorage)
// ==================================================
import type { CatalogCategoryRecord } from "@/components/catalogEngine/catalogTypes";
import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_BY_ID,
} from "@/components/catalogEngine/categoriesCatalog";
import { slugifyCatalogProductTitle } from "@/lib/catalogProductSlug";

const STORAGE_KEY = "bellaflore-admin-custom-categories";

export type AdminCustomCategory = {
  id: string;
  slug: string;
  title: string;
  createdAt: string;
};

function readCustomCategories(): AdminCustomCategory[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as AdminCustomCategory[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomCategories(categories: AdminCustomCategory[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
}

function toCatalogCategoryRecord(
  category: AdminCustomCategory,
  sortOrder: number,
): CatalogCategoryRecord {
  return {
    id: category.id,
    slug: category.slug,
    title: category.title,
    description: category.title,
    parentId: null,
    sortOrder,
    isActive: true,
    isSeasonal: false,
    icon: "✨",
    seo: {
      title: `${category.title} — Bellaflore`,
      description: `Премиальные ${category.title.toLowerCase()} с доставкой по Москве.`,
      slug: category.slug,
    },
  };
}

export function getAdminCustomCategories(): AdminCustomCategory[] {
  return readCustomCategories();
}

export function createAdminCustomCategory(title: string): AdminCustomCategory {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new Error("Укажите название категории.");
  }

  const slug = slugifyCatalogProductTitle(trimmed) || `category-${Date.now()}`;
  const id = `custom-${slug}`;

  const existing = readCustomCategories();
  const duplicate = existing.find(
    (item) => item.id === id || item.title.toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) {
    return duplicate;
  }

  const created: AdminCustomCategory = {
    id,
    slug,
    title: trimmed,
    createdAt: new Date().toISOString(),
  };

  writeCustomCategories([created, ...existing]);
  return created;
}

export function getAdminProductCategories(): CatalogCategoryRecord[] {
  const custom = readCustomCategories().map((category, index) =>
    toCatalogCategoryRecord(category, 100 + index),
  );

  return [...CATALOG_CATEGORIES, ...custom];
}

export function resolveAdminCategoryTitle(categoryId: string): string {
  return (
    CATALOG_CATEGORY_BY_ID[categoryId]?.title ??
    readCustomCategories().find((item) => item.id === categoryId)?.title ??
    "—"
  );
}

export function resolveAdminCategoryById(
  categoryId: string,
): CatalogCategoryRecord | null {
  const builtIn = CATALOG_CATEGORY_BY_ID[categoryId];
  if (builtIn) {
    return builtIn;
  }

  const custom = readCustomCategories().find((item) => item.id === categoryId);
  return custom ? toCatalogCategoryRecord(custom, 999) : null;
}
