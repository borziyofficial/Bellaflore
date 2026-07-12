// ==================================================
// SECTION: Admin Catalog Manager — types
// РАЗДЕЛ: Типы менеджера каталога
// ==================================================
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";
import type {
  AdminSeoFaqItem,
  MockSeoSuggestion,
} from "@/components/adminCatalogManager/adminSeoTypes";

export type AdminProductStatusFilter = "all" | "published" | "draft" | "archived";

export type AdminProductFormStatus = "draft" | "published";

export type AdminImageProcessingStatus =
  | "original"
  | "pending"
  | "processing"
  | "processed"
  | "failed";

export type AdminProductImageDraft = {
  id: string;
  originalUrl: string;
  processedUrl: string;
  thumbnailUrl: string;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
  sortOrder: number;
  isPrimary: boolean;
  processingStatus: AdminImageProcessingStatus;
  processingError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminProductFormState = {
  id: string | null;
  title: string;
  slug: string;
  categoryId: string;
  shortDescription: string;
  fullDescription: string;
  composition: string;
  tags: string;
  status: AdminProductFormStatus;
  availability: "in_stock" | "out_of_stock" | "coming_soon" | "made_to_order";
  sizePrices: Record<CatalogProductSizeId, string>;
  oldPriceRub: string;
  flowerCount: string;
  heightCm: string;
  widthCm: string;
  colorPalette: string;
  occasion: string;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  isPromotion: boolean;
  images: AdminProductImageDraft[];
  mainImageUrl: string;
  mainImageAlt: string;
  mainImageTemporary: boolean;
  mainImageStorage: "none" | "server" | "blob";
  galleryUrls: string[];
  seoTitle: string;
  seoDescription: string;
  seoH1: string;
  seoSlug: string;
  seoKeywords: string;
  seoFaq: AdminSeoFaqItem[];
  seoImageAlt: string;
  seoGalleryAlt: string[];
  openGraphTitle: string;
  openGraphDescription: string;
  schemaProductJsonLd: Record<string, unknown>;
  seoScore: number;
  seoRecommendations: string[];
  internalLinkSuggestions: string[];
};

export type AdminProductFormErrors = Partial<
  Record<keyof AdminProductFormState | "sizePrices", string>
>;

export type MockAiSuggestion = {
  title: string;
  categoryId: string;
  shortDescription: string;
  fullDescription: string;
  composition: string;
  tags: string[];
  sizePrices: Record<CatalogProductSizeId, number>;
  imageAlt: string;
  suggestFeatured?: boolean;
  suggestNew?: boolean;
  suggestBestseller?: boolean;
};

export type MockAiSuggestionField =
  | "title"
  | "categoryId"
  | "shortDescription"
  | "fullDescription"
  | "composition"
  | "tags"
  | "sizePrices"
  | "imageAlt";

export type MockAiBundle = {
  product: MockAiSuggestion;
  seo: MockSeoSuggestion;
};

export type AdminCatalogView = "list" | "create-fast" | "create" | "edit";
