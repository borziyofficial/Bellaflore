import type { AdminSeoFaqItem } from "@/components/adminCatalogManager/adminSeoTypes";

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
  imageUrl: string;
  galleryImages: string[];
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
