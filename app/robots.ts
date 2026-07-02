// ==================================================
// SECTION: Robots.txt Generator
// РАЗДЕЛ: Генератор robots.txt
//
// Purpose (EN): Next.js robots route — crawl rules for public pages and sitemap reference.
//
// Назначение (RU): Маршрут robots Next.js — правила индексации публичных страниц и ссылка на sitemap.
// ==================================================

import type { MetadataRoute } from "next";

import { absoluteUrl } from "./seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/login",
        "/admin/orders",
        "/admin/crm",
        "/orders",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
