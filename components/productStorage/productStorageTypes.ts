// ==================================================
// SECTION: PRODUCT STORAGE
// РАЗДЕЛ: Core types (local foundation)
// ==================================================
import type { PhotoImageSeo } from "@/components/photoManager/photoManagerTypes";

export type ProductStorageStatus = "draft" | "published" | "hidden" | "archive";

export type StoredProductImage = {
  id: string;
  photoNumber: number;
  fileName: string;
  fileSizeBytes: number;
  fileSizeLabel: string;
  fileFormat: string;
  isMain: boolean;
  seo: PhotoImageSeo;
  uploadedAt: string;
  placeholderLabel?: string;
};

export type StoredProductSeo = {
  title: string;
  metaDescription: string;
  keywords: string;
  h1: string;
  h2: string;
  imageAltText: string;
  canonicalUrl: string;
  openGraphTitle: string;
  openGraphDescription: string;
  structuredDataType: string;
  localSeoPhrase: string;
  searchIntent: string;
};

export type StoredProduct = {
  id: string;
  slug: string;
  sku: string;
  title: string;
  shortDescription: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  comparePrice: number | null;
  status: ProductStorageStatus;
  stock: number;
  images: StoredProductImage[];
  seo: StoredProductSeo;
  flowerCount: number | null;
  size: string;
  composition: string;
  colorPalette: string;
  occasion: string;
  seasonality: string;
  deliveryNote: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductListSort = "updated_desc" | "updated_asc" | "title_asc" | "price_desc";

export type ProductListFilters = {
  searchQuery: string;
  status: ProductStorageStatus | "all";
  category: string;
  sort: ProductListSort;
};

export const PRODUCT_STORAGE_SECTION_ID = "product-storage";

export const PRODUCT_STATUS_LABELS: Record<
  ProductStorageStatus,
  { emoji: string; label: string }
> = {
  draft: { emoji: "🟡", label: "Черновик" },
  published: { emoji: "🟢", label: "Опубликован" },
  hidden: { emoji: "⚪", label: "Скрыт" },
  archive: { emoji: "🔴", label: "Архив" },
};
