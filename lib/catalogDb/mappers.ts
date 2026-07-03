import type { AdminProductFormState } from "@/components/adminCatalogManager/adminCatalogTypes";
import {
  createAdminProductId,
  slugifyProductTitle,
} from "@/components/adminCatalogManager/adminCatalogRecordUtils";
import { repairAdminFormFromTitleIfNeeded } from "@/components/adminCatalogManager/repairAdminFormSeo";
import { CATALOG_CATEGORY_BY_ID } from "@/components/catalogEngine/categoriesCatalog";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import type { CatalogProduct } from "@/data/catalogProducts";
import { PUBLIC_CATALOG_PLACEHOLDER_IMAGE } from "@/components/catalog/publicCatalogMerge";
import type {
  CatalogProductDbStatus,
  CatalogProductSizePrices,
  StoredCatalogProduct,
} from "@/lib/catalogDb/types";

function parseSizePricesFromForm(
  form: AdminProductFormState,
): CatalogProductSizePrices {
  const sizes: CatalogProductSizePrices = {};
  (["S", "M", "L", "XL"] as const).forEach((sizeId) => {
    const raw = form.sizePrices[sizeId].trim();
    if (!raw) {
      return;
    }
    const priceRub = Number(raw.replace(/\s/g, ""));
    if (Number.isFinite(priceRub) && priceRub > 0) {
      sizes[sizeId] = priceRub;
    }
  });
  return sizes;
}

function parseTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function adminFormToStoredProduct(
  form: AdminProductFormState,
  existing?: StoredCatalogProduct | null,
): StoredCatalogProduct {
  const normalizedForm = repairAdminFormFromTitleIfNeeded(form);
  const now = new Date().toISOString();
  const slug =
    normalizedForm.seoSlug.trim() ||
    normalizedForm.slug.trim() ||
    slugifyProductTitle(normalizedForm.title);
  const status: CatalogProductDbStatus =
    normalizedForm.status === "published" ? "published" : "draft";

  return {
    id: normalizedForm.id ?? existing?.id ?? createAdminProductId(),
    slug,
    title: normalizedForm.title.trim(),
    category: normalizedForm.categoryId,
    status,
    shortDescription: normalizedForm.shortDescription.trim(),
    fullDescription: normalizedForm.fullDescription.trim(),
    composition: normalizedForm.composition.trim(),
    tags: parseTags(normalizedForm.tags),
    sizes: parseSizePricesFromForm(normalizedForm),
    imageUrl: normalizedForm.mainImageUrl.trim(),
    galleryImages: normalizedForm.galleryUrls.filter(Boolean),
    seoTitle: normalizedForm.seoTitle.trim(),
    seoDescription: normalizedForm.seoDescription.trim(),
    seoH1: normalizedForm.seoH1.trim() || normalizedForm.title.trim(),
    seoSlug: normalizedForm.seoSlug.trim() || slug,
    seoImageAlt:
      normalizedForm.seoImageAlt.trim() || normalizedForm.mainImageAlt.trim(),
    seoKeywords: parseTags(normalizedForm.seoKeywords),
    seoFaq: normalizedForm.seoFaq,
    openGraphTitle:
      normalizedForm.openGraphTitle.trim() || normalizedForm.seoTitle.trim(),
    openGraphDescription:
      normalizedForm.openGraphDescription.trim() ||
      normalizedForm.seoDescription.trim(),
    schemaProductJsonLd: normalizedForm.schemaProductJsonLd,
    isFeatured: normalizedForm.isFeatured,
    isNew: normalizedForm.isNew,
    isBestseller: normalizedForm.isBestseller,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function storedProductToAdminForm(
  product: StoredCatalogProduct,
): AdminProductFormState {
  const sizePrices = {
    S: product.sizes.S ? String(product.sizes.S) : "",
    M: product.sizes.M ? String(product.sizes.M) : "",
    L: product.sizes.L ? String(product.sizes.L) : "",
    XL: product.sizes.XL ? String(product.sizes.XL) : "",
  };

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    categoryId: product.category,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    composition: product.composition,
    tags: product.tags.join(", "),
    status: product.status === "published" ? "published" : "draft",
    availability: "in_stock",
    sizePrices,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isBestseller: product.isBestseller,
    mainImageUrl: product.imageUrl,
    mainImageAlt: product.seoImageAlt || product.title,
    mainImageTemporary: false,
    mainImageStorage: product.imageUrl.includes("blob.vercel-storage.com")
      ? "blob"
      : product.imageUrl
        ? "server"
        : "none",
    galleryUrls: product.galleryImages,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    seoH1: product.seoH1,
    seoSlug: product.seoSlug,
    seoKeywords: product.seoKeywords.join(", "),
    seoFaq: product.seoFaq,
    seoImageAlt: product.seoImageAlt,
    seoGalleryAlt: [],
    openGraphTitle: product.openGraphTitle,
    openGraphDescription: product.openGraphDescription,
    schemaProductJsonLd: product.schemaProductJsonLd,
    seoScore: 0,
    seoRecommendations: [],
    internalLinkSuggestions: [],
  };
}

export function storedProductToCatalogRecord(
  product: StoredCatalogProduct,
): CatalogProductRecord {
  const category = CATALOG_CATEGORY_BY_ID[product.category];
  const sizes = (["S", "M", "L", "XL"] as const).flatMap((sizeId) => {
    const priceRub = product.sizes[sizeId];
    if (!priceRub) {
      return [];
    }
    return [{ sizeId, priceRub, isActive: true }];
  });
  const basePriceRub = sizes.length
    ? Math.min(...sizes.map((size) => size.priceRub))
    : 0;
  const imageUrl = product.imageUrl.trim() || PUBLIC_CATALOG_PLACEHOLDER_IMAGE;
  const isPublished = product.status === "published";

  return {
    id: product.id,
    slug: product.seoSlug || product.slug,
    title: product.title,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    categoryIds: product.category ? [product.category] : [],
    tags: product.tags,
    colors: [],
    flowerTypes: category ? [category.title.toLowerCase()] : [],
    occasions: [],
    seasons: ["all-season"],
    sizes,
    images: [
      {
        id: `${product.id}-primary`,
        url: imageUrl,
        alt: product.seoImageAlt || product.title,
        isPrimary: true,
        width: 1080,
        height: 1350,
        sortOrder: 0,
      },
      ...product.galleryImages.map((url, index) => ({
        id: `${product.id}-gallery-${index}`,
        url,
        alt: `${product.title} — фото ${index + 2}`,
        isPrimary: false,
        width: 1080,
        height: 1350,
        sortOrder: index + 1,
      })),
    ],
    basePriceRub,
    availability: "in_stock",
    status: product.status === "archived" ? "ARCHIVED" : isPublished ? "ACTIVE" : "DRAFT",
    isPublished,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    popularityScore: product.isBestseller ? 95 : product.isFeatured ? 85 : 60,
    seasonalScore: 50,
    addOnIds: [],
    recommendations: {
      similarProductIds: [],
      premiumAlternativeIds: [],
      budgetAlternativeIds: [],
      frequentlyBoughtTogetherIds: [],
    },
    seo: {
      title: product.seoTitle || product.title,
      description: product.seoDescription || product.shortDescription,
      slug: product.seoSlug || product.slug,
      canonicalPath: `/catalog/${product.seoSlug || product.slug}`,
      schemaType: "Product",
      schemaJsonLd: product.schemaProductJsonLd,
      openGraph: {
        title: product.openGraphTitle || product.seoTitle || product.title,
        description:
          product.openGraphDescription ||
          product.seoDescription ||
          product.shortDescription,
        imageUrl,
        type: "product",
        locale: "ru_RU",
      },
    },
    searchTerms: [...product.tags, ...product.seoKeywords],
    searchIndexText: "",
    metadata: {
      catalogVersion: "catalog-db-v1",
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      legacyCategory: category?.title,
      composition: product.composition,
      isBestseller: product.isBestseller,
      adminCreated: true,
      adminSeoDraft: {
        seoH1: product.seoH1,
        seoSlug: product.seoSlug,
        seoKeywords: product.seoKeywords,
        seoFaq: product.seoFaq,
        seoGalleryAlt: [],
        openGraphTitle: product.openGraphTitle,
        openGraphDescription: product.openGraphDescription,
        schemaProductJsonLd: product.schemaProductJsonLd,
        seoScore: 0,
        seoRecommendations: [],
        internalLinkSuggestions: [],
      },
    },
  };
}

export function storedProductToLegacyCatalogProduct(
  product: StoredCatalogProduct,
): CatalogProduct {
  const record = storedProductToCatalogRecord(product);
  const category = CATALOG_CATEGORY_BY_ID[product.category];
  const imageUrl = product.imageUrl.trim() || PUBLIC_CATALOG_PLACEHOLDER_IMAGE;
  const sizes = (["S", "M", "L", "XL"] as const).flatMap((sizeId) => {
    const price = product.sizes[sizeId];
    return price ? [{ label: sizeId, price }] : [];
  });

  return {
    id: product.id,
    title: product.title,
    description: product.shortDescription,
    category: category?.title ?? "Авторские букеты",
    flowerType: category?.title.toLowerCase() ?? "микс",
    tags: product.tags,
    searchTerms: record.searchTerms,
    src: imageUrl,
    alt: product.seoImageAlt || product.title,
    priceRub: sizes[0]?.price ?? 0,
    width: 1080,
    height: 1350,
    sizes: sizes.length > 0 ? sizes : undefined,
    composition: product.composition || product.shortDescription,
    care: "Обрежьте стебли под углом, меняйте воду каждые 2 дня.",
    deliveryHint: "Доставка сегодня по Москве и области",
    availability: "В наличии",
    isPopular: product.isBestseller || product.isFeatured,
    isNew: product.isNew,
    badge: product.isFeatured ? "Хит" : undefined,
    slug: product.seoSlug || product.slug,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    isAdminProduct: true,
  };
}
