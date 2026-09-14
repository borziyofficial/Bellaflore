import type { AdminProductImageDraft } from "@/components/adminCatalogManager/adminCatalogTypes";
import type { AdminSeoFaqItem } from "@/components/adminCatalogManager/adminSeoTypes";
import type {
  CatalogProductSizePrices,
  StoredCatalogProduct,
} from "@/lib/catalogDb/types";

type JsonbFieldContext = {
  productId: string;
  field: string;
};

export type CatalogProductJsonbValues = Pick<
  StoredCatalogProduct,
  | "tags"
  | "sizes"
  | "colorPalette"
  | "galleryImages"
  | "images"
  | "seoKeywords"
  | "seoFaq"
  | "schemaProductJsonLd"
>;

export type CatalogProductJsonbRow = {
  tags: unknown;
  sizes: unknown;
  color_palette: unknown;
  gallery_images: unknown;
  images: unknown;
  seo_keywords: unknown;
  seo_faq: unknown;
  schema_product_json_ld: unknown;
};

function valueKind(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function logInvalidJsonb(
  context: JsonbFieldContext,
  expected: "array" | "object",
  value: unknown,
  reason: "invalid_json" | "unexpected_type" | "invalid_items",
): void {
  console.error("[catalogDb] Invalid product JSONB field", {
    operation: "normalize_product_jsonb",
    productId: context.productId,
    field: context.field,
    expected,
    actual: valueKind(value),
    reason,
  });
}

function decodeLegacyJsonb(
  value: unknown,
  context: JsonbFieldContext,
  expected: "array" | "object",
): unknown {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    logInvalidJsonb(context, expected, value, "invalid_json");
    return undefined;
  }
}

function normalizeArray<T>(
  value: unknown,
  context: JsonbFieldContext,
  isItem: (item: unknown) => item is T,
): T[] {
  const decoded = decodeLegacyJsonb(value, context, "array");
  if (!Array.isArray(decoded)) {
    if (decoded !== undefined && decoded !== null) {
      logInvalidJsonb(context, "array", decoded, "unexpected_type");
    }
    return [];
  }

  const valid = decoded.filter(isItem);
  if (valid.length !== decoded.length) {
    logInvalidJsonb(context, "array", decoded, "invalid_items");
  }
  return valid;
}

function normalizeObject(
  value: unknown,
  context: JsonbFieldContext,
): Record<string, unknown> {
  const decoded = decodeLegacyJsonb(value, context, "object");
  if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
    if (decoded !== undefined && decoded !== null) {
      logInvalidJsonb(context, "object", decoded, "unexpected_type");
    }
    return {};
  }
  return decoded as Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isImageDraft(value: unknown): value is AdminProductImageDraft {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    [value.originalUrl, value.processedUrl, value.thumbnailUrl].some(
      (url) => typeof url === "string" && url.length > 0,
    )
  );
}

function isSeoFaqItem(value: unknown): value is AdminSeoFaqItem {
  return (
    isRecord(value) &&
    typeof value.question === "string" &&
    typeof value.answer === "string"
  );
}

function normalizeSizes(value: unknown, context: JsonbFieldContext): CatalogProductSizePrices {
  const record = normalizeObject(value, context);
  const sizes: CatalogProductSizePrices = {};
  let hasInvalidPrice = false;
  for (const size of ["S", "M", "L", "XL"] as const) {
    const price = record[size];
    if (typeof price === "number" && Number.isFinite(price) && price > 0) {
      sizes[size] = price;
    } else if (price !== undefined) {
      hasInvalidPrice = true;
    }
  }
  if (hasInvalidPrice) {
    logInvalidJsonb(context, "object", record, "invalid_items");
  }
  return sizes;
}

export function normalizeCatalogProductJsonb(
  row: CatalogProductJsonbRow,
  productId: string,
): CatalogProductJsonbValues {
  const context = (field: string): JsonbFieldContext => ({ productId, field });

  return {
    tags: normalizeArray(row.tags, context("tags"), (item): item is string => typeof item === "string"),
    sizes: normalizeSizes(row.sizes, context("sizes")),
    colorPalette: normalizeArray(
      row.color_palette,
      context("color_palette"),
      (item): item is string => typeof item === "string",
    ),
    galleryImages: normalizeArray(
      row.gallery_images,
      context("gallery_images"),
      (item): item is string => typeof item === "string",
    ),
    images: normalizeArray(
      row.images,
      context("images"),
      isImageDraft,
    ),
    seoKeywords: normalizeArray(
      row.seo_keywords,
      context("seo_keywords"),
      (item): item is string => typeof item === "string",
    ),
    seoFaq: normalizeArray(
      row.seo_faq,
      context("seo_faq"),
      isSeoFaqItem,
    ),
    schemaProductJsonLd: normalizeObject(
      row.schema_product_json_ld,
      context("schema_product_json_ld"),
    ),
  };
}

export function getCatalogProductJsonbValues(
  product: StoredCatalogProduct,
): CatalogProductJsonbValues {
  return {
    tags: product.tags,
    sizes: product.sizes,
    colorPalette: product.colorPalette,
    galleryImages: product.galleryImages,
    images: product.images,
    seoKeywords: product.seoKeywords,
    seoFaq: product.seoFaq,
    schemaProductJsonLd: product.schemaProductJsonLd,
  };
}
