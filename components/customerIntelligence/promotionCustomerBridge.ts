// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: Promotion bridge (read-only)
// ==================================================
import { getPublishedCatalogProducts } from "@/components/catalogEngine/productCatalogEngine";
import { getCustomerProfile } from "@/components/customerIntelligence/customerProfileEngine";

export function readPromotionCustomerSnapshot(customerId: string) {
  const profile = getCustomerProfile(customerId);
  const products = getPublishedCatalogProducts();

  const preferredCategories = profile?.preferences.favoriteCategories ?? [];
  const matchedProducts = products.filter((product) =>
    preferredCategories.some((category) =>
      product.categoryIds.includes(category),
    ),
  );

  return {
    customerId,
    favoriteProductIds: profile?.favorites.map((item) => item.productId) ?? [],
    promotionCandidates: matchedProducts.slice(0, 5).map((product) => ({
      productId: product.id,
      title: product.title,
      priceRub: product.basePriceRub,
    })),
    generatedAt: new Date().toISOString(),
  };
}

export function buildPromotionCustomerInsight(customerId: string) {
  const snapshot = readPromotionCustomerSnapshot(customerId);

  return {
    promotionReady: snapshot.promotionCandidates.length > 0,
    candidateCount: snapshot.promotionCandidates.length,
  };
}
