import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { listPublishedCatalogProducts } from "../lib/catalogDb/index.ts";

const __dirname = join(fileURLToPath(import.meta.url), "..");

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

async function auditCategories() {
  try {
    console.log("🔍 Retrieving published products from database...");
    const products = await listPublishedCatalogProducts();

    console.log(`\n📊 AUDIT RESULTS:`);
    console.log(`─────────────────`);
    console.log(`Total published products: ${products.length}`);

    if (products.length === 0) {
      console.log("No published products found in the database.");
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

    console.log(`\nProducts by current category:`);
    Object.entries(byCategory).forEach(([cat, prods]) => {
      console.log(`  ${cat}: ${prods.length} products`);
    });

    // Analyze for misplaced products
    const misplaced = [];
    products.forEach((product) => {
      // Check if product seems to be in wrong category based on composition or title
      const title = (product.title || "").toLowerCase();
      const composition = (product.composition || "").toLowerCase();
      const description = (product.fullDescription || "").toLowerCase();

      // Determine likely correct category based on content
      let likelyCategory = product.category;

      for (const [keyword, category] of Object.entries(FLOWER_TYPE_MAPPING)) {
        if (
          title.includes(keyword) ||
          composition.includes(keyword) ||
          description.includes(keyword)
        ) {
          likelyCategory = category;
          break;
        }
      }

      if (likelyCategory !== product.category) {
        misplaced.push({
          id: product.id,
          title: product.title,
          currentCategory: product.category,
          suggestedCategory: likelyCategory,
          composition: product.composition.substring(0, 100),
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
        console.log(`  From "${cat}" (${items.length}):`);
        items.slice(0, 3).forEach((item) => {
          console.log(
            `    - "${item.title}" → should be "${item.suggestedCategory}"`,
          );
        });
        if (items.length > 3) {
          console.log(`    ... and ${items.length - 3} more`);
        }
      });
    }

    console.log(`\nValid categories defined in system:`);
    console.log(`  ${VALID_CATEGORIES.join(", ")}`);

    // Check for invalid categories
    const invalidCategories = Object.keys(byCategory).filter(
      (cat) => cat !== "UNCATEGORIZED" && !VALID_CATEGORIES.includes(cat),
    );

    if (invalidCategories.length > 0) {
      console.log(`\n❌ Invalid category names found:`);
      invalidCategories.forEach((cat) => {
        console.log(`  "${cat}" (${byCategory[cat].length} products)`);
      });
    }

    console.log(`\n${"─".repeat(50)}`);
    console.log(
      `\n✅ Audit complete. Found ${misplaced.length} potentially misplaced products.`,
    );
  } catch (error) {
    console.error("❌ Audit failed:", error.message);
    process.exit(1);
  }
}

auditCategories();
