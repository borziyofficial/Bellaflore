import {
  storedProductToCatalogRecord,
  storedProductToLegacyCatalogProduct,
} from "@/lib/catalogDb/mappers";
import { getCatalogProductBySlug } from "@/lib/catalogDb";
import { slugifyCatalogProductTitle } from "@/lib/catalogProductSlug";

export async function resolvePublishedCatalogProduct(slugOrId: string) {
  const normalized = slugOrId.trim();
  if (!normalized) {
    return null;
  }

  let product = await getCatalogProductBySlug(normalized);

  if (!product) {
    const latinSlug = slugifyCatalogProductTitle(normalized);
    if (latinSlug && latinSlug !== normalized) {
      product = await getCatalogProductBySlug(latinSlug);
    }
  }

  if (!product || product.status !== "published") {
    return null;
  }

  return {
    product: storedProductToLegacyCatalogProduct(product),
    record: storedProductToCatalogRecord(product),
    stored: product,
  };
}
