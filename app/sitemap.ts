// ==================================================
// SECTION: Sitemap Generator
// РАЗДЕЛ: Генератор sitemap
//
// Purpose (EN): Next.js sitemap route — homepage and SEO landing page URLs for search engines.
//
// Назначение (RU): Маршрут sitemap Next.js — URL главной и SEO-лендингов для поисковых систем.
// ==================================================

import type { MetadataRoute } from "next";

import { absoluteUrl, seoLandingPages } from "./seo";
import { listPublishedCatalogProducts } from "@/lib/catalogDb";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let productEntries: MetadataRoute.Sitemap = [];

  try {
    const products = await listPublishedCatalogProducts();
    productEntries = products.map((product) => ({
      url: absoluteUrl(`/catalog/${product.seoSlug || product.slug}`),
      lastModified: new Date(product.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Keep the static sitemap available during builds without a configured DB.
  }

  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...productEntries,
    ...seoLandingPages.map((page) => ({
      url: absoluteUrl(`/${page.slug}`),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
