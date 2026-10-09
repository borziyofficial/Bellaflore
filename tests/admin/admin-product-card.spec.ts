import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isAdminCatalogCard,
  resolveAdminProductForEdit,
  toAdminProductCard,
} from "../../components/adminCatalogManager/adminProductCard.ts";
import { filterAdminProducts } from "../../components/adminCatalogManager/adminProductFiltering.ts";
import type { CatalogProductRecord } from "../../components/catalogEngine/catalogTypes.ts";

function product(): CatalogProductRecord {
  return {
    id: "admin-product-1",
    slug: "belaya-mattiola",
    title: "Белая Маттиола",
    shortDescription: "Короткое описание",
    fullDescription: "Полное описание ".repeat(40),
    categoryIds: ["roses"],
    tags: ["белый"],
    colors: [],
    flowerTypes: [],
    occasions: [],
    seasons: ["all-season"],
    sizes: [{ sizeId: "S", priceRub: 5900, isActive: true }],
    images: [
      {
        id: "cover",
        url: "https://example.com/cover.webp",
        alt: "Обложка",
        isPrimary: true,
        width: 100,
        height: 100,
        sortOrder: 0,
      },
      {
        id: "side",
        url: "https://example.com/side.webp",
        alt: "Сбоку",
        isPrimary: false,
        width: 100,
        height: 100,
        sortOrder: 1,
      },
    ],
    basePriceRub: 5900,
    availability: "in_stock",
    status: "ACTIVE",
    isPublished: true,
    isFeatured: false,
    isNew: false,
    popularityScore: 60,
    seasonalScore: 50,
    addOnIds: [],
    recommendations: {
      similarProductIds: [],
      premiumAlternativeIds: [],
      budgetAlternativeIds: [],
      frequentlyBoughtTogetherIds: [],
    },
    seo: {
      title: "SEO заголовок",
      description: "SEO описание ".repeat(30),
      slug: "belaya-mattiola",
      canonicalPath: "/catalog/belaya-mattiola",
      schemaType: "Product",
      schemaJsonLd: { description: "Схема ".repeat(50) },
      openGraph: {
        title: "OG",
        description: "OG описание ".repeat(20),
        imageUrl: "https://example.com/cover.webp",
        type: "product",
        locale: "ru_RU",
      },
    },
    searchTerms: ["белый"],
    searchIndexText: "",
    metadata: {
      catalogVersion: "test",
      catalogNumber: "BF-001",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      composition: "Маттиола",
      oldPriceRub: 6900,
      adminSeoDraft: {
        seoH1: "H1",
        schemaProductJsonLd: { description: "Черновик схемы" },
      },
    },
  };
}

test("an admin list card drops descriptions, extra photos, and SEO drafts", () => {
  const full = product();
  const card = toAdminProductCard(full);

  assert.equal(card.fullDescription, "");
  assert.equal(card.shortDescription, "");
  assert.equal(card.metadata.composition, undefined);
  assert.equal(card.metadata.adminSeoDraft, undefined);
  assert.deepEqual(card.seo.schemaJsonLd, {});
  assert.equal(card.seo.description, "");
  assert.deepEqual(card.images.map((image) => image.id), ["cover"]);
  assert.equal(card.images[0]?.isPrimary, true);
  assert.equal(card.metadata.catalogNumber, "BF-001");
  assert.equal(card.basePriceRub, 5900);
  assert.equal(card.metadata.oldPriceRub, 6900);
  assert.equal(card.seo.slug, "belaya-mattiola");
  assert.equal(isAdminCatalogCard(card), true);
  assert.equal(isAdminCatalogCard(full), false);
  assert.ok(JSON.stringify(card).length < JSON.stringify(full).length / 2);
});

test("the list card can still be found by BF code", () => {
  const card = toAdminProductCard(product());
  const found = filterAdminProducts([card], {
    search: "BF-001",
    categoryId: "all",
    status: "all",
    stock: "all",
    sort: "bf-asc",
  });

  assert.deepEqual(found.map((item) => item.id), ["admin-product-1"]);
});

test("opening a list card loads the full product before editing", async () => {
  const card = toAdminProductCard(product());
  const calls: string[] = [];
  const resolved = await resolveAdminProductForEdit(card.id, card, async (id) => {
    calls.push(id);
    return product();
  });

  assert.deepEqual(calls, ["admin-product-1"]);
  assert.equal(resolved.fullDescription.startsWith("Полное описание"), true);
  assert.equal(isAdminCatalogCard(resolved), false);
});

test("a full cached product is not fetched again", async () => {
  const full = product();
  let calls = 0;
  const resolved = await resolveAdminProductForEdit(full.id, full, async () => {
    calls += 1;
    return full;
  });

  assert.equal(calls, 0);
  assert.equal(resolved, full);
});
