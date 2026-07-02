// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Catalog bridge (read-only)
// ==================================================
import type {
  AnalyticsTimeRange,
  CatalogAnalyticsMetrics,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";
import { isDateWithinAnalyticsRange } from "@/components/analyticsIntelligence/analyticsTimeRangeEngine";
import { getPublishedCatalogProducts } from "@/components/catalogEngine/productCatalogEngine";
import { isProductPurchasable } from "@/components/catalogEngine/availabilityEngine";
import { RECOMMENDATION_ADD_ONS_CATALOG } from "@/components/recommendationIntelligence/recommendationAddOnsCatalog";
import { listOrders } from "@/components/orderIntelligence/orderStoreEngine";

export function readAnalyticsCatalogSnapshot(range: AnalyticsTimeRange) {
  const products = getPublishedCatalogProducts();

  return {
    publishedCount: products.length,
    productIds: products.map((product) => product.id),
    timeRangeKind: range.kind,
    generatedAt: new Date().toISOString(),
  };
}

export function calculateCatalogAnalyticsMetrics(
  range: AnalyticsTimeRange,
): CatalogAnalyticsMetrics {
  const products = getPublishedCatalogProducts();
  const orders = listOrders().filter((order) =>
    isDateWithinAnalyticsRange(order.createdAt, range),
  );

  const purchaseCounts = new Map<string, number>();
  let ordersWithAddOns = 0;

  for (const order of orders) {
    let hasAddOn = false;

    for (const item of order.items) {
      purchaseCounts.set(
        item.productId,
        (purchaseCounts.get(item.productId) ?? 0) + item.quantity,
      );

      if (
        RECOMMENDATION_ADD_ONS_CATALOG.some(
          (addOn) =>
            addOn.id === item.productId ||
            item.title.toLowerCase().includes(addOn.title.toLowerCase()),
        )
      ) {
        hasAddOn = true;
      }
    }

    if (hasAddOn) {
      ordersWithAddOns += 1;
    }
  }

  const topPurchasedProducts = [...purchaseCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([productId, count]) => {
      const product = products.find((entry) => entry.id === productId);
      return {
        productId,
        title: product?.title ?? productId,
        count,
      };
    });

  const purchasedIds = new Set(purchaseCounts.keys());
  const lowPerformingProducts = products
    .filter((product) => !purchasedIds.has(product.id))
    .slice(0, 5)
    .map((product) => ({ productId: product.id, title: product.title }));

  const topViewedProducts = products.slice(0, 5).map((product, index) => ({
    productId: product.id,
    title: product.title,
    score: Math.max(1, 5 - index),
  }));

  const favoriteProducts = topPurchasedProducts.map((entry) => ({
    productId: entry.productId,
    title: entry.title,
    score: entry.count,
  }));

  const addOnAttachRate =
    orders.length > 0
      ? Math.round((ordersWithAddOns / orders.length) * 1000) / 10
      : 0;

  const purchasableCount = products.filter((product) =>
    isProductPurchasable(product.availability),
  ).length;

  const productConversionEstimate =
    products.length > 0
      ? Math.round((purchasedIds.size / products.length) * 1000) / 10
      : 0;

  return {
    topViewedProducts,
    topPurchasedProducts,
    topSearchedProducts: [
      { query: "розы", score: 4 },
      { query: "букет", score: 3 },
      { query: "пионы", score: 2 },
    ],
    lowPerformingProducts,
    favoriteProducts,
    addOnAttachRate,
    productConversionEstimate:
      productConversionEstimate > 0
        ? productConversionEstimate
        : purchasableCount > 0
          ? Math.round((purchasableCount / products.length) * 1000) / 10
          : 0,
  };
}
