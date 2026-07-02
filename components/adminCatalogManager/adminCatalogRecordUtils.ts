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
import type {
  AdminProductFormState,
  AdminProductFormStatus,
} from "@/components/adminCatalogManager/adminCatalogTypes";

const SIZE_IDS: CatalogProductSizeId[] = ["S", "M", "L", "XL"];

export function slugifyProductTitle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/(^-|-$)/g, "");
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
    galleryUrls: [],
    seoTitle: "",
    seoDescription: "",
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
      alt: form.mainImageAlt || form.title || "Букет Bellaflore",
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
      alt: form.mainImageAlt || form.title || "Букет Bellaflore",
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
  const now = new Date().toISOString();
  const id = form.id ?? createAdminProductId();
  const slug = form.slug.trim() || slugifyProductTitle(form.title);
  const sizes = parseSizePrices(form);
  const basePriceRub = sizes.length
    ? Math.min(...sizes.map((size) => size.priceRub))
    : 0;
  const images = buildImages(form);
  const primaryImageUrl = images[0]?.url ?? "";
  const tags = parseTagsInput(form.tags);
  const category = CATALOG_CATEGORY_BY_ID[form.categoryId];
  const isPublished = form.status === "published";
  const seoBundle = buildProductSeoBundle({
    title: form.title.trim(),
    shortDescription: form.shortDescription.trim(),
    fullDescription: form.fullDescription.trim(),
    slug,
    primaryImageUrl,
    basePriceRub,
  });

  return {
    id,
    slug,
    title: form.title.trim(),
    shortDescription: form.shortDescription.trim(),
    fullDescription: form.fullDescription.trim(),
    categoryIds: form.categoryId ? [form.categoryId] : [],
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
    isFeatured: form.isFeatured,
    isNew: form.isNew,
    popularityScore: form.isBestseller ? 95 : form.isFeatured ? 85 : 60,
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
      title: form.seoTitle.trim() || seoBundle.title,
      description: form.seoDescription.trim() || seoBundle.description,
      openGraph: {
        ...seoBundle.openGraph,
        title: form.seoTitle.trim() || seoBundle.openGraph.title,
        description: form.seoDescription.trim() || seoBundle.openGraph.description,
      },
    },
    searchTerms: tags,
    metadata: {
      catalogVersion: CATALOG_ENGINE_VERSION,
      createdAt: existing?.metadata.createdAt ?? now,
      updatedAt: now,
      legacyCategory: category?.title,
      composition: form.composition.trim(),
      isBestseller: form.isBestseller,
      adminCreated: existing?.metadata.adminCreated ?? !existing,
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
    mainImageTemporary: primaryImage?.url.startsWith("blob:") ?? false,
    galleryUrls,
    seoTitle: product.seo.title,
    seoDescription: product.seo.description,
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
