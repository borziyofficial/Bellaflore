// ==================================================
// SECTION: ADMIN FOUNDATION
// РАЗДЕЛ: SEO helpers для Product Manager
// ==================================================

export type AdminProductSeoFields = {
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  seoSlug: string;
  imageAltText: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
};

export const EMPTY_ADMIN_PRODUCT_SEO: AdminProductSeoFields = {
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  seoSlug: "",
  imageAltText: "",
  canonicalUrl: "",
  ogTitle: "",
  ogDescription: "",
};

export const SEO_TITLE_RECOMMENDED_MAX = 60;
export const SEO_DESCRIPTION_RECOMMENDED_MAX = 160;
export const SEO_TITLE_TARGET_MIN = 50;
export const SEO_TITLE_TARGET_MAX = 65;
export const SEO_TITLE_TOO_SHORT = 30;
export const SEO_DESCRIPTION_TARGET_MIN = 140;
export const SEO_DESCRIPTION_TARGET_MAX = 160;
export const SEO_DESCRIPTION_TOO_SHORT = 120;

export type AdminProductSeoScoreTier = "weak" | "medium" | "strong";

export type AdminProductSeoWarningCode =
  | "missing-title"
  | "title-too-short"
  | "title-too-long"
  | "missing-description"
  | "description-too-short"
  | "description-too-long"
  | "missing-keywords"
  | "missing-slug"
  | "missing-image-alt"
  | "missing-canonical"
  | "missing-og-title"
  | "missing-og-description";

export type AdminProductSeoWarning = {
  code: AdminProductSeoWarningCode;
  message: string;
};

export type AdminProductSeoScore = {
  value: number;
  max: number;
  tier: AdminProductSeoScoreTier;
};

export type AdminProductSeoGenerationContext = {
  productName: string;
  category: string;
  size: string;
  description?: string;
  mainPhotoName?: string;
};

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "yo",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
};

function hasSeoText(value: string): boolean {
  return value.trim().length > 0;
}

function transliterateRussian(value: string): string {
  return [...value.toLowerCase()].map((char) => CYRILLIC_TO_LATIN[char] ?? char).join("");
}

export function generateProductSeoSlug(productName: string): string {
  const transliterated = transliterateRussian(productName.trim());

  return transliterated
    .replace(/[^a-z0-9\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function getProductSeoSlugPreview(seoSlug: string): string {
  const normalizedSlug = seoSlug.trim().replace(/^\/+|\/+$/g, "");
  return normalizedSlug ? `/catalog/${normalizedSlug}` : "/catalog/your-product-slug";
}

export function isAdminProductSeoReady(seo: AdminProductSeoFields): boolean {
  return (
    hasSeoText(seo.seoTitle) &&
    hasSeoText(seo.seoDescription) &&
    hasSeoText(seo.seoSlug) &&
    hasSeoText(seo.imageAltText)
  );
}

export function getAdminProductSeoStatusLabel(seo: AdminProductSeoFields): "SEO ready" | "SEO incomplete" {
  return isAdminProductSeoReady(seo) ? "SEO ready" : "SEO incomplete";
}

export function normalizeAdminProductSeoFields(
  partial?: Partial<AdminProductSeoFields> | null,
): AdminProductSeoFields {
  return {
    seoTitle: partial?.seoTitle ?? "",
    seoDescription: partial?.seoDescription ?? "",
    seoKeywords: partial?.seoKeywords ?? "",
    seoSlug: partial?.seoSlug ?? "",
    imageAltText: partial?.imageAltText ?? "",
    canonicalUrl: partial?.canonicalUrl ?? "",
    ogTitle: partial?.ogTitle ?? "",
    ogDescription: partial?.ogDescription ?? "",
  };
}

function isSeoTitleLengthGood(value: string): boolean {
  const length = value.trim().length;
  return length >= SEO_TITLE_TOO_SHORT && length <= SEO_TITLE_RECOMMENDED_MAX;
}

function isSeoDescriptionLengthGood(value: string): boolean {
  const length = value.trim().length;
  return length >= SEO_DESCRIPTION_TOO_SHORT && length <= SEO_DESCRIPTION_RECOMMENDED_MAX;
}

function getSeoScoreTier(value: number): AdminProductSeoScoreTier {
  if (value >= 80) {
    return "strong";
  }

  if (value >= 50) {
    return "medium";
  }

  return "weak";
}

export function getAdminProductSeoScore(seo: AdminProductSeoFields): AdminProductSeoScore {
  let value = 0;

  if (hasSeoText(seo.seoTitle)) {
    value += 5;
    if (isSeoTitleLengthGood(seo.seoTitle)) {
      value += 5;
    }
  }

  if (hasSeoText(seo.seoDescription)) {
    value += 5;
    if (isSeoDescriptionLengthGood(seo.seoDescription)) {
      value += 5;
    }
  }

  if (hasSeoText(seo.seoKeywords)) {
    value += 10;
  }

  if (hasSeoText(seo.seoSlug)) {
    value += 10;
  }

  if (hasSeoText(seo.imageAltText)) {
    value += 10;
  }

  if (hasSeoText(seo.canonicalUrl)) {
    value += 10;
  }

  if (hasSeoText(seo.ogTitle)) {
    value += 10;
  }

  if (hasSeoText(seo.ogDescription)) {
    value += 10;
  }

  return {
    value,
    max: 100,
    tier: getSeoScoreTier(value),
  };
}

export function getAdminProductSeoWarnings(seo: AdminProductSeoFields): AdminProductSeoWarning[] {
  const warnings: AdminProductSeoWarning[] = [];
  const title = seo.seoTitle.trim();
  const description = seo.seoDescription.trim();

  if (!title) {
    warnings.push({ code: "missing-title", message: "Missing SEO Title" });
  } else {
    if (title.length < SEO_TITLE_TOO_SHORT) {
      warnings.push({ code: "title-too-short", message: "Title too short" });
    }

    if (title.length > SEO_TITLE_RECOMMENDED_MAX) {
      warnings.push({ code: "title-too-long", message: "Title too long" });
    }
  }

  if (!description) {
    warnings.push({ code: "missing-description", message: "Missing SEO Description" });
  } else {
    if (description.length < SEO_DESCRIPTION_TOO_SHORT) {
      warnings.push({ code: "description-too-short", message: "Description too short" });
    }

    if (description.length > SEO_DESCRIPTION_RECOMMENDED_MAX) {
      warnings.push({ code: "description-too-long", message: "Description too long" });
    }
  }

  if (!hasSeoText(seo.seoKeywords)) {
    warnings.push({ code: "missing-keywords", message: "Missing Keywords" });
  }

  if (!hasSeoText(seo.seoSlug)) {
    warnings.push({ code: "missing-slug", message: "Missing Slug" });
  }

  if (!hasSeoText(seo.imageAltText)) {
    warnings.push({ code: "missing-image-alt", message: "Missing Image ALT Text" });
  }

  if (!hasSeoText(seo.canonicalUrl)) {
    warnings.push({ code: "missing-canonical", message: "Missing Canonical URL" });
  }

  if (!hasSeoText(seo.ogTitle)) {
    warnings.push({ code: "missing-og-title", message: "Missing OpenGraph Title" });
  }

  if (!hasSeoText(seo.ogDescription)) {
    warnings.push({ code: "missing-og-description", message: "Missing OpenGraph Description" });
  }

  return warnings;
}

function trimToMaxLength(value: string, maxLength: number): string {
  const trimmed = value.trim();

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const slice = trimmed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.6) {
    return slice.slice(0, lastSpace).trim();
  }

  return slice.trim();
}

function pickBestLengthCandidate(candidates: string[], min: number, max: number): string {
  const normalized = candidates.map((candidate) => trimToMaxLength(candidate, max)).filter(Boolean);

  const inRange = normalized.find((candidate) => candidate.length >= min && candidate.length <= max);
  if (inRange) {
    return inRange;
  }

  const underMax = normalized
    .filter((candidate) => candidate.length <= max)
    .sort((left, right) => right.length - left.length)[0];

  return underMax ?? normalized[0] ?? "";
}

function uniqueKeywords(parts: string[]): string {
  const seen = new Set<string>();

  return parts
    .map((part) => part.trim().toLowerCase())
    .filter((part) => {
      if (!part || seen.has(part)) {
        return false;
      }

      seen.add(part);
      return true;
    })
    .join(", ");
}

export function generateProductSeoTitle(context: AdminProductSeoGenerationContext): string {
  const name = context.productName.trim();
  if (!name) {
    return "";
  }

  const category = context.category.trim();
  const sizeSuffix = context.size ? `, размер ${context.size}` : "";

  const candidates = [
    `${name} — премиальный букет с доставкой`,
    `${name} — доставка цветов по Москве`,
    category ? `${name} — премиальный ${category.toLowerCase()} с доставкой` : "",
    `${name} — свежие цветы с доставкой по Москве${sizeSuffix}`,
  ].filter(Boolean);

  return pickBestLengthCandidate(candidates, SEO_TITLE_TARGET_MIN, SEO_TITLE_TARGET_MAX);
}

export function generateProductSeoDescription(context: AdminProductSeoGenerationContext): string {
  const name = context.productName.trim();
  if (!name) {
    return "";
  }

  const category = context.category.trim() || "букет";
  const sizePart = context.size ? ` Размер ${context.size}.` : "";

  const candidates = [
    `${name} — премиальный ${category.toLowerCase()} с доставкой по Москве от BellaFlore. Свежие цветы, luxury-упаковка.${sizePart}`,
    `Закажите ${name}: премиальный ${category.toLowerCase()} с быстрой доставкой по Москве. Свежие цветы и безупречная подача от BellaFlore.${sizePart}`,
    `${name} от BellaFlore — авторский ${category.toLowerCase()}, свежие цветы и доставка по Москве в день заказа.${sizePart}`,
  ];

  return pickBestLengthCandidate(
    candidates,
    SEO_DESCRIPTION_TARGET_MIN,
    SEO_DESCRIPTION_TARGET_MAX,
  );
}

export function generateProductSeoKeywords(context: AdminProductSeoGenerationContext): string {
  const name = context.productName.trim();
  if (!name) {
    return "";
  }

  const category = context.category.trim();
  const nameLower = name.toLowerCase();
  const parts = [
    nameLower,
    category ? category.toLowerCase() : "",
    category ? `букет ${category.toLowerCase()}` : "букет цветов",
    context.size ? `размер ${context.size.toLowerCase()}` : "",
    "доставка цветов Москва",
    "премиальный букет",
    "свежие цветы",
    "BellaFlore",
  ];

  if (nameLower.includes("роз")) {
    parts.push("букет роз", "розы");
  }

  if (nameLower.includes("пион")) {
    parts.push("пионы", "букет пионов");
  }

  return uniqueKeywords(parts);
}

export function generateProductImageAltText(context: AdminProductSeoGenerationContext): string {
  const name = context.productName.trim();
  if (!name) {
    return "";
  }

  const category = context.category.trim();
  const photoPart = context.mainPhotoName ? ` (${context.mainPhotoName})` : "";

  const candidates = [
    `Премиальный букет ${name} от BellaFlore`,
    category ? `Премиальный ${category.toLowerCase()} ${name} от BellaFlore${photoPart}` : "",
    `Букет ${name} — премиальная доставка цветов BellaFlore${photoPart}`,
  ].filter(Boolean);

  return candidates[0] ?? "";
}

export function generateProductCanonicalUrl(seoSlug: string): string {
  const slug = seoSlug.trim() || generateProductSeoSlug("");
  if (!slug) {
    return "https://bellaflore.ru/catalog/your-product-slug";
  }

  return `https://bellaflore.ru/catalog/${slug}`;
}

export function generateProductOgTitle(context: AdminProductSeoGenerationContext): string {
  const name = context.productName.trim();
  if (!name) {
    return "";
  }

  return trimToMaxLength(`${name} | BellaFlore`, SEO_TITLE_RECOMMENDED_MAX);
}

export function generateProductOgDescription(context: AdminProductSeoGenerationContext): string {
  const description = generateProductSeoDescription(context);
  if (!description) {
    return "";
  }

  return trimToMaxLength(description, SEO_DESCRIPTION_RECOMMENDED_MAX);
}

export function generateAllProductSeoFields(
  context: AdminProductSeoGenerationContext,
): AdminProductSeoFields {
  const seoSlug = generateProductSeoSlug(context.productName);
  const seoTitle = generateProductSeoTitle(context);
  const seoDescription = generateProductSeoDescription(context);

  return {
    seoTitle,
    seoDescription,
    seoKeywords: generateProductSeoKeywords(context),
    seoSlug,
    imageAltText: generateProductImageAltText(context),
    canonicalUrl: generateProductCanonicalUrl(seoSlug),
    ogTitle: generateProductOgTitle(context),
    ogDescription: generateProductOgDescription(context),
  };
}

export type AdminProductSeoFieldKey = keyof AdminProductSeoFields;

const SEO_FIELD_LABELS: Record<AdminProductSeoFieldKey, string> = {
  seoTitle: "SEO Title",
  seoDescription: "SEO Description",
  seoKeywords: "SEO Keywords",
  seoSlug: "SEO Slug",
  imageAltText: "Image ALT Text",
  canonicalUrl: "Canonical URL",
  ogTitle: "OpenGraph Title",
  ogDescription: "OpenGraph Description",
};

export function buildProductSeoGenerateAllPatch(
  current: AdminProductSeoFields,
  generated: AdminProductSeoFields,
  allowOverwrite: boolean,
): Partial<AdminProductSeoFields> {
  const patch: Partial<AdminProductSeoFields> = {};
  const fields = Object.keys(SEO_FIELD_LABELS) as AdminProductSeoFieldKey[];

  for (const field of fields) {
    const currentValue = current[field].trim();
    const generatedValue = generated[field].trim();

    if (!generatedValue) {
      continue;
    }

    if (!currentValue || allowOverwrite) {
      patch[field] = generatedValue;
    }
  }

  return patch;
}

export function getProductSeoOverwriteFieldLabels(
  current: AdminProductSeoFields,
  generated: AdminProductSeoFields,
): string[] {
  const fields = Object.keys(SEO_FIELD_LABELS) as AdminProductSeoFieldKey[];

  return fields
    .filter((field) => {
      const currentValue = current[field].trim();
      const generatedValue = generated[field].trim();
      return Boolean(currentValue && generatedValue && currentValue !== generatedValue);
    })
    .map((field) => SEO_FIELD_LABELS[field]);
}

export function getGoogleSeoPreview(seo: AdminProductSeoFields): {
  title: string;
  url: string;
  description: string;
} {
  const slug = seo.seoSlug.trim();

  return {
    title: seo.seoTitle.trim() || "SEO Title — премиальный букет BellaFlore",
    url: slug
      ? `https://bellaflore.ru/catalog/${slug}`
      : "https://bellaflore.ru/catalog/your-product-slug",
    description:
      seo.seoDescription.trim() ||
      "SEO Description — краткое описание товара для сниппета в поиске Google.",
  };
}
