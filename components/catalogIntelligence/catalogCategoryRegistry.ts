// ==================================================
// SECTION: CATALOG INTELLIGENCE
// РАЗДЕЛ: Category registry
// ==================================================
import { buildCatalogExampleRegistryState } from "@/components/catalogIntelligence/catalogExamples";
import type {
  CatalogCategoryRecord,
  CatalogSeason,
  CatalogSmartCategory,
} from "@/components/catalogIntelligence/catalogTypes";

export const CATALOG_CATEGORY_STORAGE_KEY =
  "bellaflore_catalog_intelligence_categories_v1";

export const CATALOG_SMART_CATEGORY_STORAGE_KEY =
  "bellaflore_catalog_intelligence_smart_categories_v1";

let inMemoryCategories: CatalogCategoryRecord[] | null = null;
let inMemorySmartCategories: CatalogSmartCategory[] | null = null;

function readCategoriesFromStorage(): CatalogCategoryRecord[] {
  if (typeof window === "undefined") {
    return inMemoryCategories ?? buildCatalogExampleRegistryState().categories;
  }

  try {
    const raw = window.localStorage.getItem(CATALOG_CATEGORY_STORAGE_KEY);
    if (!raw) {
      return inMemoryCategories ?? buildCatalogExampleRegistryState().categories;
    }

    const parsed = JSON.parse(raw) as CatalogCategoryRecord[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildCatalogExampleRegistryState().categories;
  } catch {
    return inMemoryCategories ?? buildCatalogExampleRegistryState().categories;
  }
}

function writeCategoriesToStorage(categories: CatalogCategoryRecord[]): void {
  inMemoryCategories = categories;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CATALOG_CATEGORY_STORAGE_KEY,
      JSON.stringify(categories),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function readSmartCategoriesFromStorage(): CatalogSmartCategory[] {
  if (typeof window === "undefined") {
    return inMemorySmartCategories ?? buildCatalogExampleRegistryState().smartCategories;
  }

  try {
    const raw = window.localStorage.getItem(CATALOG_SMART_CATEGORY_STORAGE_KEY);
    if (!raw) {
      return inMemorySmartCategories ?? buildCatalogExampleRegistryState().smartCategories;
    }

    const parsed = JSON.parse(raw) as CatalogSmartCategory[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildCatalogExampleRegistryState().smartCategories;
  } catch {
    return inMemorySmartCategories ?? buildCatalogExampleRegistryState().smartCategories;
  }
}

function writeSmartCategoriesToStorage(categories: CatalogSmartCategory[]): void {
  inMemorySmartCategories = categories;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CATALOG_SMART_CATEGORY_STORAGE_KEY,
      JSON.stringify(categories),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

export function listCatalogCategories(): CatalogCategoryRecord[] {
  return readCategoriesFromStorage().sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getCatalogCategoryById(categoryId: string): CatalogCategoryRecord | null {
  return readCategoriesFromStorage().find((category) => category.id === categoryId) ?? null;
}

export function getCatalogCategoryBySlug(slug: string): CatalogCategoryRecord | null {
  return readCategoriesFromStorage().find((category) => category.slug === slug) ?? null;
}

export function listSmartCategories(): CatalogSmartCategory[] {
  return readSmartCategoriesFromStorage()
    .filter((category) => category.isActive)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getSmartCategoryById(categoryId: string): CatalogSmartCategory | null {
  return readSmartCategoriesFromStorage().find((category) => category.id === categoryId) ?? null;
}

export function listSmartCategoriesBySeason(season: CatalogSeason): CatalogSmartCategory[] {
  return listSmartCategories().filter((category) => category.ruleSeasons.includes(season));
}

export function registerCatalogCategory(category: CatalogCategoryRecord): CatalogCategoryRecord {
  const categories = readCategoriesFromStorage();
  const index = categories.findIndex((entry) => entry.id === category.id);
  const next =
    index === -1
      ? [...categories, category]
      : categories.map((entry, entryIndex) => (entryIndex === index ? category : entry));

  writeCategoriesToStorage(next);
  return category;
}

export function registerSmartCategory(category: CatalogSmartCategory): CatalogSmartCategory {
  const categories = readSmartCategoriesFromStorage();
  const index = categories.findIndex((entry) => entry.id === category.id);
  const next =
    index === -1
      ? [...categories, category]
      : categories.map((entry, entryIndex) => (entryIndex === index ? category : entry));

  writeSmartCategoriesToStorage(next);
  return category;
}

export function seedCatalogCategoryRegistry(): CatalogCategoryRecord[] {
  const seed = buildCatalogExampleRegistryState();
  writeCategoriesToStorage(seed.categories);
  writeSmartCategoriesToStorage(seed.smartCategories);
  return listCatalogCategories();
}

export function clearCatalogCategoryRegistry(): void {
  writeCategoriesToStorage([]);
  writeSmartCategoriesToStorage([]);
}
