// ==================================================
// SECTION: CATALOG ADMIN
// РАЗДЕЛ: Foundation types (read-only mock)
// ==================================================

export type CatalogProductStatus = "active" | "draft" | "hidden";

export type CatalogAdminProduct = {
  id: string;
  name: string;
  category: string;
  priceRub: number;
  status: CatalogProductStatus;
  flowerCount: number;
  shortDescription: string;
  placeholderImageLabel: string;
};

export const CATALOG_ADMIN_SECTION_ID = "catalog-admin";
