// ==================================================
// SECTION: PRODUCT STORAGE
// РАЗДЕЛ: Editor/photo bridge + list helpers
// ==================================================
import type { ProductEditorDraft } from "@/components/productEditor/productEditorTypes";
import type { PhotoUploadItem } from "@/components/photoManager/photoManagerTypes";
import type {
  ProductListFilters,
  ProductStorageStatus,
  StoredProduct,
  StoredProductImage,
} from "@/components/productStorage/productStorageTypes";

export function mapStorageStatusToEditorStatus(
  status: ProductStorageStatus,
): ProductEditorDraft["status"] {
  if (status === "published") {
    return "active";
  }

  if (status === "hidden" || status === "archive") {
    return "hidden";
  }

  return "draft";
}

export function mapEditorStatusToStorageStatus(
  status: ProductEditorDraft["status"],
  current: ProductStorageStatus,
): ProductStorageStatus {
  if (current === "archive") {
    return "archive";
  }

  if (status === "active") {
    return "published";
  }

  if (status === "hidden") {
    return "hidden";
  }

  return "draft";
}

export function storedProductToEditorDraft(product: StoredProduct): ProductEditorDraft {
  return {
    name: product.title,
    slug: product.slug,
    category: product.category,
    priceRub: product.price,
    oldPriceRub: product.comparePrice,
    flowerCount: product.flowerCount,
    size: (product.size as ProductEditorDraft["size"]) || "M",
    status: mapStorageStatusToEditorStatus(product.status),
    shortDescription: product.shortDescription,
    fullDescription: product.description,
    composition: product.composition,
    colorPalette: product.colorPalette,
    occasion: (product.occasion as ProductEditorDraft["occasion"]) || "none",
    seasonality: product.seasonality,
    deliveryNote: product.deliveryNote,
    sku: product.sku,
    seoTitle: product.seo.title,
    metaDescription: product.seo.metaDescription,
    seoKeywords: product.seo.keywords,
    h1: product.seo.h1,
    h2: product.seo.h2,
    imageAltText: product.seo.imageAltText,
    canonicalUrl: product.seo.canonicalUrl,
    openGraphTitle: product.seo.openGraphTitle,
    openGraphDescription: product.seo.openGraphDescription,
    structuredDataType:
      (product.seo.structuredDataType as ProductEditorDraft["structuredDataType"]) ||
      "Product",
    localSeoPhrase: product.seo.localSeoPhrase,
    searchIntent: (product.seo.searchIntent as ProductEditorDraft["searchIntent"]) || "buy",
  };
}

export function editorDraftToStoredProduct(
  product: StoredProduct,
  draft: ProductEditorDraft,
): StoredProduct {
  return {
    ...product,
    title: draft.name,
    slug: draft.slug,
    sku: draft.sku,
    shortDescription: draft.shortDescription,
    description: draft.fullDescription,
    category: draft.category,
    price: draft.priceRub ?? 0,
    comparePrice: draft.oldPriceRub,
    status: mapEditorStatusToStorageStatus(draft.status, product.status),
    flowerCount: draft.flowerCount,
    size: draft.size,
    composition: draft.composition,
    colorPalette: draft.colorPalette,
    occasion: draft.occasion,
    seasonality: draft.seasonality,
    deliveryNote: draft.deliveryNote,
    seo: {
      title: draft.seoTitle,
      metaDescription: draft.metaDescription,
      keywords: draft.seoKeywords,
      h1: draft.h1,
      h2: draft.h2,
      imageAltText: draft.imageAltText,
      canonicalUrl: draft.canonicalUrl,
      openGraphTitle: draft.openGraphTitle,
      openGraphDescription: draft.openGraphDescription,
      structuredDataType: draft.structuredDataType,
      localSeoPhrase: draft.localSeoPhrase,
      searchIntent: draft.searchIntent,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function photoUploadToStoredImage(photo: PhotoUploadItem): StoredProductImage {
  return {
    id: photo.id,
    photoNumber: photo.photoNumber,
    fileName: photo.fileName,
    fileSizeBytes: photo.fileSizeBytes,
    fileSizeLabel: photo.fileSizeLabel,
    fileFormat: photo.fileFormat,
    isMain: photo.isMain,
    seo: photo.seo,
    uploadedAt: photo.uploadedAt,
  };
}

export function storedImageToPhotoUpload(image: StoredProductImage): PhotoUploadItem {
  return {
    id: image.id,
    photoNumber: image.photoNumber,
    fileName: image.fileName,
    fileSizeBytes: image.fileSizeBytes,
    fileSizeLabel: image.fileSizeLabel,
    fileFormat: image.fileFormat,
    objectUrl: "",
    isMain: image.isMain,
    seo: image.seo,
    uploadedAt: image.uploadedAt,
    placeholderLabel: image.placeholderLabel,
  };
}

export function duplicateStoredProduct(product: StoredProduct): StoredProduct {
  const now = new Date().toISOString();
  const copyId = `product-${crypto.randomUUID()}`;

  return {
    ...product,
    id: copyId,
    slug: `${product.slug}-copy`,
    sku: `${product.sku}-COPY`,
    title: `${product.title} (копия)`,
    status: "draft",
    images: product.images.map((image) => ({
      ...image,
      id: `photo-${crypto.randomUUID()}`,
    })),
    createdAt: now,
    updatedAt: now,
  };
}

export function createBlankStoredProduct(): StoredProduct {
  const now = new Date().toISOString();
  const id = `product-${crypto.randomUUID()}`;

  return {
    id,
    slug: "novyy-buket",
    sku: `BF-NEW-${Date.now()}`,
    title: "Новый букет",
    shortDescription: "",
    description: "",
    category: "Розы",
    tags: [],
    price: 0,
    comparePrice: null,
    status: "draft",
    stock: 0,
    images: [],
    seo: {
      title: "",
      metaDescription: "",
      keywords: "",
      h1: "",
      h2: "",
      imageAltText: "",
      canonicalUrl: "",
      openGraphTitle: "",
      openGraphDescription: "",
      structuredDataType: "Product",
      localSeoPhrase: "доставка цветов Москва",
      searchIntent: "buy",
    },
    flowerCount: null,
    size: "M",
    composition: "",
    colorPalette: "",
    occasion: "none",
    seasonality: "",
    deliveryNote: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function filterAndSortProducts(
  products: StoredProduct[],
  filters: ProductListFilters,
): StoredProduct[] {
  const query = filters.searchQuery.trim().toLowerCase();

  let result = products.filter((product) => {
    if (filters.status !== "all" && product.status !== filters.status) {
      return false;
    }

    if (filters.category !== "all" && product.category !== filters.category) {
      return false;
    }

    if (!query) {
      return true;
    }

    return (
      product.title.toLowerCase().includes(query) ||
      product.slug.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  result = [...result].sort((left, right) => {
    switch (filters.sort) {
      case "title_asc":
        return left.title.localeCompare(right.title, "ru");
      case "price_desc":
        return right.price - left.price;
      case "updated_asc":
        return left.updatedAt.localeCompare(right.updatedAt);
      case "updated_desc":
      default:
        return right.updatedAt.localeCompare(left.updatedAt);
    }
  });

  return result;
}

export function formatProductUpdatedAt(isoDate: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

export function formatProductPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(price);
}

export function getProductMainImage(product: StoredProduct): StoredProductImage | null {
  return product.images.find((image) => image.isMain) ?? product.images[0] ?? null;
}
