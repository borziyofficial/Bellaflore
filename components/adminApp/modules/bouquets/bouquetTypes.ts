// ==================================================
// SECTION: ADMIN APP — Bouquet types (Stage 2.2)
// ==================================================

export type BouquetStatus = "draft" | "active" | "hidden";

export type BouquetImage = {
  id: string;
  url: string;
  name: string;
  isCover: boolean;
  createdAt: string;
};

/** Future: S / M / L / XL pricing matrix. */
export type BouquetSizesPlaceholder = {
  enabled?: boolean;
  items?: Array<{
    code: "S" | "M" | "L" | "XL";
    price?: number;
    label?: string;
  }>;
};

/** Future: SEO fields for public catalog publishing. */
export type BouquetSeoPlaceholder = {
  title?: string;
  description?: string;
  slug?: string;
};

export type BouquetRecord = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  basePrice: number;
  status: BouquetStatus;
  images: BouquetImage[];
  sizes: BouquetSizesPlaceholder;
  seo: BouquetSeoPlaceholder;
  createdAt: string;
  updatedAt: string;
};

export type BouquetDraft = {
  name: string;
  category: string;
  description: string;
  basePrice: number;
  status: BouquetStatus;
  images: BouquetImage[];
};

export const BOUQUET_STATUS_OPTIONS: Array<{
  value: BouquetStatus;
  label: string;
}> = [
  { value: "draft", label: "Черновик" },
  { value: "active", label: "Активен" },
  { value: "hidden", label: "Скрыт" },
];

export const BOUQUET_STATUS_LABELS: Record<BouquetStatus, string> = {
  draft: "Черновик",
  active: "Активен",
  hidden: "Скрыт",
};

export const BOUQUET_NO_PHOTO_LABEL = "Фото не добавлено";

export const BOUQUET_ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;
