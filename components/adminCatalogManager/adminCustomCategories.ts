// ==================================================
// SECTION: Admin — real (server-persisted) categories
// РАЗДЕЛ: Категории — реальное серверное хранение
//
// Purpose (EN): Client-side accessor for admin categories, backed by the
// real database via /api/admin/categories (no mock/localStorage data).
// Назначение (RU): Клиентский доступ к категориям, реально хранящимся в
// базе данных через /api/admin/categories (без mock/localStorage).
// ==================================================
import type { CatalogCategoryRecord } from "@/components/catalogEngine/catalogTypes";
import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_BY_ID,
} from "@/components/catalogEngine/categoriesCatalog";

export type AdminCategoryRecord = CatalogCategoryRecord & { isCustom: boolean };

export const ADMIN_CATEGORIES_CHANGE_EVENT = "admin-categories-change";

export class AdminCategoryApiError extends Error {
  code?: string;
  count?: number;
}

type RawCategory = {
  id: string;
  slug: string;
  title: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  isCustom: boolean;
};

let cache: AdminCategoryRecord[] = CATALOG_CATEGORIES.map((category) => ({
  ...category,
  isCustom: false,
}));

let hasFetchedOnce = false;
let lastFetchedAt = 0;
let inFlightFetch: Promise<AdminCategoryRecord[]> | null = null;
const CATEGORIES_STALE_AFTER_MS = 60_000;

export function hasCategoriesFetchedOnce(): boolean {
  return hasFetchedOnce;
}

function notifyChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ADMIN_CATEGORIES_CHANGE_EVENT));
  }
}

function toCategoryRecord(raw: RawCategory): AdminCategoryRecord {
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: raw.title,
    parentId: null,
    sortOrder: raw.sortOrder,
    isActive: raw.isActive,
    isSeasonal: false,
    icon: raw.icon || "✨",
    seo: {
      title: `${raw.title} — Bellaflore`,
      description: `Премиальные ${raw.title.toLowerCase()} с доставкой по Москве.`,
      slug: raw.slug,
    },
    isCustom: raw.isCustom,
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

async function fetchAdminCategoriesFromServer(): Promise<AdminCategoryRecord[]> {
  const response = await fetch("/api/admin/categories", {
    credentials: "include",
    cache: "no-store",
  });
  const body = await parseJson<{ categories?: RawCategory[]; message?: string }>(response);

  if (!response.ok) {
    throw new Error(body.message || "Не удалось загрузить категории.");
  }

  const list = Array.isArray(body.categories) ? body.categories.map(toCategoryRecord) : [];
  if (list.length > 0) {
    cache = list;
  }
  hasFetchedOnce = true;
  lastFetchedAt = Date.now();
  return cache;
}

/**
 * Cache-first fetch: returns the already-cached list with no network call
 * when it was fetched recently (this is what prevents an identical
 * /api/admin/categories request firing on every admin section switch).
 * Pass `force: true` to bypass the cache (used right after a mutation, or
 * when explicitly reloading).
 */
export async function fetchAdminCategories(
  options?: { force?: boolean },
): Promise<AdminCategoryRecord[]> {
  const isStale = Date.now() - lastFetchedAt > CATEGORIES_STALE_AFTER_MS;

  if (hasFetchedOnce && !options?.force && !isStale) {
    return cache;
  }

  if (inFlightFetch) {
    return inFlightFetch;
  }

  inFlightFetch = fetchAdminCategoriesFromServer().finally(() => {
    inFlightFetch = null;
  });

  return inFlightFetch;
}

export async function createAdminCategoryRemote(title: string): Promise<AdminCategoryRecord> {
  const response = await fetch("/api/admin/categories", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const body = await parseJson<{ category?: RawCategory; message?: string }>(response);

  if (!response.ok || !body.category) {
    throw new Error(body.message || "Не удалось создать категорию.");
  }

  const created = toCategoryRecord(body.category);
  cache = [...cache, created];
  notifyChange();
  return created;
}

export async function renameAdminCategoryRemote(
  id: string,
  title: string,
): Promise<AdminCategoryRecord> {
  const response = await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const body = await parseJson<{ category?: RawCategory; message?: string }>(response);

  if (!response.ok || !body.category) {
    throw new Error(body.message || "Не удалось изменить категорию.");
  }

  const updated = toCategoryRecord(body.category);
  cache = cache.map((category) => (category.id === id ? updated : category));
  notifyChange();
  return updated;
}

export async function deleteAdminCategoryRemote(
  id: string,
  reassignTo?: string,
): Promise<{ reassignedCount: number }> {
  const query = reassignTo ? `?reassignTo=${encodeURIComponent(reassignTo)}` : "";
  const response = await fetch(`/api/admin/categories/${encodeURIComponent(id)}${query}`, {
    method: "DELETE",
    credentials: "include",
  });
  const body = await parseJson<{
    reassignedCount?: number;
    message?: string;
    count?: number;
    code?: string;
  }>(response);

  if (!response.ok) {
    const error = new AdminCategoryApiError(body.message || "Не удалось удалить категорию.");
    error.code = body.code;
    error.count = body.count;
    throw error;
  }

  cache = cache.filter((category) => category.id !== id);
  notifyChange();
  return { reassignedCount: body.reassignedCount ?? 0 };
}

export function getAdminProductCategories(): AdminCategoryRecord[] {
  return cache;
}

export function resolveAdminCategoryTitle(categoryId: string): string {
  return (
    cache.find((category) => category.id === categoryId)?.title ??
    CATALOG_CATEGORY_BY_ID[categoryId]?.title ??
    "—"
  );
}

export function resolveAdminCategoryById(categoryId: string): AdminCategoryRecord | null {
  return cache.find((category) => category.id === categoryId) ?? null;
}
