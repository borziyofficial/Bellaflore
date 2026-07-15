// ==================================================
// SECTION: Admin categories — real persistence (Postgres + file fallback)
// РАЗДЕЛ: Категории администратора — реальное хранение
//
// Purpose (EN): CRUD for admin-created custom catalog categories, merged
// with the built-in static categories for admin UI + storefront use.
// Назначение (RU): CRUD для пользовательских категорий каталога,
// объединённых со встроенными категориями для админки и витрины.
// ==================================================
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/catalogDb/config";
import { listCatalogProducts, upsertCatalogProduct } from "@/lib/catalogDb";
import {
  CATALOG_CATEGORIES,
  CATALOG_CATEGORY_BY_ID,
} from "@/components/catalogEngine/categoriesCatalog";
import { slugifyCatalogProductTitle } from "@/lib/catalogProductSlug";

export type MergedCategoryRecord = {
  id: string;
  slug: string;
  title: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
};

export class CategoryValidationError extends Error {}

export class CategoryInUseError extends Error {
  count: number;
  constructor(count: number) {
    super(`Категория используется в ${count} товар(ах). Перенесите товары или удалите с переносом.`);
    this.name = "CategoryInUseError";
    this.count = count;
  }
}

type CustomCategoryRow = {
  id: string;
  slug: string;
  title: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

const DATA_DIR = join(process.cwd(), ".data");
const DATA_FILE = join(DATA_DIR, "admin-custom-categories.json");

let sqlClient: ReturnType<typeof postgres> | null = null;
let schemaReady: Promise<void> | null = null;

function getSqlClient() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }
  if (!sqlClient) {
    sqlClient = postgres(databaseUrl, { max: 2 });
  }
  return sqlClient;
}

async function ensureSchema(): Promise<void> {
  const sql = getSqlClient();
  if (!sql) {
    return;
  }
  if (!schemaReady) {
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS admin_custom_categories (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT '✨',
        sort_order INTEGER NOT NULL DEFAULT 100,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `.then(() => undefined);
  }
  await schemaReady;
}

function rowToRecord(row: CustomCategoryRow): MergedCategoryRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    icon: row.icon || "✨",
    sortOrder: row.sort_order,
    isActive: row.is_active,
    isCustom: true,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function readFileCategories(): Promise<MergedCategoryRecord[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as MergedCategoryRecord[]) : [];
  } catch {
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, "[]", "utf8");
    return [];
  }
}

async function writeFileCategories(categories: MergedCategoryRecord[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(categories, null, 2), "utf8");
}

export async function listCustomCategories(): Promise<MergedCategoryRecord[]> {
  const sql = getSqlClient();
  if (!sql) {
    const categories = await readFileCategories();
    return [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ru"));
  }

  await ensureSchema();
  const rows = await sql<CustomCategoryRow[]>`
    SELECT * FROM admin_custom_categories ORDER BY sort_order ASC, title ASC
  `;
  return rows.map(rowToRecord);
}

function builtinAsMerged(): MergedCategoryRecord[] {
  return CATALOG_CATEGORIES.map((category) => ({
    id: category.id,
    slug: category.slug,
    title: category.title,
    icon: category.icon ?? "✨",
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    isCustom: false,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  }));
}

export async function listMergedCategories(): Promise<MergedCategoryRecord[]> {
  const custom = await listCustomCategories();
  return [...builtinAsMerged(), ...custom];
}

function findTitleCollision(
  categories: MergedCategoryRecord[],
  title: string,
  excludeId?: string,
): boolean {
  const normalized = title.trim().toLowerCase();
  return categories.some(
    (category) => category.id !== excludeId && category.title.trim().toLowerCase() === normalized,
  );
}

function uniqueSlug(existingSlugs: Set<string>, baseSlug: string): string {
  const base = baseSlug || "category";
  let slug = base;
  let index = 2;
  while (existingSlugs.has(slug)) {
    slug = `${base}-${index}`;
    index += 1;
  }
  return slug;
}

export async function createCustomCategory(titleInput: string): Promise<MergedCategoryRecord> {
  const title = titleInput.trim();
  if (!title) {
    throw new CategoryValidationError("Укажите название категории.");
  }

  const all = await listMergedCategories();
  if (findTitleCollision(all, title)) {
    throw new CategoryValidationError("Категория с таким названием уже существует.");
  }

  const existingSlugs = new Set(all.map((category) => category.slug));
  const slug = uniqueSlug(existingSlugs, slugifyCatalogProductTitle(title));
  const now = new Date().toISOString();
  const id = `custom-${randomUUID()}`;
  const sortOrder = 100 + all.filter((category) => category.isCustom).length;

  const sql = getSqlClient();
  if (!sql) {
    const categories = await readFileCategories();
    const record: MergedCategoryRecord = {
      id,
      slug,
      title,
      icon: "✨",
      sortOrder,
      isActive: true,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };
    await writeFileCategories([...categories, record]);
    return record;
  }

  await ensureSchema();
  const rows = await sql<CustomCategoryRow[]>`
    INSERT INTO admin_custom_categories (id, slug, title, icon, sort_order, is_active, created_at, updated_at)
    VALUES (${id}, ${slug}, ${title}, '✨', ${sortOrder}, TRUE, ${now}, ${now})
    RETURNING *
  `;
  return rowToRecord(rows[0]);
}

export async function renameCustomCategory(
  id: string,
  titleInput: string,
): Promise<MergedCategoryRecord | null> {
  const title = titleInput.trim();
  if (!title) {
    throw new CategoryValidationError("Укажите название категории.");
  }

  if (CATALOG_CATEGORY_BY_ID[id]) {
    throw new CategoryValidationError("Встроенные категории нельзя переименовать.");
  }

  const all = await listMergedCategories();
  const existing = all.find((category) => category.id === id && category.isCustom);
  if (!existing) {
    return null;
  }

  if (findTitleCollision(all, title, id)) {
    throw new CategoryValidationError("Категория с таким названием уже существует.");
  }

  const existingSlugs = new Set(all.filter((c) => c.id !== id).map((c) => c.slug));
  const slug = uniqueSlug(existingSlugs, slugifyCatalogProductTitle(title));
  const now = new Date().toISOString();

  const sql = getSqlClient();
  if (!sql) {
    const categories = await readFileCategories();
    const next = categories.map((category) =>
      category.id === id ? { ...category, title, slug, updatedAt: now } : category,
    );
    await writeFileCategories(next);
    return next.find((category) => category.id === id) ?? null;
  }

  await ensureSchema();
  const rows = await sql<CustomCategoryRow[]>`
    UPDATE admin_custom_categories
    SET title = ${title}, slug = ${slug}, updated_at = ${now}
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? rowToRecord(rows[0]) : null;
}

export async function getCategoryUsageCount(id: string): Promise<number> {
  const products = await listCatalogProducts();
  return products.filter((product) => product.category === id).length;
}

export async function deleteCustomCategory(
  id: string,
  options?: { reassignTo?: string },
): Promise<{ deleted: boolean; reassignedCount: number }> {
  if (CATALOG_CATEGORY_BY_ID[id]) {
    throw new CategoryValidationError("Встроенные категории нельзя удалить.");
  }

  const all = await listMergedCategories();
  const existing = all.find((category) => category.id === id && category.isCustom);
  if (!existing) {
    return { deleted: false, reassignedCount: 0 };
  }

  const products = await listCatalogProducts();
  const affected = products.filter((product) => product.category === id);

  let reassignedCount = 0;
  if (affected.length > 0) {
    if (!options?.reassignTo) {
      throw new CategoryInUseError(affected.length);
    }

    const targetExists = all.some((category) => category.id === options.reassignTo);
    if (!targetExists) {
      throw new CategoryValidationError("Категория для переноса товаров не найдена.");
    }

    const now = new Date().toISOString();
    for (const product of affected) {
      await upsertCatalogProduct({ ...product, category: options.reassignTo, updatedAt: now });
      reassignedCount += 1;
    }
  }

  const sql = getSqlClient();
  if (!sql) {
    const categories = await readFileCategories();
    await writeFileCategories(categories.filter((category) => category.id !== id));
    return { deleted: true, reassignedCount };
  }

  await ensureSchema();
  await sql`DELETE FROM admin_custom_categories WHERE id = ${id}`;
  return { deleted: true, reassignedCount };
}

export async function buildCategoryTitleMap(): Promise<Record<string, string>> {
  const custom = await listCustomCategories();
  const map: Record<string, string> = {};
  for (const category of custom) {
    map[category.id] = category.title;
  }
  return map;
}
