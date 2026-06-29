// ==================================================
// SECTION: PRODUCT EDITOR
// РАЗДЕЛ: Foundation types (read-only mock)
// ==================================================

export type ProductEditorSize = "S" | "M" | "L" | "XL";
export type ProductEditorStatus = "draft" | "active" | "hidden";
export type ProductEditorOccasion =
  | "birthday"
  | "love"
  | "wedding"
  | "premium"
  | "none";
export type ProductEditorSearchIntent = "buy" | "gift" | "delivery" | "premium";
export type ProductEditorStructuredDataType = "Product" | "Offer" | "Breadcrumb";

export type ProductEditorDraft = {
  name: string;
  slug: string;
  category: string;
  priceRub: number | null;
  oldPriceRub: number | null;
  flowerCount: number | null;
  size: ProductEditorSize;
  status: ProductEditorStatus;
  shortDescription: string;
  fullDescription: string;
  composition: string;
  colorPalette: string;
  occasion: ProductEditorOccasion;
  seasonality: string;
  deliveryNote: string;
  sku: string;
  seoTitle: string;
  metaDescription: string;
  seoKeywords: string;
  h1: string;
  h2: string;
  imageAltText: string;
  canonicalUrl: string;
  openGraphTitle: string;
  openGraphDescription: string;
  structuredDataType: ProductEditorStructuredDataType;
  localSeoPhrase: string;
  searchIntent: ProductEditorSearchIntent;
};

export type ProductEditorSeoChecklistItem = {
  id: string;
  label: string;
  passed: boolean;
};

export type ProductEditorSeoScore = {
  score: number;
  checklist: ProductEditorSeoChecklistItem[];
};

export const PRODUCT_EDITOR_SECTION_ID = "product-editor";

export const LOCAL_SEO_PHRASE_TARGET = "доставка цветов Москва";
