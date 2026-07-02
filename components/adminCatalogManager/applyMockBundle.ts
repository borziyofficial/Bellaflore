// ==================================================
// SECTION: Admin Catalog Manager — mock bundle apply
// РАЗДЕЛ: Применение mock AI + SEO к форме
// ==================================================
import type {
  AdminProductFormState,
  MockAiBundle,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import type { MockSeoSuggestionField } from "@/components/adminCatalogManager/adminSeoTypes";

const ALL_SEO_FIELDS: MockSeoSuggestionField[] = [
  "seoTitle",
  "seoDescription",
  "seoH1",
  "seoSlug",
  "seoImageAlt",
  "seoGalleryAlt",
  "openGraphTitle",
  "openGraphDescription",
  "seoKeywords",
  "internalLinkSuggestions",
  "seoFaq",
  "schemaProductJsonLd",
];

export function applyProductBundleToForm(
  form: AdminProductFormState,
  bundle: MockAiBundle,
  options?: { overwriteSlug?: boolean },
): AdminProductFormState {
  const { product, seo } = bundle;

  return {
    ...form,
    title: product.title,
    slug: options?.overwriteSlug || !form.slug.trim() ? seo.seoSlug : form.slug,
    categoryId: product.categoryId,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    composition: product.composition,
    tags: product.tags.join(", "),
    sizePrices: {
      S: String(product.sizePrices.S),
      M: String(product.sizePrices.M),
      L: String(product.sizePrices.L),
      XL: String(product.sizePrices.XL),
    },
    isFeatured: product.suggestFeatured ?? form.isFeatured,
    isNew: product.suggestNew ?? form.isNew,
    isBestseller: product.suggestBestseller ?? form.isBestseller,
    mainImageAlt: product.imageAlt,
    seoImageAlt: seo.seoImageAlt,
  };
}

export function applySeoBundleToForm(
  form: AdminProductFormState,
  bundle: MockAiBundle,
  fields: MockSeoSuggestionField[] = ALL_SEO_FIELDS,
): AdminProductFormState {
  const { seo } = bundle;
  const nextForm = { ...form };

  if (fields.includes("seoTitle")) {
    nextForm.seoTitle = seo.seoTitle;
  }
  if (fields.includes("seoDescription")) {
    nextForm.seoDescription = seo.seoDescription;
  }
  if (fields.includes("seoH1")) {
    nextForm.seoH1 = seo.seoH1;
  }
  if (fields.includes("seoSlug")) {
    nextForm.seoSlug = seo.seoSlug;
    if (!form.slug.trim()) {
      nextForm.slug = seo.seoSlug;
    }
  }
  if (fields.includes("seoImageAlt")) {
    nextForm.seoImageAlt = seo.seoImageAlt;
    if (!form.mainImageAlt.trim()) {
      nextForm.mainImageAlt = seo.seoImageAlt;
    }
  }
  if (fields.includes("seoGalleryAlt")) {
    nextForm.seoGalleryAlt = [...seo.seoGalleryAlt];
  }
  if (fields.includes("openGraphTitle")) {
    nextForm.openGraphTitle = seo.openGraphTitle;
  }
  if (fields.includes("openGraphDescription")) {
    nextForm.openGraphDescription = seo.openGraphDescription;
  }
  if (fields.includes("seoKeywords")) {
    nextForm.seoKeywords = seo.seoKeywords;
  }
  if (fields.includes("internalLinkSuggestions")) {
    nextForm.internalLinkSuggestions = [...seo.internalLinkSuggestions];
  }
  if (fields.includes("seoFaq")) {
    nextForm.seoFaq = seo.seoFaq.map((item) => ({ ...item }));
  }
  if (fields.includes("schemaProductJsonLd")) {
    nextForm.schemaProductJsonLd = { ...seo.schemaProductJsonLd };
  }

  nextForm.seoScore = seo.seoScore;
  nextForm.seoRecommendations = [...seo.seoRecommendations];

  return nextForm;
}

export function applyFullMockBundle(
  form: AdminProductFormState,
  bundle: MockAiBundle,
): AdminProductFormState {
  return applySeoBundleToForm(applyProductBundleToForm(form, bundle), bundle);
}
