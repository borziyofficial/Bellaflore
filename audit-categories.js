const fs = require("fs");
const path = require("path");

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
  // Load products from .data/catalog-products.json
  const dataFile = path.join(process.cwd(), ".data", "catalog-products.json");

  let products = [];
  if (fs.existsSync(dataFile)) {
    try {
      const raw = fs.readFileSync(dataFile, "utf8");
      products = JSON.parse(raw);
      console.log("✓ Loaded from .data/catalog-products.json");
    } catch (err) {
      console.error("Failed to read catalog-products.json:", err.message);
      process.exit(1);
    }
  } else {
    console.log(
      "⚠ .data/catalog-products.json not found. Products must be in PostgreSQL database.",
    );
    console.log("To audit products, you need to:");
    console.log(
      "1. Set up PostgreSQL database connection in .env.local (DATABASE_URL)",
    );
    console.log(
      "2. Run: npm run build && npm run audit-categories-db",
    );
    process.exit(0);
  }

  // Filter published products only
  const publishedProducts = products.filter((p) => p.status === "published");

  console.log(`\n📊 AUDIT RESULTS:`);
  console.log(`─────────────────`);
  console.log(`Total published products: ${publishedProducts.length}`);

  // Categorize products by their current category
  const byCategory = {};
  publishedProducts.forEach((product) => {
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
  publishedProducts.forEach((product) => {
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
        console.log(`    - "${item.title}" → should be "${item.suggestedCategory}"`);
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
  console.log(`To fix misplaced products, run:`);
  console.log(`  npm run fix-categories`);
}

auditCategories().catch(console.error);
