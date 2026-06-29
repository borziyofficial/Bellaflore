// ==================================================
// SECTION: PRODUCT EDITOR
// РАЗДЕЛ: SEO score foundation (client-side mock)
// ==================================================
import {
  LOCAL_SEO_PHRASE_TARGET,
  type ProductEditorDraft,
  type ProductEditorSeoScore,
} from "@/components/productEditor/productEditorTypes";

function hasText(value: string): boolean {
  return value.trim().length > 0;
}

export function buildProductEditorSeoScore(draft: ProductEditorDraft): ProductEditorSeoScore {
  const checklist = [
    {
      id: "title",
      label: "Title заполнен",
      passed: hasText(draft.seoTitle),
    },
    {
      id: "meta",
      label: "Meta description заполнен",
      passed: hasText(draft.metaDescription),
    },
    {
      id: "slug",
      label: "Slug заполнен",
      passed: hasText(draft.slug),
    },
    {
      id: "h1",
      label: "H1 заполнен",
      passed: hasText(draft.h1),
    },
    {
      id: "alt",
      label: "Alt text заполнен",
      passed: hasText(draft.imageAltText),
    },
    {
      id: "price",
      label: "Цена указана",
      passed: draft.priceRub !== null && draft.priceRub > 0,
    },
    {
      id: "category",
      label: "Категория указана",
      passed: hasText(draft.category),
    },
    {
      id: "description",
      label: "Описание больше 300 символов",
      passed: draft.fullDescription.trim().length > 300,
    },
    {
      id: "local-phrase",
      label: `Есть local phrase “${LOCAL_SEO_PHRASE_TARGET}”`,
      passed:
        draft.localSeoPhrase.toLowerCase().includes(LOCAL_SEO_PHRASE_TARGET) ||
        draft.metaDescription.toLowerCase().includes(LOCAL_SEO_PHRASE_TARGET) ||
        draft.fullDescription.toLowerCase().includes(LOCAL_SEO_PHRASE_TARGET),
    },
    {
      id: "structured-data",
      label: "Structured Data готова",
      passed: hasText(draft.structuredDataType),
    },
  ];

  const passedCount = checklist.filter((item) => item.passed).length;
  const score = Math.round((passedCount / checklist.length) * 100);

  return { score, checklist };
}

export function formatProductEditorPrice(priceRub: number | null): string {
  if (priceRub === null || Number.isNaN(priceRub)) {
    return "—";
  }

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(priceRub);
}

export function getProductEditorStatusLabel(
  status: ProductEditorDraft["status"],
): string {
  switch (status) {
    case "active":
      return "активен";
    case "draft":
      return "черновик";
    case "hidden":
      return "скрыт";
    default:
      return status;
  }
}
