// ==================================================
// SECTION: Admin Catalog Manager — form validation
// РАЗДЕЛ: Валидация формы товара
// ==================================================
import type {
  AdminProductFormErrors,
  AdminProductFormState,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import { slugifyProductTitle } from "@/components/adminCatalogManager/adminCatalogRecordUtils";

const SIZE_IDS = ["S", "M", "L", "XL"] as const;

export function hasAnySizePrice(form: AdminProductFormState): boolean {
  return SIZE_IDS.some((sizeId) => {
    const value = Number(form.sizePrices[sizeId].replace(/\s/g, ""));
    return Number.isFinite(value) && value > 0;
  });
}

export function validateAdminProductForm(
  form: AdminProductFormState,
  options?: { requireImage?: boolean; requireSlug?: boolean },
): AdminProductFormErrors {
  const errors: AdminProductFormErrors = {};
  const requireImage = options?.requireImage ?? false;
  const requireSlug = options?.requireSlug ?? true;

  if (!form.title.trim()) {
    errors.title = "Укажите название товара.";
  }

  if (requireSlug && !form.slug.trim() && !form.seoSlug.trim()) {
    errors.slug = "Укажите URL товара.";
  }

  if (!form.categoryId) {
    errors.categoryId = "Выберите категорию.";
  }

  if (!hasAnySizePrice(form)) {
    errors.sizePrices = "Укажите цену.";
  }

  if (requireImage && !form.mainImageUrl.trim()) {
    errors.mainImageUrl = "Добавьте фото товара.";
  }

  return errors;
}

export function prepareAdminProductFormForPublish(
  form: AdminProductFormState,
  basePrice?: string,
): AdminProductFormState {
  const normalizedBasePrice = (basePrice ?? form.sizePrices.M).trim();
  const nextForm = { ...form };

  if (normalizedBasePrice && !hasAnySizePrice(form)) {
    nextForm.sizePrices = {
      ...form.sizePrices,
      M: normalizedBasePrice,
    };
  }

  if (!nextForm.slug.trim() && !nextForm.seoSlug.trim() && nextForm.title.trim()) {
    const slug = slugifyProductTitle(nextForm.title);
    nextForm.slug = slug;
    nextForm.seoSlug = slug;
  }

  return nextForm;
}
