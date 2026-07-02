// ==================================================
// SECTION: Admin Catalog Manager — types
// РАЗДЕЛ: Типы менеджера каталога
// ==================================================
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";

export type AdminProductStatusFilter = "all" | "published" | "draft" | "archived";

export type AdminProductFormStatus = "draft" | "published";

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
  sizePrices: Record<CatalogProductSizeId, string>;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  mainImageUrl: string;
  mainImageAlt: string;
  mainImageTemporary: boolean;
  galleryUrls: string[];
  seoTitle: string;
  seoDescription: string;
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
  seoTitle: string;
  seoDescription: string;
  imageAlt: string;
};

export type MockAiSuggestionField =
  | "title"
  | "categoryId"
  | "shortDescription"
  | "fullDescription"
  | "composition"
  | "tags"
  | "sizePrices"
  | "seoTitle"
  | "seoDescription"
  | "imageAlt";

export type AdminCatalogView = "list" | "create" | "edit";
