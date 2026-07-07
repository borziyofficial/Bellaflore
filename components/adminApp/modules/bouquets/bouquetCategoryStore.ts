// ==================================================
// SECTION: ADMIN APP — Bouquet category local store (Stage 2.3.1)
// ==================================================
import type {
  AdminBouquetCategory,
  AdminBouquetCategoryOverride,
} from "@/components/adminApp/modules/bouquets/bouquetCategoryTypes";
import {
  createAdminBouquetCategoryId,
  getBuiltinAdminBouquetCategories,
  slugifyAdminBouquetCategoryName,
  sortAdminBouquetCategories,
} from "@/components/adminApp/modules/bouquets/bouquetCategoryUtils";

export const ADMIN_BOUQUET_CATEGORIES_STORAGE_KEY = "bellaflore_admin_bouquet_categories_v1";

type AdminBouquetCategoryStorage = {
  custom: AdminBouquetCategory[];
  overrides: Record<string, AdminBouquetCategoryOverride>;
};

const EMPTY_STORAGE: AdminBouquetCategoryStorage = {
  custom: [],
  overrides: {},
};

function readStorage(): AdminBouquetCategoryStorage {
  if (typeof window === "undefined") {
    return EMPTY_STORAGE;
  }

  try {
    const raw = window.localStorage.getItem(ADMIN_BOUQUET_CATEGORIES_STORAGE_KEY);
    if (!raw) {
      return EMPTY_STORAGE;
    }

    const parsed = JSON.parse(raw) as Partial<AdminBouquetCategoryStorage>;
    return {
      custom: Array.isArray(parsed.custom) ? parsed.custom : [],
      overrides:
        parsed.overrides && typeof parsed.overrides === "object" ? parsed.overrides : {},
    };
  } catch {
    return EMPTY_STORAGE;
  }
}

function writeStorage(storage: AdminBouquetCategoryStorage): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ADMIN_BOUQUET_CATEGORIES_STORAGE_KEY,
      JSON.stringify(storage),
    );
    window.dispatchEvent(new Event("admin-bouquet-categories-change"));
  } catch {
    // Optional admin storage.
  }
}

function applyOverride(
  category: AdminBouquetCategory,
  override?: AdminBouquetCategoryOverride,
): AdminBouquetCategory {
  if (!override) {
    return category;
  }

  return {
    ...category,
    name: override.name,
    slug: override.slug,
    updatedAt: override.updatedAt,
  };
}

export function readAdminBouquetCategories(): AdminBouquetCategory[] {
  const storage = readStorage();
  const builtin = getBuiltinAdminBouquetCategories();
  const merged = new Map<string, AdminBouquetCategory>();

  for (const category of builtin) {
    merged.set(
      category.id,
      applyOverride(category, storage.overrides[category.id]),
    );
  }

  for (const category of storage.custom) {
    if (category?.id) {
      merged.set(category.id, category);
    }
  }

  return sortAdminBouquetCategories(Array.from(merged.values()));
}

export function addAdminBouquetCategory(name: string): AdminBouquetCategory {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("empty-category-name");
  }

  const storage = readStorage();
  const now = new Date().toISOString();
  const baseSlug = slugifyAdminBouquetCategoryName(trimmed);
  const takenSlugs = new Set(
    readAdminBouquetCategories().map((category) => category.slug),
  );

  let slug = baseSlug;
  let index = 2;
  while (takenSlugs.has(slug)) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  const category: AdminBouquetCategory = {
    id: createAdminBouquetCategoryId(),
    name: trimmed,
    slug,
    createdAt: now,
    updatedAt: now,
  };

  writeStorage({
    ...storage,
    custom: [category, ...storage.custom],
  });

  return category;
}

export function renameAdminBouquetCategory(
  categoryId: string,
  nextName: string,
): AdminBouquetCategory | null {
  const trimmed = nextName.trim();
  if (!trimmed || !categoryId) {
    return null;
  }

  const storage = readStorage();
  const now = new Date().toISOString();
  const existing = readAdminBouquetCategories().find(
    (category) => category.id === categoryId,
  );

  if (!existing) {
    return null;
  }

  const customIndex = storage.custom.findIndex((category) => category.id === categoryId);
  if (customIndex >= 0) {
    const updated: AdminBouquetCategory = {
      ...storage.custom[customIndex],
      name: trimmed,
      slug: slugifyAdminBouquetCategoryName(trimmed),
      updatedAt: now,
    };
    const custom = [...storage.custom];
    custom[customIndex] = updated;
    writeStorage({ ...storage, custom });
    return updated;
  }

  const overrides = {
    ...storage.overrides,
    [categoryId]: {
      name: trimmed,
      slug: slugifyAdminBouquetCategoryName(trimmed),
      updatedAt: now,
    },
  };

  writeStorage({ ...storage, overrides });
  return applyOverride(existing, overrides[categoryId]);
}

export function resolveAdminBouquetCategoryName(categoryId: string): string {
  if (!categoryId) {
    return "";
  }

  return (
    readAdminBouquetCategories().find((category) => category.id === categoryId)?.name ??
    categoryId
  );
}
