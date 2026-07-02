// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Statistics (Stage 35 isolated)
// ==================================================
import {
  countHistoryClicks,
  listRecommendationHistory,
} from "@/components/recommendationIntelligence/recommendationHistoryRegistry";
import { listRecommendationRules } from "@/components/recommendationIntelligence/recommendationRulesRegistry";
import type {
  RecommendationKind,
  RecommendationStatistics,
} from "@/components/recommendationIntelligence/recommendationTypes";

export function calculateRecommendationStatistics(): RecommendationStatistics {
  const history = listRecommendationHistory();
  const views = history.length;
  const clicks = countHistoryClicks();

  const productCounts = new Map<string, number>();
  const kindCounts = new Map<RecommendationKind, number>();

  for (const entry of history) {
    productCounts.set(entry.productId, (productCounts.get(entry.productId) ?? 0) + 1);
    kindCounts.set(entry.kind, (kindCounts.get(entry.kind) ?? 0) + 1);
  }

  const topProduct = [...productCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topKind = [...kindCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const rules = listRecommendationRules();

  return {
    totalRules: rules.length,
    activeRules: rules.filter((rule) => rule.isActive).length,
    totalHistoryEntries: views,
    totalViews: views,
    totalClicks: clicks,
    clickThroughRate: views > 0 ? Math.round((clicks / views) * 1000) / 10 : 0,
    topRecommendedProductId: topProduct?.[0] ?? null,
    topKind: topKind?.[0] ?? null,
    calculatedAt: new Date().toISOString(),
  };
}

export function buildRecommendationStatisticsReport() {
  const stats = calculateRecommendationStatistics();

  return {
    ...stats,
    highlights: [
      stats.topRecommendedProductId
        ? `Top product: ${stats.topRecommendedProductId}`
        : "No top product yet",
      stats.topKind ? `Top kind: ${stats.topKind}` : "No top kind yet",
      `CTR: ${stats.clickThroughRate}%`,
      `Active rules: ${stats.activeRules}`,
    ],
  };
}
