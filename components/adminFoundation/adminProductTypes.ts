// ==================================================
// SECTION: ADMIN FOUNDATION
// РАЗДЕЛ: Типы Product Manager
// ==================================================

export type AdminProductSize = "S" | "M" | "L" | "XL";
export type AdminProductStatus = "draft" | "published" | "hidden";

export type AdminProductFlags = {
  bestseller: boolean;
  isNew: boolean;
  recommended: boolean;
};

export type AdminProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice: number | null;
  description: string;
  size: AdminProductSize;
  status: AdminProductStatus;
  photoLabel: string;
  mainPhotoId: string | null;
  photoIds: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoSlug: string;
  imageAltText: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  flags: AdminProductFlags;
  createdAt: string;
  updatedAt: string;
};
