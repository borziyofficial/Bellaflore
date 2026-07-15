// ==================================================
// SECTION: Promo banner — Automatic mode (generated from live catalog)
// РАЗДЕЛ: Автоматический режим умного баннера — из каталога товаров
//
// Auto slides are computed on every request from the real, currently
// published catalog — nothing is duplicated or cached into a separate
// "slide" record, so editing a product's price/photo/title instantly
// changes the banner too, and unpublishing a product removes it from the
// banner automatically.
// ==================================================
import { listPublishedCatalogProducts } from "@/lib/catalogDb";
import { storedProductToCatalogRecord } from "@/lib/catalogDb/mappers";
import { buildCategoryTitleMap } from "@/lib/adminCategoriesDb";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import type { PromoBannerAutoSource } from "@/lib/promoBannerDb";

export type ResolvedPromoSlide = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
};

function formatPriceLabel(priceRub: number): string {
  if (!priceRub) {
    return "";
  }
  return `от ${priceRub.toLocaleString("ru-RU")} ₽`;
}

function recordToAutoSlide(record: CatalogProductRecord): ResolvedPromoSlide {
  const primaryImage = record.images.find((image) => image.isPrimary) ?? record.images[0];
  return {
    id: `auto-${record.id}`,
    imageUrl: primaryImage?.url ?? "",
    title: record.title,
    subtitle: formatPriceLabel(record.basePriceRub),
    buttonText: "Смотреть букет",
    buttonLink: `/catalog/${record.slug}`,
  };
}

/**
 * Resolves the live product pool for each auto-source. "Popular" mirrors the
 * same isFeatured-or-bestseller definition the rest of the codebase already
 * uses for the legacy `isPopular` storefront field (see
 * lib/catalogDb/mappers.ts storedProductToLegacyCatalogProduct) so its
 * meaning is consistent everywhere, not a newly invented metric.
 */
export async function getCatalogRecordsForAutoBanner(): Promise<CatalogProductRecord[]> {
  const [products, customCategoryTitleById] = await Promise.all([
    listPublishedCatalogProducts(),
    buildCategoryTitleMap(),
  ]);
  return products.map((product) => storedProductToCatalogRecord(product, customCategoryTitleById));
}

export function filterCatalogRecordsBySource(
  records: CatalogProductRecord[],
  source: PromoBannerAutoSource,
  selectedProductIds: string[],
): CatalogProductRecord[] {
  switch (source) {
    case "featured":
      return records.filter((record) => record.isFeatured);
    case "new":
      return records.filter((record) => record.isNew);
    case "bestsellers":
      return records.filter((record) => Boolean(record.metadata.isBestseller));
    case "popular":
      return records.filter(
        (record) => record.isFeatured || Boolean(record.metadata.isBestseller),
      );
    case "admin_selected": {
      const idSet = new Set(selectedProductIds);
      return records
        .filter((record) => idSet.has(record.id))
        .sort(
          (left, right) =>
            selectedProductIds.indexOf(left.id) - selectedProductIds.indexOf(right.id),
        );
    }
    default:
      return [];
  }
}

export async function resolveAutoPromoSlides(
  source: PromoBannerAutoSource,
  selectedProductIds: string[],
  limit: number,
): Promise<ResolvedPromoSlide[]> {
  const records = await getCatalogRecordsForAutoBanner();
  let pool = filterCatalogRecordsBySource(records, source, selectedProductIds);

  if (source !== "admin_selected") {
    pool = [...pool].sort(
      (left, right) =>
        new Date(right.metadata.updatedAt).getTime() -
        new Date(left.metadata.updatedAt).getTime(),
    );
  }

  return pool.slice(0, Math.max(1, limit)).map(recordToAutoSlide);
}
