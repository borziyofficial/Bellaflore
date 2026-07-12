import type { AdminSeoFaqItem } from "@/components/adminCatalogManager/adminSeoTypes";
import type { AdminProductImageDraft } from "@/components/adminCatalogManager/adminCatalogTypes";

export type CatalogProductDbStatus = "draft" | "published" | "archived";

export type CatalogProductSizePrices = Partial<
  Record<"S" | "M" | "L" | "XL", number>
>;

export type StoredCatalogProduct = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: CatalogProductDbStatus;
  shortDescription: string;
  fullDescription: string;
  composition: string;
  tags: string[];
  sizes: CatalogProductSizePrices;
  oldPriceRub: number | null;
  flowerCount: number | null;
  heightCm: number | null;
  widthCm: number | null;
  colorPalette: string[];
  occasion: string;
  imageUrl: string;
  galleryImages: string[];
  images: AdminProductImageDraft[];
  seoTitle: string;
  seoDescription: string;
  seoH1: string;
  seoSlug: string;
  seoImageAlt: string;
  seoKeywords: string[];
  seoFaq: AdminSeoFaqItem[];
  openGraphTitle: string;
  openGraphDescription: string;
  schemaProductJsonLd: Record<string, unknown>;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  isPromotion: boolean;
  createdAt: string;
  updatedAt: string;
};

export class CatalogDatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "База данных каталога не настроена. Укажите DATABASE_URL (Vercel Postgres / Neon / Supabase).",
    );
    this.name = "CatalogDatabaseNotConfiguredError";
  }
}
