// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: Legacy Catalog Adapter
//
// Purpose (EN): Backward-compatible views for existing storefront catalog UI.
//
// Назначение (RU): Совместимость с текущим UI каталога без изменения контрактов.
// ==================================================
import { PUBLIC_CATALOG_PLACEHOLDER_IMAGE } from "@/components/catalog/publicCatalogMerge";
import { getPublishedCatalogProducts } from "@/components/catalogEngine/productCatalogEngine";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import type { SearchableBouquet } from "@/components/search/searchFoundation";
import type { CatalogProduct } from "@/data/catalogProducts";
import type { ProductSizeOption } from "@/data/productTypes";

export function toLegacySearchableBouquet(
  product: CatalogProductRecord,
): SearchableBouquet {
  return {
    id: product.id,
    title: product.title,
    description: product.shortDescription,
    category: product.metadata.legacyCategory,
    flowerType: product.flowerTypes[0],
    stemCount: product.metadata.stemCount,
    tags: product.tags,
    searchTerms: product.searchTerms,
  };
}

export function toLegacyCatalogProduct(
  product: CatalogProductRecord,
): CatalogProduct {
  const primaryImage =
    product.images.find((image) => image.isPrimary) ?? product.images[0];
  const imageUrl = primaryImage?.url?.trim() || PUBLIC_CATALOG_PLACEHOLDER_IMAGE;

  const sizes: ProductSizeOption[] = product.sizes
    .filter((size) => size.isActive && size.priceRub > 0)
    .map((size) => ({
      label: size.sizeId,
      price: size.priceRub,
    }))
    .sort(
      (left, right) =>
        ["S", "M", "L", "XL"].indexOf(left.label) -
        ["S", "M", "L", "XL"].indexOf(right.label),
    );

  const adminSeo = product.metadata.adminSeoDraft;

  return {
    ...toLegacySearchableBouquet(product),
    src: imageUrl,
    alt: primaryImage?.alt ?? product.seo.openGraph.title ?? product.title,
    priceRub: product.basePriceRub || sizes[0]?.price || 0,
    width: primaryImage?.width ?? 1080,
    height: primaryImage?.height ?? 1350,
    sizes: sizes.length > 0 ? sizes : undefined,
    composition:
      product.metadata.composition?.trim() ||
      product.fullDescription?.trim() ||
      product.shortDescription,
    care: "Обрежьте стебли под углом, меняйте воду каждые 2 дня.",
    deliveryHint: "Доставка сегодня по Москве и области",
    availability: "В наличии",
    isPopular: product.metadata.isBestseller ?? product.popularityScore >= 90,
    isNew: product.isNew,
    badge: product.isFeatured ? "Хит" : undefined,
    slug: adminSeo?.seoSlug ?? product.slug,
    seoTitle: adminSeo?.openGraphTitle ?? product.seo.title,
    seoDescription: adminSeo?.openGraphDescription ?? product.seo.description,
    isAdminProduct: product.metadata.adminCreated === true,
  };
}

/** Legacy-compatible product list for existing storefront imports. */
export function getLegacyCatalogProducts(): CatalogProduct[] {
  return getPublishedCatalogProducts().map(toLegacyCatalogProduct);
}

export function getLegacyCatalogProductById(
  productId: string,
): CatalogProduct | null {
  const products = getLegacyCatalogProducts();
  return products.find((product) => product.id === productId) ?? null;
}
