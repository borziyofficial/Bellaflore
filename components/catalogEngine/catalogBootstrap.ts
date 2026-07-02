// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: Catalog bootstrap
//
// Purpose (EN): Build admin-ready product records from legacy catalog seed.
//
// Назначение (RU): Сборка записей каталога из legacy seed без ломания UI.
// ==================================================
import {
  CATALOG_CATEGORY_BY_ID,
  CATALOG_CATEGORIES,
} from "@/components/catalogEngine/categoriesCatalog";
import type {
  CatalogProductImage,
  CatalogProductRecord,
  CatalogProductSize,
  CatalogProductSizeId,
  ProductAvailabilityStatus,
} from "@/components/catalogEngine/catalogTypes";
import { buildProductSeoBundle } from "@/components/catalogEngine/seoEngine";
import { getActiveProductAddOns } from "@/components/product/productAddOnsCatalog";
import type { CatalogProduct } from "@/data/catalogProducts";

export const CATALOG_ENGINE_VERSION = "bellaflore_catalog_engine_v1";

const SIZE_SCALE: Record<CatalogProductSizeId, number> = {
  S: 1,
  M: 1.27,
  L: 1.67,
  XL: 2.2,
};

const SIZE_PRICE_OVERRIDES: Record<
  string,
  Partial<Record<CatalogProductSizeId, number>>
> = {
  "red-luxury": { S: 14900, M: 18900, L: 24900, XL: 32900 },
  "pink-elegance": { S: 11900, M: 15900, L: 20900, XL: 26900 },
  "white-pearl": { S: 24900, M: 29900, L: 36900, XL: 45900 },
  "golden-romance": { S: 15900, M: 19900, L: 25900, XL: 33900 },
  "luxury-box": { S: 13900, M: 16900, L: 21900, XL: 28900 },
  "royal-collection": { S: 18900, M: 22900, L: 28900, XL: 36900 },
};

const LEGACY_CATEGORY_MAP: Record<string, string[]> = {
  Розы: ["roses", "mono-bouquets"],
  "Авторские букеты": ["author"],
  Коробки: ["boxes"],
  Композиции: ["author", "vip"],
  "Премиальные букеты": ["author", "vip"],
  "Пионы и гортензии": ["peonies", "hydrangeas"],
};

const NEW_PRODUCT_IDS = new Set(["pink-elegance"]);
const FEATURED_PRODUCT_IDS = new Set(["white-pearl", "royal-collection"]);

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/(^-|-$)/g, "");
}

function inferColors(tags: string[] = []): string[] {
  const colors: string[] = [];
  const map: Record<string, string> = {
    красные: "red",
    белые: "white",
    розовый: "pink",
    нежный: "soft",
  };

  for (const tag of tags) {
    const normalized = tag.toLowerCase();
    for (const [needle, color] of Object.entries(map)) {
      if (normalized.includes(needle)) {
        colors.push(color);
      }
    }
  }

  return [...new Set(colors)];
}

function inferSeasons(tags: string[] = []): string[] {
  if (tags.some((tag) => tag.toLowerCase().includes("сезон"))) {
    return ["spring", "summer"];
  }

  return ["all-season"];
}

function inferOccasions(searchTerms: string[] = []): string[] {
  const occasions: string[] = [];
  const joined = searchTerms.join(" ").toLowerCase();

  if (joined.includes("день рождения") || joined.includes("birthday")) {
    occasions.push("birthday");
  }

  if (joined.includes("любим") || joined.includes("romantic")) {
    occasions.push("romantic");
  }

  if (joined.includes("мам")) {
    occasions.push("for_mom");
  }

  return occasions;
}

function resolveCategoryIds(product: CatalogProduct): string[] {
  const mapped = LEGACY_CATEGORY_MAP[product.category ?? ""] ?? [];
  const flowerType = product.flowerType?.toLowerCase() ?? "";

  if (flowerType.includes("роз")) {
    mapped.push("roses");
  }

  if (flowerType.includes("пион")) {
    mapped.push("peonies");
  }

  if (flowerType.includes("гортенз")) {
    mapped.push("hydrangeas");
  }

  if (product.tags?.some((tag) => tag.includes("моно"))) {
    mapped.push("mono-bouquets");
  }

  if (NEW_PRODUCT_IDS.has(product.id)) {
    mapped.push("new");
  }

  return [...new Set(mapped.filter((id) => CATALOG_CATEGORY_BY_ID[id]))];
}

function buildSizes(product: CatalogProduct): CatalogProductSize[] {
  const overrides = SIZE_PRICE_OVERRIDES[product.id];
  const sizes: CatalogProductSizeId[] = ["S", "M", "L", "XL"];

  return sizes.map((sizeId) => {
    const priceRub =
      overrides?.[sizeId] ?? Math.round(product.priceRub * SIZE_SCALE[sizeId]);
    const stemCount = product.stemCount
      ? Math.round(product.stemCount * SIZE_SCALE[sizeId])
      : undefined;

    return {
      sizeId,
      priceRub,
      isActive: priceRub > 0,
      stemCount,
      description:
        stemCount !== undefined
          ? `${stemCount} стеблей · размер ${sizeId}`
          : `${product.description} · размер ${sizeId}`,
    };
  });
}

function buildImages(product: CatalogProduct): CatalogProductImage[] {
  const gallerySources = [
    product.src,
    product.src,
    product.src,
  ];

  return gallerySources.map((url, index) => ({
    id: `${product.id}-image-${index}`,
    url,
    alt: index === 0 ? product.alt : `${product.title} — фото ${index + 1}`,
    width: product.width,
    height: product.height,
    sortOrder: index + 1,
    isPrimary: index === 0,
  }));
}

function inferAvailability(productId: string): ProductAvailabilityStatus {
  if (productId === "golden-romance") {
    return "made_to_order";
  }

  return "in_stock";
}

function buildRecommendations(
  product: CatalogProduct,
  allProducts: CatalogProduct[],
): CatalogProductRecord["recommendations"] {
  const sameCategory = allProducts.filter(
    (item) =>
      item.id !== product.id && item.category === product.category,
  );
  const cheaper = allProducts
    .filter((item) => item.id !== product.id && item.priceRub < product.priceRub)
    .sort((left, right) => right.priceRub - left.priceRub);
  const premium = allProducts
    .filter((item) => item.id !== product.id && item.priceRub > product.priceRub)
    .sort((left, right) => left.priceRub - right.priceRub);

  const similar = sameCategory.length > 0 ? sameCategory : allProducts;

  return {
    similarProductIds: similar
      .filter((item) => item.id !== product.id)
      .slice(0, 4)
      .map((item) => item.id),
    premiumAlternativeIds: premium.slice(0, 3).map((item) => item.id),
    budgetAlternativeIds: cheaper.slice(0, 3).map((item) => item.id),
    frequentlyBoughtTogetherIds: allProducts
      .filter((item) => item.id !== product.id)
      .slice(0, 2)
      .map((item) => item.id),
  };
}

function buildSearchIndexText(product: CatalogProductRecord): string {
  return [
    product.title,
    product.shortDescription,
    product.fullDescription,
    product.tags.join(" "),
    product.colors.join(" "),
    product.flowerTypes.join(" "),
    product.occasions.join(" "),
    product.seasons.join(" "),
    product.searchTerms.join(" "),
    product.categoryIds
      .map((id) => CATALOG_CATEGORY_BY_ID[id]?.title ?? "")
      .join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

export function bootstrapCatalogProduct(
  product: CatalogProduct,
  allProducts: CatalogProduct[],
): CatalogProductRecord {
  const slug = slugify(product.id);
  const now = new Date().toISOString();
  const categoryIds = resolveCategoryIds(product);
  const sizes = buildSizes(product);
  const images = buildImages(product);
  const basePriceRub = Math.min(...sizes.map((size) => size.priceRub));
  const addOnIds = getActiveProductAddOns().map((item) => item.id);
  const seo = buildProductSeoBundle({
    title: product.title,
    shortDescription: product.description,
    fullDescription: product.description,
    slug,
    primaryImageUrl: product.src,
    basePriceRub,
  });

  const record: CatalogProductRecord = {
    id: product.id,
    slug,
    title: product.title,
    shortDescription: product.description,
    fullDescription: product.description,
    categoryIds,
    tags: product.tags ?? [],
    colors: inferColors(product.tags),
    flowerTypes: product.flowerType ? [product.flowerType] : [],
    occasions: inferOccasions(product.searchTerms),
    seasons: inferSeasons(product.tags),
    sizes,
    images,
    basePriceRub,
    availability: inferAvailability(product.id),
    status: product.id === "golden-romance" ? "DRAFT" : "ACTIVE",
    isPublished: product.id !== "golden-romance",
    isFeatured: FEATURED_PRODUCT_IDS.has(product.id),
    isNew: NEW_PRODUCT_IDS.has(product.id),
    popularityScore: FEATURED_PRODUCT_IDS.has(product.id) ? 90 : 60,
    seasonalScore: product.tags?.some((tag) => tag.includes("сезон")) ? 80 : 40,
    addOnIds,
    recommendations: buildRecommendations(product, allProducts),
    seo,
    searchTerms: product.searchTerms ?? [],
    searchIndexText: "",
    metadata: {
      catalogVersion: CATALOG_ENGINE_VERSION,
      createdAt: now,
      updatedAt: now,
      legacyCategory: product.category,
      stemCount: product.stemCount,
    },
  };

  return {
    ...record,
    searchIndexText: buildSearchIndexText(record),
  };
}

export function bootstrapCatalogFromLegacy(
  legacyProducts: CatalogProduct[],
): CatalogProductRecord[] {
  return legacyProducts.map((product) =>
    bootstrapCatalogProduct(product, legacyProducts),
  );
}

export function getDefaultCatalogSnapshot(
  legacyProducts: CatalogProduct[],
): {
  products: CatalogProductRecord[];
  categories: typeof CATALOG_CATEGORIES;
  version: string;
  updatedAt: string;
} {
  return {
    products: bootstrapCatalogFromLegacy(legacyProducts),
    categories: CATALOG_CATEGORIES,
    version: CATALOG_ENGINE_VERSION,
    updatedAt: new Date().toISOString(),
  };
}
