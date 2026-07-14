import { CATALOG_CATEGORY_BY_ID } from "@/components/catalogEngine/categoriesCatalog";
import { PUBLIC_CATALOG_PLACEHOLDER_IMAGE } from "@/components/catalog/publicCatalogMerge";
import type { ProductSizeOption } from "@/data/productTypes";
import type { CatalogProduct } from "@/data/catalogProducts";
import type {
  StoredBouquetCategoryStorage,
  StoredBouquetRecord,
} from "@/lib/bouquetDb/types";

type CategoryLabelMap = Map<string, string>;

const BOUQUET_BADGE_LABELS: Record<string, string | undefined> = {
  new: "Новинка",
  hit: "Хит",
  premium: "Премиум",
  sale: "Скидка",
  limited: "Лимит",
};

function buildCategoryLabelMap(storage: StoredBouquetCategoryStorage): CategoryLabelMap {
  const labels = new Map<string, string>();

  for (const category of Object.values(CATALOG_CATEGORY_BY_ID)) {
    labels.set(category.id, category.title);
  }

  for (const category of storage.custom) {
    labels.set(category.id, category.name);
  }

  for (const [categoryId, override] of Object.entries(storage.overrides)) {
    labels.set(categoryId, override.name);
  }

  return labels;
}

function resolveCategoryLabel(
  labels: CategoryLabelMap,
  categoryId: string,
): string {
  return labels.get(categoryId) ?? (categoryId.trim() || "Авторские букеты");
}

function bouquetSizesToCatalogSizes(record: StoredBouquetRecord): ProductSizeOption[] {
  return (["S", "M", "L", "XL"] as const).flatMap((sizeCode) => {
    const size = record.sizes[sizeCode];
    if (!size?.enabled || size.price <= 0) {
      return [];
    }

    return [{ label: sizeCode, price: size.price }];
  });
}

export function storedBouquetToLegacyCatalogProduct(
  record: StoredBouquetRecord,
  categoryStorage: StoredBouquetCategoryStorage,
): CatalogProduct {
  const labels = buildCategoryLabelMap(categoryStorage);
  const category = resolveCategoryLabel(labels, record.categoryId);
  const cover =
    record.images.find((image) => image.isCover) ?? record.images[0] ?? null;
  const imageUrl = cover?.url?.trim() || PUBLIC_CATALOG_PLACEHOLDER_IMAGE;
  const sizes = bouquetSizesToCatalogSizes(record);
  const priceRub =
    sizes.length > 0
      ? Math.min(...sizes.map((size) => size.price))
      : Math.max(0, record.basePrice);
  const badge = BOUQUET_BADGE_LABELS[record.badge];
  const searchTerms = [
    record.name,
    record.description,
    category,
    record.seo.title,
    record.seo.description,
    badge,
    record.displayFlags.isPremium ? "премиум premium" : "",
    record.displayFlags.isBestseller ? "хит" : "",
    record.displayFlags.isRecommended ? "рекомендуем" : "",
    record.displayFlags.isSeasonal ? "сезонный" : "",
  ].filter((term): term is string => Boolean(term));

  return {
    id: record.id,
    slug: record.seo.slug || record.slug,
    src: imageUrl,
    alt: cover?.name || record.name,
    title: record.name,
    description: record.description || "Авторский букет Bellaflore",
    category,
    flowerType: category.toLowerCase(),
    tags: searchTerms,
    searchTerms,
    priceRub,
    width: cover?.width ?? 1080,
    height: cover?.height ?? 1350,
    sizes: sizes.length > 0 ? sizes : undefined,
    composition: record.description || "Премиальная сборка и упаковка Bellaflore.",
    care: "Обрежьте стебли под углом, меняйте воду каждые 2 дня.",
    deliveryHint: "Доставка сегодня по Москве и области",
    availability: "В наличии",
    isPopular: record.displayFlags.isBestseller || record.badge === "hit",
    isNew: record.displayFlags.isNew || record.badge === "new",
    badge,
    seoTitle: record.seo.title || record.name,
    seoDescription: record.seo.description || record.description,
    isAdminProduct: true,
    galleryImages: record.images
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((image, index) => ({
        id: image.id,
        src: image.url,
        alt: image.name || `${record.name} — фото ${index + 1}`,
        width: image.width ?? 1080,
        height: image.height ?? 1350,
      })),
  };
}

export function storedBouquetsToLegacyCatalogProducts(
  records: StoredBouquetRecord[],
  categoryStorage: StoredBouquetCategoryStorage,
): CatalogProduct[] {
  return records
    .filter(
      (record) =>
        record.status === "active" &&
        record.displayFlags.showInCatalog &&
        record.basePrice >= 0,
    )
    .sort((left, right) => {
      if (left.displayPriority !== right.displayPriority) {
        return left.displayPriority - right.displayPriority;
      }

      return right.updatedAt.localeCompare(left.updatedAt);
    })
    .map((record) => storedBouquetToLegacyCatalogProduct(record, categoryStorage));
}
