// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Product Experience — типы
//
// Purpose (EN): Admin-ready product page types (sizes, gallery, add-ons).
//
// Назначение (RU): Типы страницы товара для будущей админки.
// ==================================================
export type ProductSizeId = "S" | "M" | "L" | "XL";

export type ProductGalleryImage = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type ProductSizeSpec = {
  label: string;
  value: string;
};

export type ProductSizeVariant = {
  sizeId: ProductSizeId;
  label: ProductSizeId;
  priceRub: number;
  description: string;
  stemCount?: number;
  flowerCount?: number;
  specs: ProductSizeSpec[];
};

export type ProductReviewEntry = {
  id: string;
  author: string;
  rating: number;
  text: string;
  dateLabel: string;
};

export type ProductExperienceData = {
  productId: string;
  description: string;
  galleryImages: ProductGalleryImage[];
  sizeVariants: ProductSizeVariant[];
  defaultSizeId: ProductSizeId;
  hasMultipleSizes?: boolean;
  composition: string;
  deliveryNote: string;
  careNote: string;
  whatsIncluded: string;
  availability?: string;
  badge?: string;
  isPopular?: boolean;
  isNew?: boolean;
  freshnessGuarantee: string;
  reviews: ProductReviewEntry[];
};

export type ProductAddOnItem = {
  id: string;
  title: string;
  description: string;
  priceRub: number;
  emoji: string;
  isActive: boolean;
  sortOrder: number;
};

export type CatalogProductBase = {
  id: string;
  src: string;
  alt: string;
  title: string;
  description: string;
  priceRub: number;
  width: number;
  height: number;
  category?: string;
  stemCount?: number;
};
