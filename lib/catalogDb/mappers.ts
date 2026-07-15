import type {
  AdminProductFormState,
  AdminProductImageDraft,
} from "@/components/adminCatalogManager/adminCatalogTypes";
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

function resolveDeployableImageUrl(url: string): string {
  const normalized = url.trim();
  if (process.env.VERCEL && normalized.startsWith("/uploads/")) {
    return PUBLIC_CATALOG_PLACEHOLDER_IMAGE;
  }
  return normalized;
}

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

function parseOptionalNumber(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, "");
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function createImageDraftFromUrl(
  url: string,
  options: {
    id: string;
    title: string;
    index: number;
    primary: boolean;
    createdAt: string;
    updatedAt: string;
  },
): AdminProductImageDraft | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return null;
  }

  return {
    id: options.id,
    originalUrl: trimmed,
    processedUrl: trimmed,
    thumbnailUrl: trimmed,
    filename:
      trimmed.split("/").pop() || `${options.title || "bellaflore"}-${options.index + 1}`,
    mimeType: "image/*",
    width: 1080,
    height: 1350,
    size: 0,
    sortOrder: options.index,
    isPrimary: options.primary,
    processingStatus: "original",
    processingError: null,
    createdAt: options.createdAt,
    updatedAt: options.updatedAt,
  };
}

function normalizeStoredImages(product: {
  id: string;
  title: string;
  imageUrl: string;
  galleryImages: string[];
  images?: AdminProductImageDraft[];
  createdAt: string;
  updatedAt: string;
}): AdminProductImageDraft[] {
  const sourceImages = Array.isArray(product.images) ? product.images : [];
  const validImages = sourceImages
    .filter((image) => image.originalUrl || image.processedUrl || image.thumbnailUrl)
    .map((image, index) => ({
      ...image,
      originalUrl: image.originalUrl || image.processedUrl || image.thumbnailUrl,
      processedUrl: image.processedUrl || image.originalUrl || image.thumbnailUrl,
      thumbnailUrl: image.thumbnailUrl || image.processedUrl || image.originalUrl,
      sortOrder: Number.isFinite(image.sortOrder) ? image.sortOrder : index,
      isPrimary: Boolean(image.isPrimary),
      processingStatus: image.processingStatus ?? "original",
      processingError: image.processingError ?? null,
      createdAt: image.createdAt || product.createdAt,
      updatedAt: image.updatedAt || product.updatedAt,
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);

  if (validImages.length > 0) {
    const hasPrimary = validImages.some((image) => image.isPrimary);
    return validImages.map((image, index) => ({
      ...image,
      sortOrder: index,
      isPrimary: hasPrimary ? image.isPrimary : index === 0,
    }));
  }

  return [
    createImageDraftFromUrl(product.imageUrl, {
      id: `${product.id}-primary`,
      title: product.title,
      index: 0,
      primary: true,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }),
    ...product.galleryImages.map((url, index) =>
      createImageDraftFromUrl(url, {
        id: `${product.id}-gallery-${index}`,
        title: product.title,
        index: index + 1,
        primary: false,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }),
    ),
  ].filter((image): image is AdminProductImageDraft => Boolean(image));
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
  const id = normalizedForm.id ?? existing?.id ?? createAdminProductId();
  const imageUrl =
    normalizedForm.images.find((image) => image.isPrimary)?.processedUrl.trim() ||
    normalizedForm.mainImageUrl.trim();
  const galleryImages =
    normalizedForm.images.length > 0
      ? normalizedForm.images
          .filter((image) => !image.isPrimary)
          .sort((left, right) => left.sortOrder - right.sortOrder)
          .map((image) => image.processedUrl || image.originalUrl)
          .filter(Boolean)
      : normalizedForm.galleryUrls.filter(Boolean);

  return {
    id,
    slug,
    title: normalizedForm.title.trim(),
    category: normalizedForm.categoryId,
    status,
    shortDescription: normalizedForm.shortDescription.trim(),
    fullDescription: normalizedForm.fullDescription.trim(),
    composition: normalizedForm.composition.trim(),
    tags: parseTags(normalizedForm.tags),
    sizes: parseSizePricesFromForm(normalizedForm),
    oldPriceRub: parseOptionalNumber(normalizedForm.oldPriceRub),
    flowerCount: parseOptionalNumber(normalizedForm.flowerCount),
    heightCm: parseOptionalNumber(normalizedForm.heightCm),
    widthCm: parseOptionalNumber(normalizedForm.widthCm),
    colorPalette: parseTags(normalizedForm.colorPalette),
    occasion: normalizedForm.occasion.trim(),
    imageUrl,
    galleryImages,
    images: normalizeStoredImages({
      id,
      title: normalizedForm.title.trim(),
      imageUrl,
      galleryImages,
      images: normalizedForm.images,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }),
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
    isPromotion: normalizedForm.isPromotion,
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
    oldPriceRub: product.oldPriceRub ? String(product.oldPriceRub) : "",
    flowerCount: product.flowerCount ? String(product.flowerCount) : "",
    heightCm: product.heightCm ? String(product.heightCm) : "",
    widthCm: product.widthCm ? String(product.widthCm) : "",
    colorPalette: product.colorPalette.join(", "),
    occasion: product.occasion,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isBestseller: product.isBestseller,
    isPromotion: product.isPromotion,
    images: normalizeStoredImages(product),
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
  customCategoryTitleById: Record<string, string> = {},
): CatalogProductRecord {
  const category = CATALOG_CATEGORY_BY_ID[product.category];
  const customCategoryTitle = customCategoryTitleById[product.category];
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
  const storedImages = normalizeStoredImages(product);
  const primaryImage = storedImages.find((image) => image.isPrimary) ?? storedImages[0];
  const imageUrl =
    primaryImage?.processedUrl ||
    primaryImage?.originalUrl ||
    product.imageUrl.trim() ||
    PUBLIC_CATALOG_PLACEHOLDER_IMAGE;
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
    flowerTypes: category
      ? [category.title.toLowerCase()]
      : customCategoryTitle
        ? [customCategoryTitle.toLowerCase()]
        : [],
    occasions: [],
    seasons: ["all-season"],
    sizes,
    images: storedImages.length
      ? storedImages.map((image, index) => ({
          id: image.id,
          url: image.processedUrl || image.originalUrl,
          alt:
            index === 0
              ? product.seoImageAlt || product.title
              : `${product.title} — фото ${index + 1}`,
          isPrimary: image.isPrimary,
          width: image.width || 1080,
          height: image.height || 1350,
          sortOrder: index,
        }))
      : [
          {
            id: `${product.id}-primary`,
            url: imageUrl,
            alt: product.seoImageAlt || product.title,
            isPrimary: true,
            width: 1080,
            height: 1350,
            sortOrder: 0,
          },
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
      oldPriceRub: product.oldPriceRub ?? undefined,
      flowerCount: product.flowerCount ?? undefined,
      heightCm: product.heightCm ?? undefined,
      widthCm: product.widthCm ?? undefined,
      colorPalette: product.colorPalette,
      occasion: product.occasion,
      isPromotion: product.isPromotion,
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
  customCategoryTitleById: Record<string, string> = {},
): CatalogProduct {
  const record = storedProductToCatalogRecord(product, customCategoryTitleById);
  const category = CATALOG_CATEGORY_BY_ID[product.category];
  const customCategoryTitle = customCategoryTitleById[product.category];
  const categoryTitle = category?.title ?? customCategoryTitle ?? "Авторские букеты";
  const primaryImage = record.images.find((image) => image.isPrimary) ?? record.images[0];
  const imageUrl =
    resolveDeployableImageUrl(primaryImage?.url || product.imageUrl) ||
    PUBLIC_CATALOG_PLACEHOLDER_IMAGE;
  const sizes = (["S", "M", "L", "XL"] as const).flatMap((sizeId) => {
    const price = product.sizes[sizeId];
    return price ? [{ label: sizeId, price }] : [];
  });

  return {
    id: product.id,
    title: product.title,
    description: product.shortDescription,
    category: categoryTitle,
    flowerType: categoryTitle.toLowerCase(),
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
    galleryImages: record.images
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((image) => ({
        id: image.id,
        src: resolveDeployableImageUrl(image.url),
        alt: image.alt,
        width: image.width,
        height: image.height,
      })),
  };
}
