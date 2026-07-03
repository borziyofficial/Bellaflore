// ==================================================
// SECTION: Admin Catalog Manager — selective AI apply
// РАЗДЕЛ: Применение AI только с подтверждением
// ==================================================
import type {
  AdminProductFormState,
  MockAiBundle,
  MockAiSuggestionField,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";

const SIZE_IDS: CatalogProductSizeId[] = ["S", "M", "L", "XL"];

export type AiSuggestionFieldKey =
  | MockAiSuggestionField
  | "seoTitle"
  | "seoDescription";

export type AiFieldPreview = {
  key: AiSuggestionFieldKey;
  label: string;
  currentValue: string;
  suggestedValue: string;
  isEmpty: boolean;
  defaultChecked: boolean;
};

function formatSizePrices(
  prices: Record<CatalogProductSizeId, string | number>,
): string {
  return SIZE_IDS.map((sizeId) => `${sizeId}: ${prices[sizeId] || "—"}`).join(
    " · ",
  );
}

export function buildAiFieldPreviews(
  form: AdminProductFormState,
  bundle: MockAiBundle,
): AiFieldPreview[] {
  const { product, seo } = bundle;
  const suggestedPrices = {
    S: String(product.sizePrices.S),
    M: String(product.sizePrices.M),
    L: String(product.sizePrices.L),
    XL: String(product.sizePrices.XL),
  };

  const fields: AiFieldPreview[] = [
    {
      key: "title",
      label: "Название",
      currentValue: form.title,
      suggestedValue: product.title,
      isEmpty: !form.title.trim(),
      defaultChecked: !form.title.trim(),
    },
    {
      key: "categoryId",
      label: "Категория",
      currentValue: form.categoryId,
      suggestedValue: product.categoryId,
      isEmpty: !form.categoryId,
      defaultChecked: !form.categoryId,
    },
    {
      key: "shortDescription",
      label: "Краткое описание",
      currentValue: form.shortDescription,
      suggestedValue: product.shortDescription,
      isEmpty: !form.shortDescription.trim(),
      defaultChecked: !form.shortDescription.trim(),
    },
    {
      key: "composition",
      label: "Состав",
      currentValue: form.composition,
      suggestedValue: product.composition,
      isEmpty: !form.composition.trim(),
      defaultChecked: !form.composition.trim(),
    },
    {
      key: "sizePrices",
      label: "Цены S–XL",
      currentValue: formatSizePrices(form.sizePrices),
      suggestedValue: formatSizePrices(suggestedPrices),
      isEmpty: !SIZE_IDS.some((sizeId) => form.sizePrices[sizeId].trim()),
      defaultChecked: !SIZE_IDS.some((sizeId) => form.sizePrices[sizeId].trim()),
    },
    {
      key: "imageAlt",
      label: "Alt-текст",
      currentValue: form.mainImageAlt || form.seoImageAlt,
      suggestedValue: product.imageAlt,
      isEmpty: !form.mainImageAlt.trim() && !form.seoImageAlt.trim(),
      defaultChecked: !form.mainImageAlt.trim() && !form.seoImageAlt.trim(),
    },
    {
      key: "seoTitle",
      label: "SEO-заголовок",
      currentValue: form.seoTitle,
      suggestedValue: seo.seoTitle,
      isEmpty: !form.seoTitle.trim(),
      defaultChecked: !form.seoTitle.trim(),
    },
    {
      key: "seoDescription",
      label: "SEO-описание",
      currentValue: form.seoDescription,
      suggestedValue: seo.seoDescription,
      isEmpty: !form.seoDescription.trim(),
      defaultChecked: !form.seoDescription.trim(),
    },
  ];

  return fields.filter(
    (field) =>
      field.suggestedValue.trim() &&
      field.suggestedValue !== field.currentValue,
  );
}

export function applyAiFieldsToForm(
  form: AdminProductFormState,
  bundle: MockAiBundle,
  selectedKeys: Set<AiSuggestionFieldKey>,
): AdminProductFormState {
  const { product, seo } = bundle;
  const nextForm = { ...form };

  if (selectedKeys.has("title")) {
    nextForm.title = product.title;
  }
  if (selectedKeys.has("categoryId")) {
    nextForm.categoryId = product.categoryId;
  }
  if (selectedKeys.has("shortDescription")) {
    nextForm.shortDescription = product.shortDescription;
    nextForm.fullDescription = product.fullDescription;
  }
  if (selectedKeys.has("composition")) {
    nextForm.composition = product.composition;
  }
  if (selectedKeys.has("sizePrices")) {
    nextForm.sizePrices = {
      S: String(product.sizePrices.S),
      M: String(product.sizePrices.M),
      L: String(product.sizePrices.L),
      XL: String(product.sizePrices.XL),
    };
  }
  if (selectedKeys.has("imageAlt")) {
    nextForm.mainImageAlt = product.imageAlt;
    nextForm.seoImageAlt = seo.seoImageAlt;
  }
  if (selectedKeys.has("seoTitle")) {
    nextForm.seoTitle = seo.seoTitle;
    nextForm.seoH1 = seo.seoH1;
    nextForm.openGraphTitle = seo.openGraphTitle;
  }
  if (selectedKeys.has("seoDescription")) {
    nextForm.seoDescription = seo.seoDescription;
    nextForm.openGraphDescription = seo.openGraphDescription;
  }

  if (
    selectedKeys.has("title") &&
    !nextForm.slug.trim() &&
    !nextForm.seoSlug.trim()
  ) {
    nextForm.seoSlug = seo.seoSlug;
    nextForm.slug = seo.seoSlug;
  }

  return nextForm;
}
