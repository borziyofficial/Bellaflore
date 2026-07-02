#!/usr/bin/env node
/**
 * Migrate all catalog product slugs to Latin transliteration.
 * Usage: npm run catalog:migrate-slugs
 */
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const CYRILLIC_TO_LATIN = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function transliterateRussian(value) {
  return [...value.toLowerCase()]
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("");
}

function slugifyCatalogProductTitle(value) {
  const transliterated = transliterateRussian(String(value || "").trim());
  return transliterated
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function isLatinCatalogSlug(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(value || "").trim());
}

function resolveLatinCatalogSlug(title, currentSlug = "", seoSlug = "") {
  const candidates = [seoSlug.trim(), currentSlug.trim(), title.trim()].filter(Boolean);

  for (const candidate of candidates) {
    if (isLatinCatalogSlug(candidate)) {
      return candidate;
    }
  }

  for (const candidate of candidates) {
    const latin = slugifyCatalogProductTitle(candidate);
    if (latin) {
      return latin;
    }
  }

  return slugifyCatalogProductTitle(title);
}

function hasCyrillicSlug(value) {
  return /[а-яё]/i.test(String(value || ""));
}

async function loadEnvFile() {
  for (const fileName of [".env.local", ".env.vercel.local"]) {
    try {
      const raw = await readFile(join(root, fileName), "utf8");
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
      // optional
    }
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
  const rows = await sql`SELECT * FROM catalog_products ORDER BY updated_at DESC`;

  let migrated = 0;
  const usedSlugs = new Set();

  for (const row of rows) {
    let latinSlug = resolveLatinCatalogSlug(row.title, row.slug, row.seo_slug);

    if (usedSlugs.has(latinSlug)) {
      latinSlug = `${latinSlug}-${row.id.slice(-6).toLowerCase()}`;
    }
    usedSlugs.add(latinSlug);

    const needsUpdate =
      row.slug !== latinSlug ||
      row.seo_slug !== latinSlug ||
      hasCyrillicSlug(row.slug) ||
      hasCyrillicSlug(row.seo_slug);

    if (!needsUpdate) {
      continue;
    }

    const schema =
      row.schema_product_json_ld && typeof row.schema_product_json_ld === "object"
        ? {
            ...row.schema_product_json_ld,
            offers:
              row.schema_product_json_ld.offers &&
              typeof row.schema_product_json_ld.offers === "object"
                ? {
                    ...row.schema_product_json_ld.offers,
                    url: `https://www.bellaflore.ru/catalog/${latinSlug}`,
                  }
                : row.schema_product_json_ld.offers,
          }
        : row.schema_product_json_ld;

    await sql`
      UPDATE catalog_products
      SET
        slug = ${latinSlug},
        seo_slug = ${latinSlug},
        schema_product_json_ld = ${sql.json(schema ?? {})},
        updated_at = NOW()
      WHERE id = ${row.id}
    `;

    console.log(`✓ ${row.id}: ${row.slug} → ${latinSlug}`);
    migrated += 1;
  }

  const remaining = await sql`
    SELECT id, slug, seo_slug
    FROM catalog_products
    WHERE slug ~ '[а-яА-ЯёЁ]' OR seo_slug ~ '[а-яА-ЯёЁ]'
  `;

  if (remaining.length > 0) {
    console.error("Cyrillic slugs remain:", remaining);
    process.exit(1);
  }

  console.log(migrated ? `Done (${migrated} products migrated).` : "All slugs already Latin.");
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
