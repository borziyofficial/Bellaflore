// ==================================================
// SECTION: Admin Catalog Manager — SEO score engine
// РАЗДЕЛ: Расчёт SEO-оценки и чеклиста
// ==================================================
import type { AdminProductFormState } from "@/components/adminCatalogManager/adminCatalogTypes";
import type {
  AdminSeoChecklistItem,
  AdminSeoDraftFields,
} from "@/components/adminCatalogManager/adminSeoTypes";

const DELIVERY_KEYWORDS = ["доставк", "москв", "сегодня", "курьер"];
const OCCASION_KEYWORDS = ["подарок", "день рождения", "8 марта", "свидание", "юбилей"];

function hasKeywordMatch(text: string, keywords: string[]): boolean {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

export function buildSeoChecklist(
  fields: Pick<
    AdminSeoDraftFields,
    | "seoTitle"
    | "seoDescription"
    | "seoH1"
    | "seoSlug"
    | "seoImageAlt"
    | "seoKeywords"
    | "seoFaq"
    | "schemaProductJsonLd"
  >,
): AdminSeoChecklistItem[] {
  const titleLength = fields.seoTitle.trim().length;
  const descriptionLength = fields.seoDescription.trim().length;
  const keywordsText = fields.seoKeywords.trim();
  const descriptionText = `${fields.seoDescription} ${fields.seoH1}`.toLowerCase();

  return [
    {
      id: "title-length",
      label: "Длина SEO-заголовка в норме",
      passed: titleLength >= 30 && titleLength <= 70,
    },
    {
      id: "description-length",
      label: "Длина SEO-описания в норме",
      passed: descriptionLength >= 80 && descriptionLength <= 180,
    },
    {
      id: "h1",
      label: "H1 заполнен",
      passed: fields.seoH1.trim().length > 0,
    },
    {
      id: "slug",
      label: "URL/slug чистый",
      passed: /^[a-z0-9-]+$/.test(fields.seoSlug.trim()),
    },
    {
      id: "alt",
      label: "Alt-текст главного фото есть",
      passed: fields.seoImageAlt.trim().length > 0,
    },
    {
      id: "keywords",
      label: "Ключевые фразы добавлены естественно",
      passed: keywordsText.length > 0,
    },
    {
      id: "faq",
      label: "FAQ заполнен",
      passed: fields.seoFaq.length > 0,
    },
    {
      id: "schema",
      label: "Schema.org Product существует",
      passed: Object.keys(fields.schemaProductJsonLd).length > 0,
    },
    {
      id: "delivery-keyword",
      label: "Есть ключевое слово доставки",
      passed: hasKeywordMatch(descriptionText, DELIVERY_KEYWORDS),
    },
    {
      id: "occasion-keyword",
      label: "Есть повод/сценарий покупки",
      passed: hasKeywordMatch(descriptionText, OCCASION_KEYWORDS),
    },
  ];
}

export function calculateSeoScore(checklist: AdminSeoChecklistItem[]): number {
  if (checklist.length === 0) {
    return 0;
  }

  const passed = checklist.filter((item) => item.passed).length;
  return Math.round((passed / checklist.length) * 100);
}

export function buildSeoRecommendations(
  checklist: AdminSeoChecklistItem[],
  form: Pick<AdminProductFormState, "mainImageUrl" | "galleryUrls" | "composition">,
): string[] {
  const recommendations: string[] = [];
  const byId = new Map(checklist.map((item) => [item.id, item]));

  if (!byId.get("alt")?.passed) {
    recommendations.push("Добавьте alt-текст для главного фото.");
  }
  if (!form.mainImageUrl || form.galleryUrls.filter(Boolean).length === 0) {
    recommendations.push("Добавьте ещё одно фото товара.");
  }
  if (!byId.get("description-length")?.passed) {
    recommendations.push("Сделайте описание более конкретным и информативным.");
  }
  if (!byId.get("delivery-keyword")?.passed) {
    recommendations.push("Добавьте ключевое слово «доставка по Москве».");
  }
  if (!form.composition.trim()) {
    recommendations.push("Добавьте состав букета в описание.");
  }
  if (!byId.get("occasion-keyword")?.passed) {
    recommendations.push("Добавьте ключевое слово повода: подарок, день рождения, 8 марта.");
  }
  if (!byId.get("faq")?.passed) {
    recommendations.push("Добавьте FAQ для расширенного сниппета.");
  }
  if (!byId.get("keywords")?.passed) {
    recommendations.push("Добавьте 3–5 ключевых фраз через запятую.");
  }

  return recommendations.slice(0, 6);
}

export function evaluateSeoFromForm(
  form: AdminProductFormState,
): {
  checklist: AdminSeoChecklistItem[];
  score: number;
  recommendations: string[];
} {
  const checklist = buildSeoChecklist({
    seoTitle: form.seoTitle,
    seoDescription: form.seoDescription,
    seoH1: form.seoH1,
    seoSlug: form.seoSlug || form.slug,
    seoImageAlt: form.seoImageAlt || form.mainImageAlt,
    seoKeywords: form.seoKeywords,
    seoFaq: form.seoFaq,
    schemaProductJsonLd: form.schemaProductJsonLd,
  });

  const score = calculateSeoScore(checklist);
  const recommendations =
    score < 85
      ? buildSeoRecommendations(checklist, form)
      : form.seoRecommendations;

  return { checklist, score, recommendations };
}

export function createEmptySeoDraftFields(): AdminSeoDraftFields {
  return {
    seoTitle: "",
    seoDescription: "",
    seoH1: "",
    seoSlug: "",
    seoKeywords: "",
    seoFaq: [],
    seoImageAlt: "",
    seoGalleryAlt: [],
    openGraphTitle: "",
    openGraphDescription: "",
    schemaProductJsonLd: {},
    seoScore: 0,
    seoRecommendations: [],
    internalLinkSuggestions: [],
  };
}
