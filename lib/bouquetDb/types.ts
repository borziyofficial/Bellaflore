import type {
  BouquetBadge,
  BouquetDisplayFlags,
  BouquetSeoPlaceholder,
  BouquetSizes,
  BouquetStatus,
} from "@/components/adminApp/modules/bouquets/bouquetTypes";

export type StoredBouquetImage = {
  id: string;
  url: string;
  name: string;
  isCover: boolean;
  order: number;
  originalUrl?: string;
  optimizedUrl?: string;
  aiProcessedUrl?: string;
  backgroundReplacedUrl?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  createdAt: string;
};

export type StoredBouquetRecord = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  basePrice: number;
  status: BouquetStatus;
  displayFlags: BouquetDisplayFlags;
  displayPriority: number;
  badge: BouquetBadge;
  images: StoredBouquetImage[];
  sizes: BouquetSizes;
  seo: BouquetSeoPlaceholder;
  createdAt: string;
  updatedAt: string;
};

export type StoredBouquetCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredBouquetCategoryOverride = {
  name: string;
  slug: string;
  updatedAt: string;
};

export type StoredBouquetCategoryStorage = {
  custom: StoredBouquetCategoryRecord[];
  overrides: Record<string, StoredBouquetCategoryOverride>;
};

export class BouquetDatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Хранилище букетов не настроено. Укажите DATABASE_URL или включите файловый адаптер.",
    );
    this.name = "BouquetDatabaseNotConfiguredError";
  }
}
