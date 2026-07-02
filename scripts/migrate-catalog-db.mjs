#!/usr/bin/env node
/**
 * Catalog DB migration — applies lib/catalogDb/schema.sql to Neon/Postgres.
 * Usage: node scripts/migrate-catalog-db.mjs
 * Loads DATABASE_URL from .env.vercel.local or process env.
 */
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

async function loadEnvFile() {
  try {
    const raw = await readFile(join(root, ".env.vercel.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq);
      let value = trimmed.slice(eq + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // optional local env file
  }
}

async function main() {
  await loadEnvFile();

  const databaseUrl =
    process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();

  if (!databaseUrl) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = postgres(databaseUrl, { max: 1 });
  const schemaPath = join(root, "lib", "catalogDb", "schema.sql");
  const schemaSql = await readFile(schemaPath, "utf8");

  console.log("Applying catalog schema…");
  await sql.unsafe(schemaSql);

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'catalog_products'
  `;

  if (tables.length === 0) {
    console.error("Migration failed: catalog_products table not found.");
    process.exit(1);
  }

  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM catalog_products`;
  console.log(`OK — catalog_products exists (${count} rows).`);

  const testId = `migration-test-${Date.now()}`;
  await sql`
  INSERT INTO catalog_products (
    id, slug, title, category, status,
    short_description, full_description, composition,
    tags, sizes, image_url, gallery_images,
    seo_title, seo_description, seo_h1, seo_slug, seo_image_alt, seo_keywords, seo_faq,
    open_graph_title, open_graph_description, schema_product_json_ld,
    is_featured, is_new, is_bestseller, created_at, updated_at
  ) VALUES (
    ${testId},
    ${`${testId}-slug`},
    'Migration Test',
    'roses',
    'draft',
    'test',
    'test',
    'test',
    ${sql.json([])},
    ${sql.json({ S: 1000 })},
    '',
    ${sql.json([])},
    'test',
    'test',
    'test',
    ${`${testId}-slug`},
    'test',
    ${sql.json([])},
    ${sql.json([])},
    'test',
    'test',
    ${sql.json({})},
    false,
    false,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING
  `;

  const readBack = await sql`
    SELECT id, title, status FROM catalog_products WHERE id = ${testId}
  `;

  if (readBack.length === 0) {
    console.error("Write/read test failed.");
    process.exit(1);
  }

  await sql`DELETE FROM catalog_products WHERE id = ${testId}`;
  console.log("Write/read test passed.");

  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
