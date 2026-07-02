#!/usr/bin/env node
/**
 * Repair catalog products whose slug/SEO were generated from UUID filenames.
 * Usage: node scripts/repair-catalog-seo.mjs
 */
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FLOWER_RULES = [
  {
    pattern: /маттиол/i,
    category: "mono-bouquets",
    categoryTitle: "Монобукеты",
    shortDescription:
      "Нежный монобукет из маттиолы в премиальной упаковке Bellaflore",
    composition: "Маттиола, зелень, фирменная лента Bellaflore",
    tags: ["маттиола", "моно-букет", "нежный", "сезонный"],
  },
  {
    pattern: /гортенз/i,
    category: "hydrangeas",
    categoryTitle: "Гортензии",
    shortDescription: "Объёмная композиция из свежих гортензий",
    composition: "Гортензии, зелень, фирменная коробка Bellaflore",
    tags: ["гортензии", "объёмный", "премиум", "композиция"],
  },
  {
    pattern: /пион/i,
    category: "peonies",
    categoryTitle: "Пионы",
    shortDescription: "Нежный букет из пионовидных роз и сезонных пионов",
    composition: "Пионы, эвкалипт, атласная лента Bellaflore",
    tags: ["пионы", "нежный", "сезонный", "подарок"],
  },
  {
    pattern: /роз/i,
    category: "roses",
    categoryTitle: "Розы",
    shortDescription: "Монобукет из премиальных роз",
    composition: "Розы, фирменная лента, премиальная упаковка Bellaflore",
    tags: ["розы", "моно-букет", "премиум", "классика"],
  },
];

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/(^-|-$)/g, "");
}

function matchRule(title) {
  const haystack = title.toLowerCase();
  return (
    FLOWER_RULES.find((rule) => rule.pattern.test(haystack)) ?? {
      category: "author",
      categoryTitle: "Авторские",
      shortDescription: "Авторский букет в премиальной подаче Bellaflore",
      composition:
        "Сезонные цветы, дизайнерская упаковка, фирменная лента Bellaflore",
      tags: ["авторский", "премиум", "подарок", "bellaflore"],
    }
  );
}

function buildRepair(row) {
  const title = row.title.trim();
  const rule = matchRule(title);
  const slug = slugify(title);
  const fullDescription = `${rule.shortDescription}. Композиция собрана флористами Bellaflore с доставкой по Москве в день заказа.`;
  const seoTitle = `${title} — купить ${rule.categoryTitle.toLowerCase()} с доставкой | Bellaflore`;
  const seoDescription = `${rule.shortDescription}. Доставка по Москве сегодня. Премиальные букеты Bellaflore — подарок на любой повод.`;
  const seoH1 = `Букет «${title}»`;
  const seoImageAlt = `Букет ${title} — ${rule.categoryTitle}, Bellaflore`;
  const openGraphTitle = `${title} — Bellaflore`;

  return {
    slug,
    category: rule.category,
    short_description: rule.shortDescription,
    full_description: fullDescription,
    composition: row.composition?.trim() || rule.composition,
    tags: Array.from(new Set([title.toLowerCase(), ...rule.tags])),
    seo_title: seoTitle,
    seo_description: seoDescription,
    seo_h1: seoH1,
    seo_slug: slug,
    seo_image_alt: seoImageAlt,
    seo_keywords: [
      title.toLowerCase(),
      rule.categoryTitle.toLowerCase(),
      "букет с доставкой",
      "цветы москва",
      "bellaflore",
      ...rule.tags.slice(0, 3),
    ],
    open_graph_title: openGraphTitle,
    open_graph_description: rule.shortDescription,
  };
}

function needsRepair(row) {
  return (
    UUID_PATTERN.test(row.slug) ||
    UUID_PATTERN.test(row.seo_slug) ||
    UUID_PATTERN.test(row.seo_title)
  );
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
  const rows = await sql`SELECT * FROM catalog_products`;

  let repaired = 0;
  for (const row of rows) {
    if (!needsRepair(row)) {
      continue;
    }

    const patch = buildRepair(row);
    await sql`
      UPDATE catalog_products
      SET
        slug = ${patch.slug},
        category = ${patch.category},
        short_description = ${patch.short_description},
        full_description = ${patch.full_description},
        composition = ${patch.composition},
        tags = ${patch.tags},
        seo_title = ${patch.seo_title},
        seo_description = ${patch.seo_description},
        seo_h1 = ${patch.seo_h1},
        seo_slug = ${patch.seo_slug},
        seo_image_alt = ${patch.seo_image_alt},
        seo_keywords = ${patch.seo_keywords},
        open_graph_title = ${patch.open_graph_title},
        open_graph_description = ${patch.open_graph_description},
        updated_at = NOW()
      WHERE id = ${row.id}
    `;

    console.log(`✓ repaired ${row.id} → slug "${patch.slug}"`);
    repaired += 1;
  }

  console.log(repaired ? `Done (${repaired} products).` : "No products needed repair.");
  await sql.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
