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

export type BouquetSizeCode = "S" | "M" | "L" | "XL";

export type BouquetSizeEntry = {
  enabled: boolean;
  price: number;
};

export type BouquetSizes = Record<BouquetSizeCode, BouquetSizeEntry>;

/** @deprecated Legacy placeholder — normalized on read. */
export type BouquetSizesPlaceholder = {
  enabled?: boolean;
  items?: Array<{
    code: BouquetSizeCode;
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
  sizes: BouquetSizes;
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
  sizes: BouquetSizes;
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

export const BOUQUET_SIZE_CODES: BouquetSizeCode[] = ["S", "M", "L", "XL"];

export const BOUQUET_SIZE_PRICE_LABELS: Record<BouquetSizeCode, string> = {
  S: "Цена S",
  M: "Цена M",
  L: "Цена L",
  XL: "Цена XL",
};

export const BOUQUET_ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;
