// ==================================================
// SECTION: Admin Catalog Manager — mock AI assistant
// РАЗДЕЛ: Mock AI-помощник (без внешнего API)
// ==================================================
import type {
  MockAiBundle,
  MockAiSuggestion,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import { inferBouquetProfile } from "@/components/adminCatalogManager/mockAiBouquetEngine";
import { resolveAiHint } from "@/components/adminCatalogManager/mockAiHintUtils";
import { generateMockSeoSuggestions } from "@/components/adminCatalogManager/mockSeoAssistant";

type GenerateMockOptions = {
  fileName?: string;
  formTitle?: string;
};

export function generateMockProductSuggestions(
  hint = "",
  options?: GenerateMockOptions,
): MockAiSuggestion {
  const resolvedTitle = resolveAiHint({
    fileName: options?.fileName,
    formTitle: options?.formTitle ?? hint,
    fallback: hint,
  });
  const profile = inferBouquetProfile(resolvedTitle);

  return {
    title: profile.title,
    categoryId: profile.categoryId,
    shortDescription: profile.shortDescription,
    fullDescription: profile.fullDescription,
    composition: profile.composition,
    tags: profile.tags,
    sizePrices: profile.sizePrices,
    imageAlt: profile.imageAlt,
    suggestFeatured: profile.suggestFeatured,
    suggestNew: profile.suggestNew,
    suggestBestseller: profile.suggestBestseller,
  };
}

export function generateMockAiBundle(
  hint = "",
  options?: GenerateMockOptions,
): MockAiBundle {
  const product = generateMockProductSuggestions(hint, options);
  const seo = generateMockSeoSuggestions(product);

  return { product, seo };
}

/** @deprecated Use generateMockAiBundle */
export function generateMockAiSuggestions(hint = ""): MockAiSuggestion {
  return generateMockProductSuggestions(hint);
}
