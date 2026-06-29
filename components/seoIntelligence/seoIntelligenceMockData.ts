// ==================================================
// SECTION: SEO INTELLIGENCE
// РАЗДЕЛ: Mock data (no DB)
// ==================================================
import type {
  SeoFutureIntegration,
  SeoHistoryEntry,
  SeoLocalFoundation,
  SeoStructuredDataType,
} from "@/components/seoIntelligence/seoIntelligenceTypes";

export const SEO_LOCAL_FOUNDATION_DEFAULT: SeoLocalFoundation = {
  city: "Москва",
  district: "ЦАО",
  metro: "Тверская",
  okrug: "Центральный",
  deliveryZone: "МКАД + 5 км",
  phrase: "доставка цветов Москва",
};

export const SEO_HISTORY_MOCK: SeoHistoryEntry = {
  lastChange: "Обновлены SEO Title и Meta Description",
  date: "25 июня 2026, 14:20",
  author: "Borziy13",
  version: "seo-v1.0-foundation",
};

export const SEO_STRUCTURED_DATA_TYPES: SeoStructuredDataType[] = [
  { id: "product", label: "Product", status: "ready" },
  { id: "offer", label: "Offer", status: "ready" },
  { id: "breadcrumb", label: "Breadcrumb", status: "ready" },
  { id: "organization", label: "Organization", status: "planned" },
  { id: "localbusiness", label: "LocalBusiness", status: "planned" },
  { id: "review", label: "Review", status: "planned" },
  { id: "faq", label: "FAQ", status: "planned" },
  { id: "article", label: "Article", status: "planned" },
];

export const SEO_FUTURE_INTEGRATIONS: SeoFutureIntegration[] = [
  { id: "ai-seo", label: "AI SEO" },
  { id: "image-seo", label: "Image SEO" },
  { id: "sitemap", label: "Sitemap" },
  { id: "robots", label: "Robots" },
  { id: "indexnow", label: "IndexNow" },
  { id: "google-merchant", label: "Google Merchant" },
  { id: "yandex-webmaster", label: "Яндекс Вебмастер" },
  { id: "google-search-console", label: "Google Search Console" },
  { id: "bing-webmaster", label: "Bing Webmaster" },
  { id: "rich-results", label: "Rich Results" },
  { id: "image-optimizer", label: "Image Optimizer" },
];

export const SEO_AI_RECOMMENDATION_TEMPLATES = [
  "Сделайте title короче",
  "Добавьте район Москвы",
  "Добавьте количество цветов",
  "Добавьте повод",
  "Добавьте сезонность",
  "Добавьте ALT",
  "Добавьте keyword",
  "Добавьте local phrase",
];
