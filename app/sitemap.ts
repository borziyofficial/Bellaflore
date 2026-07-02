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

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...seoLandingPages.map((page) => ({
      url: absoluteUrl(`/${page.slug}`),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
