#!/usr/bin/env node
/**
 * Catalog products category audit.
 * Checks all published products for correct categorization.
 * Usage: node scripts/audit-categories.mjs
 */
import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Valid categories based on user specification
const VALID_CATEGORIES = [
  "Розы",
  "Пионы",
  "Гортензии",
  "Коробки",
  "Корзины",
  "Композиции",
  "Авторские",
  "Новинки",
];

// Map flower types to expected categories
const FLOWER_TYPE_MAPPING = {
  rosa: "Розы",
  rose: "Розы",
  роза: "Розы",
  розы: "Розы",
  пион: "Пионы",
  peony: "Пионы",
  пионы: "Пионы",
  гортензия: "Гортензии",
  hydrangea: "Гортензии",
  гортензии: "Гортензии",
  коробка: "Коробки",
  box: "Коробки",
  корзина: "Корзины",
  basket: "Корзины",
  композиция: "Композиции",
  arrangement: "Композиции",
  авторские: "Авторские",
  author: "Авторские",
  новинки: "Новинки",
  new: "Новинки",
};

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

function determineCategory(product) {
  const title = (product.title || "").toLowerCase();
  const composition = (product.composition || "").toLowerCase();
  const description = (product.full_description || "").toLowerCase();
  const fullText = `${title} ${composition} ${description}`;

  for (const [keyword, category] of Object.entries(FLOWER_TYPE_MAPPING)) {
    if (fullText.includes(keyword)) {
      return category;
    }
  }

  return product.category || "UNCATEGORIZED";
}

async function auditCategories() {
  try {
    await loadEnvFile();

    const databaseUrl =
      process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();

    if (!databaseUrl) {
      console.error("❌ DATABASE_URL is not set. Cannot connect to database.");
      process.exit(1);
    }

    console.log("🔍 Retrieving published products from database...\n");
    const sql = postgres(databaseUrl, { max: 1 });

    // Get all published products
    const products = await sql`
      SELECT 
        id, title, category, composition, full_description, status
      FROM catalog_products
      WHERE status = 'published'
      ORDER BY updated_at DESC
    `;

    console.log(`📊 AUDIT RESULTS:`);
    console.log(`─────────────────`);
    console.log(`Total published products: ${products.length}\n`);

    if (products.length === 0) {
      console.log("No published products found in the database.");
      await sql.end();
      process.exit(0);
    }

    // Categorize products by their current category
    const byCategory = {};
    products.forEach((product) => {
      const cat = product.category || "UNCATEGORIZED";
      if (!byCategory[cat]) {
        byCategory[cat] = [];
      }
      byCategory[cat].push(product);
    });

    console.log("Products by current category:");
    Object.entries(byCategory)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([cat, prods]) => {
        const status =
          VALID_CATEGORIES.includes(cat) || cat === "UNCATEGORIZED" ? "✓" : "❌";
        console.log(`  ${status} "${cat}": ${prods.length} products`);
      });

    // Analyze for misplaced products
    const misplaced = [];
    products.forEach((product) => {
      const likelyCategory = determineCategory(product);

      if (likelyCategory !== product.category) {
        misplaced.push({
          id: product.id,
          title: product.title,
          currentCategory: product.category,
          suggestedCategory: likelyCategory,
          composition: (product.composition || "").substring(0, 80),
        });
      }
    });

    console.log(`\n⚠️  Potentially misplaced products: ${misplaced.length}`);

    if (misplaced.length > 0) {
      console.log(`\nMisplaced products breakdown:`);
      const byFromCategory = {};
      misplaced.forEach((m) => {
        if (!byFromCategory[m.currentCategory]) {
          byFromCategory[m.currentCategory] = [];
        }
        byFromCategory[m.currentCategory].push(m);
      });

      Object.entries(byFromCategory).forEach(([cat, items]) => {
        console.log(`\n  From "${cat}" → ${items.length} product(s):`);
        items.slice(0, 5).forEach((item) => {
          console.log(
            `    • "${item.title.substring(0, 50)}" → should be "${item.suggestedCategory}"`,
          );
        });
        if (items.length > 5) {
          console.log(`    ... and ${items.length - 5} more`);
        }
      });
    }

    // Check for invalid categories
    const invalidCategories = Object.keys(byCategory).filter(
      (cat) => cat !== "UNCATEGORIZED" && !VALID_CATEGORIES.includes(cat),
    );

    if (invalidCategories.length > 0) {
      console.log(`\n❌ Invalid category names found:`);
      invalidCategories.forEach((cat) => {
        console.log(`  • "${cat}" (${byCategory[cat].length} products)`);
      });
    }

    console.log(`\nValid categories in system:`);
    console.log(`  ${VALID_CATEGORIES.join(" | ")}`);

    console.log(`\n${"─".repeat(60)}`);
    console.log(`✅ Audit complete.`);
    console.log(
      `   Total: ${products.length} published | Misplaced: ${misplaced.length} | Invalid categories: ${invalidCategories.length}`,
    );

    await sql.end();
  } catch (error) {
    console.error("❌ Audit failed:", error.message);
    process.exit(1);
  }
}

auditCategories();
