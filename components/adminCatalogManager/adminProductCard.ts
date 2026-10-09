import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";

export function isAdminCatalogCard(product: CatalogProductRecord): boolean {
  return product.metadata.listView === "card";
}

export function toAdminProductCard(product: CatalogProductRecord): CatalogProductRecord {
  const primary =
    product.images.find((image) => image.isPrimary) ?? product.images[0] ?? null;

  return {
    ...product,
    shortDescription: "",
    fullDescription: "",
    images: primary ? [{ ...primary, isPrimary: true, sortOrder: 0 }] : [],
    seo: {
      ...product.seo,
      description: "",
      schemaJsonLd: {},
      openGraph: {
        ...product.seo.openGraph,
        description: "",
      },
    },
    searchTerms: product.tags,
    searchIndexText: "",
    metadata: {
      catalogVersion: product.metadata.catalogVersion,
      catalogNumber: product.metadata.catalogNumber,
      createdAt: product.metadata.createdAt,
      updatedAt: product.metadata.updatedAt,
      legacyCategory: product.metadata.legacyCategory,
      oldPriceRub: product.metadata.oldPriceRub,
      isBestseller: product.metadata.isBestseller,
      isPromotion: product.metadata.isPromotion,
      listView: "card",
    },
  };
}

export async function resolveAdminProductForEdit(
  productId: string,
  cached: CatalogProductRecord | null,
  fetchFull: (id: string) => Promise<CatalogProductRecord>,
): Promise<CatalogProductRecord> {
  if (!cached || isAdminCatalogCard(cached)) {
    return fetchFull(productId);
  }

  return cached;
}
