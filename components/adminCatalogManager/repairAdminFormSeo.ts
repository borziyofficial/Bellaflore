// ==================================================
// SECTION: Admin Catalog Manager — SEO repair
// РАЗДЕЛ: Восстановление SEO по названию букета
// ==================================================
import type { AdminProductFormState } from "@/components/adminCatalogManager/adminCatalogTypes";
import { applyFullMockBundle } from "@/components/adminCatalogManager/applyMockBundle";
import { generateMockAiBundle } from "@/components/adminCatalogManager/mockAiAssistant";
import {
  isGarbageAiHint,
  isGarbageProductTitle,
} from "@/components/adminCatalogManager/mockAiHintUtils";

function formNeedsSeoRepair(form: AdminProductFormState): boolean {
  const slugCandidate = form.seoSlug.trim() || form.slug.trim();

  return (
    isGarbageAiHint(slugCandidate) ||
    isGarbageProductTitle(form.seoTitle) ||
    isGarbageProductTitle(form.seoH1) ||
    isGarbageProductTitle(form.openGraphTitle) ||
    isGarbageProductTitle(form.mainImageAlt) ||
    isGarbageProductTitle(form.seoImageAlt)
  );
}

export function repairAdminFormFromTitleIfNeeded(
  form: AdminProductFormState,
): AdminProductFormState {
  if (isGarbageProductTitle(form.title) || !formNeedsSeoRepair(form)) {
    return form;
  }

  const bundle = generateMockAiBundle(form.title, { formTitle: form.title });
  const repaired = applyFullMockBundle(form, bundle);

  return {
    ...repaired,
    id: form.id,
    title: form.title.trim(),
    status: form.status,
    sizePrices: form.sizePrices,
    mainImageUrl: form.mainImageUrl,
    mainImageStorage: form.mainImageStorage,
    mainImageTemporary: form.mainImageTemporary,
    galleryUrls: form.galleryUrls,
    composition: form.composition.trim() || repaired.composition,
  };
}
