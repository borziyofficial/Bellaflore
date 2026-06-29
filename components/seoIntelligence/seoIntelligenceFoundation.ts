// ==================================================
// SECTION: SEO INTELLIGENCE
// РАЗДЕЛ: Local analysis engine (no API)
// ==================================================
import type { ProductEditorDraft } from "@/components/productEditor/productEditorTypes";
import { LOCAL_SEO_PHRASE_TARGET } from "@/components/productEditor/productEditorTypes";
import type {
  SeoChecklistItem,
  SeoHealthLevel,
  SeoIntelligenceAnalysis,
  SeoIntelligenceInput,
  SeoRecommendation,
} from "@/components/seoIntelligence/seoIntelligenceTypes";

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

function isSeoFriendlyFilename(filename: string): boolean {
  return /^[a-z0-9-]+\.(jpg|jpeg|png|webp)$/i.test(filename.trim());
}

function getAvailabilityLabel(status: ProductEditorDraft["status"]): string {
  switch (status) {
    case "active":
      return "InStock";
    case "draft":
      return "PreOrder";
    case "hidden":
      return "OutOfStock";
    default:
      return "Unknown";
  }
}

function hasLocalPhrase(input: SeoIntelligenceInput): boolean {
  const phrase = input.localSeo.phrase.toLowerCase();
  const target = LOCAL_SEO_PHRASE_TARGET.toLowerCase();

  return (
    phrase.includes(target) ||
    input.draft.localSeoPhrase.toLowerCase().includes(target) ||
    input.draft.metaDescription.toLowerCase().includes(target) ||
    input.draft.fullDescription.toLowerCase().includes(target)
  );
}

function buildChecklist(input: SeoIntelligenceInput): SeoChecklistItem[] {
  const { draft, mainPhoto } = input;
  const imageAlt = mainPhoto?.seo.imageAlt || draft.imageAltText;
  const imageFilename = mainPhoto?.seo.seoFilename || "";
  const twitterReady = hasText(mainPhoto?.seo.twitterImage ?? "") || hasText(draft.openGraphTitle);
  const availability = getAvailabilityLabel(draft.status);

  return [
    {
      id: "title",
      label: "Title заполнен",
      passed: hasText(draft.seoTitle),
      severity: "critical",
    },
    {
      id: "meta",
      label: "Meta Description заполнен",
      passed: hasText(draft.metaDescription),
      severity: "critical",
    },
    {
      id: "slug",
      label: "Slug заполнен",
      passed: hasText(draft.slug),
      severity: "critical",
    },
    {
      id: "h1",
      label: "H1 заполнен",
      passed: hasText(draft.h1),
      severity: "critical",
    },
    {
      id: "h2",
      label: "H2 заполнен",
      passed: hasText(draft.h2),
      severity: "warning",
    },
    {
      id: "keywords",
      label: "Keywords есть",
      passed: hasText(draft.seoKeywords),
      severity: "warning",
    },
    {
      id: "alt",
      label: "ALT есть",
      passed: hasText(imageAlt),
      severity: "warning",
    },
    {
      id: "canonical",
      label: "Canonical есть",
      passed: hasText(draft.canonicalUrl),
      severity: "warning",
    },
    {
      id: "og",
      label: "OpenGraph есть",
      passed: hasText(draft.openGraphTitle) && hasText(draft.openGraphDescription),
      severity: "warning",
    },
    {
      id: "twitter",
      label: "Twitter Card есть",
      passed: twitterReady,
      severity: "info",
    },
    {
      id: "jsonld",
      label: "JSON-LD готов",
      passed: hasText(draft.structuredDataType),
      severity: "warning",
    },
    {
      id: "local",
      label: "Local SEO phrase есть",
      passed: hasLocalPhrase(input),
      severity: "warning",
    },
    {
      id: "image-filename",
      label: "Image filename SEO-friendly",
      passed: imageFilename ? isSeoFriendlyFilename(imageFilename) : false,
      severity: "info",
    },
    {
      id: "category",
      label: "Category указана",
      passed: hasText(draft.category),
      severity: "critical",
    },
    {
      id: "price",
      label: "Price указана",
      passed: draft.priceRub !== null && draft.priceRub > 0,
      severity: "critical",
    },
    {
      id: "availability",
      label: "Availability указана",
      passed: hasText(availability) && availability !== "Unknown",
      severity: "info",
    },
  ];
}

function buildScoreFactors(input: SeoIntelligenceInput): boolean[] {
  const { draft, mainPhoto } = input;
  const imageAlt = mainPhoto?.seo.imageAlt || draft.imageAltText;

  return [
    hasText(draft.seoTitle),
    hasText(draft.metaDescription),
    hasText(draft.slug),
    hasText(draft.h1),
    hasText(draft.h2),
    hasText(draft.seoKeywords),
    hasText(imageAlt),
    hasText(draft.canonicalUrl),
    hasText(draft.openGraphTitle) && hasText(draft.openGraphDescription),
    hasText(mainPhoto?.seo.twitterImage ?? "") || hasText(draft.openGraphTitle),
    hasText(draft.structuredDataType),
    hasLocalPhrase(input),
    hasText(draft.fullDescription),
    hasText(imageAlt),
    Boolean(mainPhoto?.seo.seoFilename),
    hasText(draft.category),
    draft.priceRub !== null && draft.priceRub > 0,
    getAvailabilityLabel(draft.status) !== "Unknown",
  ];
}

function buildRecommendations(input: SeoIntelligenceInput): SeoRecommendation[] {
  const { draft, mainPhoto } = input;
  const items: SeoRecommendation[] = [];

  if (draft.seoTitle.length > 60) {
    items.push({ id: "title-short", text: "Сделайте title короче" });
  }

  if (!input.localSeo.district.trim()) {
    items.push({ id: "district", text: "Добавьте район Москвы" });
  }

  if (!draft.flowerCount) {
    items.push({ id: "flowers", text: "Добавьте количество цветов" });
  }

  if (draft.occasion === "none") {
    items.push({ id: "occasion", text: "Добавьте повод" });
  }

  if (!hasText(draft.seasonality)) {
    items.push({ id: "season", text: "Добавьте сезонность" });
  }

  const imageAlt = mainPhoto?.seo.imageAlt || draft.imageAltText;
  if (!hasText(imageAlt)) {
    items.push({ id: "alt", text: "Добавьте ALT" });
  }

  if (!hasText(draft.seoKeywords)) {
    items.push({ id: "keyword", text: "Добавьте keyword" });
  }

  if (!hasLocalPhrase(input)) {
    items.push({ id: "local", text: "Добавьте local phrase" });
  }

  return items;
}

function resolveHealthLevel(score: number): SeoHealthLevel {
  if (score >= 85) {
    return "excellent";
  }

  if (score >= 60) {
    return "good";
  }

  return "needs_improvement";
}

function buildJsonLdPreview(input: SeoIntelligenceInput): string {
  const { draft, mainPhoto } = input;

  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": draft.structuredDataType || "Product",
      name: draft.name,
      description: draft.fullDescription,
      sku: draft.sku,
      category: draft.category,
      image: mainPhoto?.seo.canonicalImageUrl || draft.canonicalUrl,
      offers: {
        "@type": "Offer",
        price: draft.priceRub,
        priceCurrency: "RUB",
        availability: `https://schema.org/${getAvailabilityLabel(draft.status)}`,
      },
      areaServed: input.localSeo.city,
    },
    null,
    2,
  );
}

export function analyzeSeoIntelligence(input: SeoIntelligenceInput): SeoIntelligenceAnalysis {
  const checklist = buildChecklist(input);
  const scoreFactors = buildScoreFactors(input);
  const passedChecks = scoreFactors.filter(Boolean).length;
  const score = Math.round((passedChecks / scoreFactors.length) * 100);
  const criticalErrors = checklist.filter((item) => !item.passed && item.severity === "critical").length;
  const warnings = checklist.filter((item) => !item.passed && item.severity === "warning").length;

  return {
    score,
    seoReady: score >= 85 && criticalErrors === 0,
    criticalErrors,
    warnings,
    passedChecks,
    checklist,
    recommendations: buildRecommendations(input),
    healthLevel: resolveHealthLevel(score),
    jsonLdPreview: buildJsonLdPreview(input),
  };
}

export function getSeoHealthLabel(level: SeoHealthLevel): string {
  switch (level) {
    case "excellent":
      return "Excellent";
    case "good":
      return "Good";
    case "needs_improvement":
      return "Needs Improvement";
    default:
      return level;
  }
}
