// ==================================================
// SECTION: Admin Catalog Manager — record utilities
// РАЗДЕЛ: Утилиты записей каталога
// ==================================================
import { CATALOG_CATEGORY_BY_ID } from "@/components/catalogEngine/categoriesCatalog";
import { CATALOG_ENGINE_VERSION } from "@/components/catalogEngine/catalogBootstrap";
import type {
  CatalogProductImage,
  CatalogProductRecord,
  CatalogProductSize,
  CatalogProductSizeId,
  CatalogProductUpsertInput,
} from "@/components/catalogEngine/catalogTypes";
import { buildProductSeoBundle } from "@/components/catalogEngine/seoEngine";
import type { CatalogAdminSeoDraft } from "@/components/catalogEngine/catalogTypes";
import type {
  AdminProductFormState,
  AdminProductFormStatus,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import { isGarbageProductTitle } from "@/components/adminCatalogManager/mockAiHintUtils";
import { repairAdminFormFromTitleIfNeeded } from "@/components/adminCatalogManager/repairAdminFormSeo";
import { slugifyCatalogProductTitle } from "@/lib/catalogProductSlug";

const SIZE_IDS: CatalogProductSizeId[] = ["S", "M", "L", "XL"];

export function slugifyProductTitle(value: string): string {
  if (isGarbageProductTitle(value)) {
    return "";
  }

  return slugifyCatalogProductTitle(value);
}

export function createAdminProductId(): string {
  return `admin-product-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyAdminProductForm(): AdminProductFormState {
  return {
    id: null,
    title: "",
    slug: "",
    categoryId: "roses",
    shortDescription: "",
    fullDescription: "",
    composition: "",
    tags: "",
    status: "draft",
    sizePrices: { S: "", M: "", L: "", XL: "" },
    isFeatured: false,
    isNew: false,
    isBestseller: false,
    mainImageUrl: "",
    mainImageAlt: "",
    mainImageTemporary: false,
    mainImageStorage: "none",
    galleryUrls: [],
    seoTitle: "",
    seoDescription: "",
    seoH1: "",
    seoSlug: "",
    seoKeywords: "",
    seoFaq: [],
    seoImageAlt: "",
    seoGalleryAlt: [],
    openGraphTitle: "",
    openGraphDescription: "",
    schemaProductJsonLd: {},
    seoScore: 0,
    seoRecommendations: [],
    internalLinkSuggestions: [],
  };
}

export function parseTagsInput(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatTagsInput(tags: string[]): string {
  return tags.join(", ");
}

function parseSizePrices(
  form: AdminProductFormState,
): CatalogProductSize[] {
  return SIZE_IDS.flatMap((sizeId) => {
    const raw = form.sizePrices[sizeId].trim();
    if (!raw) {
      return [];
    }

    const priceRub = Number(raw.replace(/\s/g, ""));
    if (!Number.isFinite(priceRub) || priceRub <= 0) {
      return [];
    }

    return [{ sizeId, priceRub, isActive: true }];
  });
}

function buildImages(form: AdminProductFormState): CatalogProductImage[] {
  const images: CatalogProductImage[] = [];

  if (form.mainImageUrl) {
    images.push({
      id: `${form.id ?? "new"}-main`,
      url: form.mainImageUrl,
      alt: form.seoImageAlt || form.mainImageAlt || form.title || "Букет Bellaflore",
      width: 1080,
      height: 1350,
      sortOrder: 0,
      isPrimary: true,
    });
  }

  form.galleryUrls.forEach((url, index) => {
    if (!url.trim()) {
      return;
    }

    images.push({
      id: `${form.id ?? "new"}-gallery-${index}`,
      url: url.trim(),
      alt: form.seoImageAlt || form.mainImageAlt || form.title || "Букет Bellaflore",
      width: 1080,
      height: 1350,
      sortOrder: index + 1,
      isPrimary: false,
    });
  });

  return images;
}

function buildSearchIndexText(product: CatalogProductRecord): string {
  return [
    product.title,
    product.shortDescription,
    product.fullDescription,
    product.metadata.composition ?? "",
    product.tags.join(" "),
    product.searchTerms.join(" "),
    product.categoryIds
      .map((id) => CATALOG_CATEGORY_BY_ID[id]?.title ?? "")
      .join(" "),
  ]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function adminFormToCatalogUpsertInput(
  form: AdminProductFormState,
  existing?: CatalogProductRecord | null,
): CatalogProductUpsertInput {
  const normalizedForm = repairAdminFormFromTitleIfNeeded(form);
  const now = new Date().toISOString();
  const id = normalizedForm.id ?? createAdminProductId();
  const slug =
    normalizedForm.seoSlug.trim() ||
    normalizedForm.slug.trim() ||
    slugifyProductTitle(normalizedForm.title);
  const sizes = parseSizePrices(normalizedForm);
  const basePriceRub = sizes.length
    ? Math.min(...sizes.map((size) => size.priceRub))
    : 0;
  const images = buildImages(normalizedForm);
  const primaryImageUrl = images[0]?.url ?? "";
  const tags = parseTagsInput(normalizedForm.tags);
  const category = CATALOG_CATEGORY_BY_ID[normalizedForm.categoryId];
  const isPublished = normalizedForm.status === "published";
  const seoBundle = buildProductSeoBundle({
    title: normalizedForm.title.trim(),
    shortDescription: normalizedForm.shortDescription.trim(),
    fullDescription: normalizedForm.fullDescription.trim(),
    slug,
    primaryImageUrl,
    basePriceRub,
  });

  const adminSeoDraft: CatalogAdminSeoDraft = {
    seoH1: normalizedForm.seoH1.trim(),
    seoSlug: normalizedForm.seoSlug.trim() || slug,
    seoKeywords: parseTagsInput(normalizedForm.seoKeywords),
    seoFaq: normalizedForm.seoFaq,
    seoGalleryAlt: normalizedForm.seoGalleryAlt,
    openGraphTitle:
      normalizedForm.openGraphTitle.trim() || normalizedForm.seoTitle.trim(),
    openGraphDescription:
      normalizedForm.openGraphDescription.trim() ||
      normalizedForm.seoDescription.trim(),
    schemaProductJsonLd: normalizedForm.schemaProductJsonLd,
    seoScore: normalizedForm.seoScore,
    seoRecommendations: normalizedForm.seoRecommendations,
    internalLinkSuggestions: normalizedForm.internalLinkSuggestions,
  };

  return {
    id,
    slug,
    title: normalizedForm.title.trim(),
    shortDescription: normalizedForm.shortDescription.trim(),
    fullDescription: normalizedForm.fullDescription.trim(),
    categoryIds: normalizedForm.categoryId ? [normalizedForm.categoryId] : [],
    tags,
    colors: [],
    flowerTypes: category ? [category.title.toLowerCase()] : [],
    occasions: [],
    seasons: ["all-season"],
    sizes,
    images,
    basePriceRub,
    availability: "in_stock",
    status: isPublished ? "ACTIVE" : "DRAFT",
    isPublished,
    isFeatured: normalizedForm.isFeatured,
    isNew: normalizedForm.isNew,
    popularityScore: normalizedForm.isBestseller
      ? 95
      : normalizedForm.isFeatured
        ? 85
        : 60,
    seasonalScore: 50,
    addOnIds: existing?.addOnIds ?? [],
    recommendations: existing?.recommendations ?? {
      similarProductIds: [],
      premiumAlternativeIds: [],
      budgetAlternativeIds: [],
      frequentlyBoughtTogetherIds: [],
    },
    seo: {
      ...seoBundle,
      title: normalizedForm.seoTitle.trim() || seoBundle.title,
      description:
        normalizedForm.seoDescription.trim() || seoBundle.description,
      slug,
      canonicalPath: `/catalog/${slug}`,
      schemaJsonLd:
        Object.keys(normalizedForm.schemaProductJsonLd).length > 0
          ? normalizedForm.schemaProductJsonLd
          : seoBundle.schemaJsonLd,
      openGraph: {
        ...seoBundle.openGraph,
        title:
          normalizedForm.openGraphTitle.trim() ||
          normalizedForm.seoTitle.trim() ||
          seoBundle.openGraph.title,
        description:
          normalizedForm.openGraphDescription.trim() ||
          normalizedForm.seoDescription.trim() ||
          seoBundle.openGraph.description,
        imageUrl: primaryImageUrl,
      },
    },
    searchTerms: [...tags, ...parseTagsInput(normalizedForm.seoKeywords)],
    metadata: {
      catalogVersion: CATALOG_ENGINE_VERSION,
      createdAt: existing?.metadata.createdAt ?? now,
      updatedAt: now,
      legacyCategory: category?.title,
      composition: normalizedForm.composition.trim(),
      isBestseller: normalizedForm.isBestseller,
      adminCreated: existing?.metadata.adminCreated ?? !existing,
      adminSeoDraft,
    },
  };
}

export function catalogRecordToAdminForm(
  product: CatalogProductRecord,
): AdminProductFormState {
  const primaryImage =
    product.images.find((image) => image.isPrimary) ?? product.images[0];
  const galleryUrls = product.images
    .filter((image) => !image.isPrimary)
    .map((image) => image.url);
  const sizePrices: Record<CatalogProductSizeId, string> = {
    S: "",
    M: "",
    L: "",
    XL: "",
  };

  product.sizes.forEach((size) => {
    sizePrices[size.sizeId] = String(size.priceRub);
  });

  const status: AdminProductFormStatus = product.isPublished
    ? "published"
    : "draft";

  const adminSeo = product.metadata.adminSeoDraft;

  return {
    id: product.id,
    title: product.title,
    slug: product.slug,
    categoryId: product.categoryIds[0] ?? "roses",
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    composition: product.metadata.composition ?? "",
    tags: formatTagsInput(product.tags),
    status: product.status === "ARCHIVED" ? "draft" : status,
    sizePrices,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isBestseller: product.metadata.isBestseller ?? product.popularityScore >= 90,
    mainImageUrl: primaryImage?.url ?? "",
    mainImageAlt: primaryImage?.alt ?? product.title,
    mainImageTemporary: false,
    mainImageStorage: primaryImage?.url.includes("blob.vercel-storage.com")
      ? "blob"
      : primaryImage?.url.startsWith("/uploads/")
        ? "server"
        : primaryImage?.url
          ? "server"
          : "none",
    galleryUrls,
    seoTitle: product.seo.title,
    seoDescription: product.seo.description,
    seoH1: adminSeo?.seoH1 ?? product.title,
    seoSlug: adminSeo?.seoSlug ?? product.slug,
    seoKeywords: formatTagsInput(adminSeo?.seoKeywords ?? product.searchTerms),
    seoFaq: adminSeo?.seoFaq ?? [],
    seoImageAlt: primaryImage?.alt ?? product.title,
    seoGalleryAlt: adminSeo?.seoGalleryAlt ?? [],
    openGraphTitle: adminSeo?.openGraphTitle ?? product.seo.openGraph.title,
    openGraphDescription:
      adminSeo?.openGraphDescription ?? product.seo.openGraph.description,
    schemaProductJsonLd:
      adminSeo?.schemaProductJsonLd ?? product.seo.schemaJsonLd,
    seoScore: adminSeo?.seoScore ?? 0,
    seoRecommendations: adminSeo?.seoRecommendations ?? [],
    internalLinkSuggestions: adminSeo?.internalLinkSuggestions ?? [],
  };
}

export function finalizeCatalogRecord(
  input: CatalogProductUpsertInput,
): CatalogProductRecord {
  const record: CatalogProductRecord = {
    ...input,
    searchIndexText: "",
    metadata: {
      catalogVersion: CATALOG_ENGINE_VERSION,
      createdAt: input.metadata?.createdAt ?? new Date().toISOString(),
      updatedAt: input.metadata?.updatedAt ?? new Date().toISOString(),
      legacyCategory: input.metadata?.legacyCategory,
      stemCount: input.metadata?.stemCount,
      composition: input.metadata?.composition,
      isBestseller: input.metadata?.isBestseller,
      adminCreated: input.metadata?.adminCreated,
      adminSeoDraft: input.metadata?.adminSeoDraft,
    },
  };

  return {
    ...record,
    searchIndexText: buildSearchIndexText(record),
  };
}

export function getAdminProductStatusLabel(
  product: CatalogProductRecord,
): string {
  if (product.status === "ARCHIVED") {
    return "Архив";
  }

  return product.isPublished ? "Опубликован" : "Черновик";
}

export function canDeleteAdminProduct(product: CatalogProductRecord): boolean {
  return (
    product.metadata.adminCreated === true ||
    product.id.startsWith("admin-product-")
  );
}
