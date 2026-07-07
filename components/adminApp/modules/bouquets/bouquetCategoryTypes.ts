// ==================================================
// SECTION: ADMIN APP — Bouquet category types (Stage 2.3.1)
// ==================================================

export type AdminBouquetCategory = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminBouquetCategoryOverride = {
  name: string;
  slug: string;
  updatedAt: string;
};
