import { expect, test } from "@playwright/test";
import {
  getCatalogProductJsonbValues,
  normalizeCatalogProductJsonb,
  type CatalogProductJsonbRow,
} from "../../lib/catalogDb/jsonbNormalization";
import { fetchAdminCatalogCacheState } from "../../components/adminCatalogManager/adminCatalogCacheState";
import type { StoredCatalogProduct } from "../../lib/catalogDb/types";
import type { CatalogProductRecord } from "../../components/catalogEngine/catalogTypes";

const validJsonbRow: CatalogProductJsonbRow = {
  tags: ["маттиола"],
  sizes: { S: 4900 },
  color_palette: ["белый"],
  gallery_images: ["https://example.test/bouquet.jpg"],
  images: [],
  seo_keywords: ["цветы"],
  seo_faq: [],
  schema_product_json_ld: { "@type": "Product" },
};

test("normalizes native JSONB arrays and objects without changing them", () => {
  expect(normalizeCatalogProductJsonb(validJsonbRow, "product-1")).toEqual({
    tags: ["маттиола"],
    sizes: { S: 4900 },
    colorPalette: ["белый"],
    galleryImages: ["https://example.test/bouquet.jpg"],
    images: [],
    seoKeywords: ["цветы"],
    seoFaq: [],
    schemaProductJsonLd: { "@type": "Product" },
  });
});

test("decodes legacy stringified JSONB arrays and objects", () => {
  const legacy = Object.fromEntries(
    Object.entries(validJsonbRow).map(([key, value]) => [key, JSON.stringify(value)]),
  ) as CatalogProductJsonbRow;

  expect(normalizeCatalogProductJsonb(legacy, "product-1")).toEqual(
    normalizeCatalogProductJsonb(validJsonbRow, "product-1"),
  );
});

test("malformed JSONB values degrade to safe containers", () => {
  const originalError = console.error;
  console.error = () => undefined;
  try {
    expect(
      normalizeCatalogProductJsonb(
        {
          ...validJsonbRow,
          tags: "not-json",
          sizes: "[]",
          gallery_images: "{broken",
          schema_product_json_ld: "[]",
        },
        "product-1",
      ),
    ).toMatchObject({ tags: [], sizes: {}, galleryImages: [], schemaProductJsonLd: {} });
  } finally {
    console.error = originalError;
  }
});

test("admin save JSONB values round-trip without double encoding", () => {
  const product = {
    tags: validJsonbRow.tags,
    sizes: validJsonbRow.sizes,
    colorPalette: validJsonbRow.color_palette,
    galleryImages: validJsonbRow.gallery_images,
    images: validJsonbRow.images,
    seoKeywords: validJsonbRow.seo_keywords,
    seoFaq: validJsonbRow.seo_faq,
    schemaProductJsonLd: validJsonbRow.schema_product_json_ld,
  } as StoredCatalogProduct;
  const written = getCatalogProductJsonbValues(product);

  expect(
    normalizeCatalogProductJsonb(
      {
        tags: written.tags,
        sizes: written.sizes,
        color_palette: written.colorPalette,
        gallery_images: written.galleryImages,
        images: written.images,
        seo_keywords: written.seoKeywords,
        seo_faq: written.seoFaq,
        schema_product_json_ld: written.schemaProductJsonLd,
      },
      "product-1",
    ),
  ).toEqual(written);
});

test("catalog fetch failure preserves the last known good admin cache", async () => {
  const product = { id: "product-1" } as CatalogProductRecord;
  const current = {
    products: [product],
    imageStorageWarning: null,
    loadError: null,
    hasFetchedOnce: true,
    lastFetchedAt: 1,
  };

  const next = await fetchAdminCatalogCacheState(
    current,
    async () => {
      throw new Error("temporary failure");
    },
    2,
  );

  expect(next.products).toEqual([product]);
  expect(next.loadError).toBe("temporary failure");
  expect(next.lastFetchedAt).toBe(2);
});
