import { readFile } from "node:fs/promises";
import { join } from "node:path";
import postgres from "postgres";
import { getBouquetDatabaseUrl } from "@/lib/bouquetDb/config";
import {
  normalizeStoredBouquetRecord,
  normalizeStoredCategoryStorage,
} from "@/lib/bouquetDb/normalize";
import type {
  StoredBouquetCategoryStorage,
  StoredBouquetRecord,
} from "@/lib/bouquetDb/types";

let sqlClient: ReturnType<typeof postgres> | null = null;
let schemaReady: Promise<void> | null = null;

function getSqlClient() {
  const databaseUrl = getBouquetDatabaseUrl();
  if (!databaseUrl) {
    return null;
  }

  if (!sqlClient) {
    sqlClient = postgres(databaseUrl, { max: 5 });
  }

  return sqlClient;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = getSqlClient();
      if (!sql) {
        return;
      }

      const schemaPath = join(process.cwd(), "lib", "bouquetDb", "schema.sql");
      const schemaSql = await readFile(schemaPath, "utf8");
      await sql.unsafe(schemaSql);
    })();
  }

  await schemaReady;
}

type BouquetRow = {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  description: string;
  base_price: string | number;
  status: StoredBouquetRecord["status"];
  display_flags: StoredBouquetRecord["displayFlags"];
  display_priority: number;
  badge: StoredBouquetRecord["badge"];
  images: StoredBouquetRecord["images"];
  sizes: StoredBouquetRecord["sizes"];
  seo: StoredBouquetRecord["seo"];
  created_at: Date | string;
  updated_at: Date | string;
};

function rowToBouquet(row: BouquetRow): StoredBouquetRecord | null {
  return normalizeStoredBouquetRecord({
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryId: row.category_id,
    description: row.description,
    basePrice: Number(row.base_price),
    status: row.status,
    displayFlags: row.display_flags,
    displayPriority: row.display_priority,
    badge: row.badge,
    images: row.images,
    sizes: row.sizes,
    seo: row.seo,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  });
}

export async function postgresListBouquets(): Promise<StoredBouquetRecord[]> {
  const sql = getSqlClient();
  if (!sql) {
    return [];
  }

  await ensureSchema();
  const rows = await sql<BouquetRow[]>`
    SELECT *
    FROM admin_bouquets
    ORDER BY updated_at DESC
  `;

  return rows
    .map((row) => rowToBouquet(row))
    .filter((row): row is StoredBouquetRecord => Boolean(row));
}

export async function postgresGetBouquetById(
  id: string,
): Promise<StoredBouquetRecord | null> {
  const sql = getSqlClient();
  if (!sql) {
    return null;
  }

  await ensureSchema();
  const rows = await sql<BouquetRow[]>`
    SELECT *
    FROM admin_bouquets
    WHERE id = ${id}
    LIMIT 1
  `;

  return rows[0] ? rowToBouquet(rows[0]) : null;
}

export async function postgresUpsertBouquet(
  record: StoredBouquetRecord,
): Promise<StoredBouquetRecord> {
  const sql = getSqlClient();
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensureSchema();
  await sql`
    INSERT INTO admin_bouquets (
      id, name, slug, category_id, description, base_price,
      status, display_flags, display_priority, badge,
      images, sizes, seo, created_at, updated_at
    ) VALUES (
      ${record.id},
      ${record.name},
      ${record.slug},
      ${record.categoryId},
      ${record.description},
      ${record.basePrice},
      ${record.status},
      ${sql.json(record.displayFlags)},
      ${record.displayPriority},
      ${record.badge},
      ${sql.json(record.images)},
      ${sql.json(record.sizes)},
      ${sql.json(record.seo)},
      ${record.createdAt},
      ${record.updatedAt}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      slug = EXCLUDED.slug,
      category_id = EXCLUDED.category_id,
      description = EXCLUDED.description,
      base_price = EXCLUDED.base_price,
      status = EXCLUDED.status,
      display_flags = EXCLUDED.display_flags,
      display_priority = EXCLUDED.display_priority,
      badge = EXCLUDED.badge,
      images = EXCLUDED.images,
      sizes = EXCLUDED.sizes,
      seo = EXCLUDED.seo,
      updated_at = EXCLUDED.updated_at
  `;

  return record;
}

export async function postgresReplaceBouquets(
  records: StoredBouquetRecord[],
): Promise<StoredBouquetRecord[]> {
  const sql = getSqlClient();
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensureSchema();

  await sql.begin(async (transaction) => {
    await transaction`DELETE FROM admin_bouquets`;
    for (const record of records) {
      await transaction`
        INSERT INTO admin_bouquets (
          id, name, slug, category_id, description, base_price,
          status, display_flags, display_priority, badge,
          images, sizes, seo, created_at, updated_at
        ) VALUES (
          ${record.id},
          ${record.name},
          ${record.slug},
          ${record.categoryId},
          ${record.description},
          ${record.basePrice},
          ${record.status},
          ${transaction.json(record.displayFlags)},
          ${record.displayPriority},
          ${record.badge},
          ${transaction.json(record.images)},
          ${transaction.json(record.sizes)},
          ${transaction.json(record.seo)},
          ${record.createdAt},
          ${record.updatedAt}
        )
      `;
    }
  });

  return records;
}

export async function postgresDeleteBouquet(id: string): Promise<boolean> {
  const sql = getSqlClient();
  if (!sql) {
    return false;
  }

  await ensureSchema();
  const rows = await sql`
    DELETE FROM admin_bouquets
    WHERE id = ${id}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function postgresBulkSetBouquetStatus(
  ids: string[],
  status: StoredBouquetRecord["status"],
): Promise<StoredBouquetRecord[]> {
  const sql = getSqlClient();
  if (!sql) {
    return [];
  }

  await ensureSchema();
  await sql`
    UPDATE admin_bouquets
    SET status = ${status}, updated_at = NOW()
    WHERE id = ANY(${ids})
  `;

  return postgresListBouquets();
}

export async function postgresBulkDeleteBouquets(
  ids: string[],
): Promise<StoredBouquetRecord[]> {
  const sql = getSqlClient();
  if (!sql) {
    return [];
  }

  await ensureSchema();
  await sql`
    DELETE FROM admin_bouquets
    WHERE id = ANY(${ids})
  `;

  return postgresListBouquets();
}

export async function postgresReadCategoryStorage(): Promise<StoredBouquetCategoryStorage> {
  const sql = getSqlClient();
  if (!sql) {
    return { custom: [], overrides: {} };
  }

  await ensureSchema();
  const rows = await sql<{ payload: StoredBouquetCategoryStorage }[]>`
    SELECT payload
    FROM admin_bouquet_category_storage
    WHERE id = 'default'
    LIMIT 1
  `;

  if (!rows[0]) {
    await sql`
      INSERT INTO admin_bouquet_category_storage (id, payload)
      VALUES ('default', ${sql.json({ custom: [], overrides: {} })})
      ON CONFLICT (id) DO NOTHING
    `;
    return { custom: [], overrides: {} };
  }

  return normalizeStoredCategoryStorage(rows[0].payload);
}

export async function postgresWriteCategoryStorage(
  storage: StoredBouquetCategoryStorage,
): Promise<StoredBouquetCategoryStorage> {
  const sql = getSqlClient();
  if (!sql) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensureSchema();
  const normalized = normalizeStoredCategoryStorage(storage);
  await sql`
    INSERT INTO admin_bouquet_category_storage (id, payload, updated_at)
    VALUES ('default', ${sql.json(normalized)}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      payload = EXCLUDED.payload,
      updated_at = EXCLUDED.updated_at
  `;
  return normalized;
}
