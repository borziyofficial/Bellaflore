// ==================================================
// SECTION: ADMIN APP — Bouquet types (Stage 2.4)
// ==================================================

export type BouquetStatus =
  | "active"
  | "hidden"
  | "out_of_stock"
  | "coming_soon"
  | "draft";

export type BouquetBadge = "none" | "new" | "hit" | "premium" | "sale" | "limited";

export type BouquetDisplayFlags = {
  showOnHomepage: boolean;
  showInCatalog: boolean;
  isNew: boolean;
  isBestseller: boolean;
  isRecommended: boolean;
  isPremium: boolean;
  isSeasonal: boolean;
};

export type BouquetImageVariants = {
  original?: string;
  optimized?: string;
  aiProcessed?: string;
  backgroundReplaced?: string;
};

export type BouquetImage = {
  id: string;
  /** Primary display URL — optimized when available. */
  url: string;
  name: string;
  isCover: boolean;
  sortOrder: number;
  createdAt: string;
  variants?: BouquetImageVariants;
  width?: number;
  height?: number;
  sizeBytes?: number;
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
  displayFlags: BouquetDisplayFlags;
  displayPriority: number;
  badge: BouquetBadge;
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
  displayFlags: BouquetDisplayFlags;
  displayPriority: number;
  badge: BouquetBadge;
  images: BouquetImage[];
  sizes: BouquetSizes;
};

export const BOUQUET_STATUS_VALUES: BouquetStatus[] = [
  "active",
  "hidden",
  "out_of_stock",
  "coming_soon",
  "draft",
];

export const BOUQUET_STATUS_OPTIONS: Array<{
  value: BouquetStatus;
  label: string;
}> = [
  { value: "active", label: "Активен" },
  { value: "hidden", label: "Скрыт" },
  { value: "out_of_stock", label: "Нет в наличии" },
  { value: "coming_soon", label: "Скоро" },
  { value: "draft", label: "Черновик" },
];

export const BOUQUET_STATUS_LABELS: Record<BouquetStatus, string> = {
  active: "Активен",
  hidden: "Скрыт",
  out_of_stock: "Нет в наличии",
  coming_soon: "Скоро",
  draft: "Черновик",
};

export const BOUQUET_BADGE_VALUES: BouquetBadge[] = [
  "none",
  "new",
  "hit",
  "premium",
  "sale",
  "limited",
];

export const BOUQUET_BADGE_OPTIONS: Array<{
  value: BouquetBadge;
  label: string;
}> = [
  { value: "none", label: "Нет" },
  { value: "new", label: "Новинка" },
  { value: "hit", label: "Хит" },
  { value: "premium", label: "Премиум" },
  { value: "sale", label: "Скидка" },
  { value: "limited", label: "Лимит" },
];

export const BOUQUET_BADGE_LABELS: Record<BouquetBadge, string> = {
  none: "",
  new: "Новинка",
  hit: "Хит",
  premium: "Премиум",
  sale: "Скидка",
  limited: "Лимит",
};

export const BOUQUET_DISPLAY_FLAG_OPTIONS: Array<{
  key: keyof BouquetDisplayFlags;
  label: string;
}> = [
  { key: "showOnHomepage", label: "На главной" },
  { key: "showInCatalog", label: "В каталоге" },
  { key: "isNew", label: "Новинка" },
  { key: "isBestseller", label: "Хит продаж" },
  { key: "isRecommended", label: "Рекомендуем" },
  { key: "isPremium", label: "Премиум" },
  { key: "isSeasonal", label: "Сезонный" },
];

export const BOUQUET_NO_PHOTO_LABEL = "Фото не добавлено";

export const BOUQUET_SIZE_CODES: BouquetSizeCode[] = ["S", "M", "L", "XL"];

export const BOUQUET_SIZE_PRICE_LABELS: Record<BouquetSizeCode, string> = {
  S: "Цена S",
  M: "Цена M",
  L: "Цена L",
  XL: "Цена XL",
};

export const BOUQUET_MAX_IMAGE_BYTES = 20 * 1024 * 1024;

export const BOUQUET_MAX_IMAGES_PER_UPLOAD = 20;

export const BOUQUET_ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;
