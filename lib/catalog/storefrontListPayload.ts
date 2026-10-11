// ==================================================
// SECTION: Storefront list payload compaction
// РАЗДЕЛ: Уплотнение payload списка витрины
//
// Purpose (EN): Shrink repeated/redundant catalog list fields without
// removing the public product contract used by search and product UI.
//
// Назначение (RU): Сокращает повторяющиеся/избыточные поля списка каталога
// без удаления публичного контракта товара, нужного поиску и UI.
// ==================================================

export const DEFAULT_STOREFRONT_CARE =
  "Обрежьте стебли под углом, меняйте воду каждые 2 дня.";

export const DEFAULT_STOREFRONT_DELIVERY_HINT =
  "Доставка сегодня по Москве и области";

export type StorefrontGalleryImage = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

/**
 * Deduplicate gallery URLs and drop a gallery that only repeats the primary
 * card image (`src`). Extra unique photos are kept for the product dialog.
 */
export function compactStorefrontGalleryImages(
  images: StorefrontGalleryImage[],
  primarySrc: string,
): StorefrontGalleryImage[] {
  const normalizedPrimary = primarySrc.trim();
  const seen = new Set<string>();
  const unique: StorefrontGalleryImage[] = [];

  for (const image of images) {
    const src = image.src.trim();
    if (!src || seen.has(src)) {
      continue;
    }
    seen.add(src);
    unique.push({
      ...image,
      src,
    });
  }

  if (unique.length === 0) {
    return [];
  }

  if (unique.length === 1 && unique[0]?.src === normalizedPrimary) {
    return [];
  }

  return unique;
}

export function resolveStorefrontCare(care: string | null | undefined): string {
  const trimmed = care?.trim() ?? "";
  return trimmed || DEFAULT_STOREFRONT_CARE;
}

export function resolveStorefrontDeliveryHint(
  deliveryHint: string | null | undefined,
): string {
  const trimmed = deliveryHint?.trim() ?? "";
  return trimmed || DEFAULT_STOREFRONT_DELIVERY_HINT;
}
