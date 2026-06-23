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
