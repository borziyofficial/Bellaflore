// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Main engine
// ==================================================
import { getPublishedCatalogProducts } from "@/components/catalogEngine/productCatalogEngine";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import {
  applyAdminAddOnFilters,
  applyAdminProductFilters,
  isRecommendationKindEnabled,
  readRecommendationAdminRule,
} from "@/components/recommendationIntelligence/recommendationAdminStore";
import { getActiveRecommendationAddOns } from "@/components/recommendationIntelligence/recommendationAddOnsCatalog";
import {
  getAiRecommendationHooks,
  recommendByAI,
  recommendByFavorites,
  recommendByHistory,
  recommendByOrders,
} from "@/components/recommendationIntelligence/aiRecommendationFoundation";
import { findFrequentlyBoughtTogether } from "@/components/recommendationIntelligence/frequentlyBoughtTogetherEngine";
import { findOccasionRecommendations } from "@/components/recommendationIntelligence/occasionRecommendationEngine";
import {
  detectPrimaryOccasion,
  getCurrentSeason,
  rankScoredProducts,
  scoreProductRecommendation,
} from "@/components/recommendationIntelligence/recommendationScoringEngine";
import { findSeasonalRecommendations } from "@/components/recommendationIntelligence/seasonalRecommendationEngine";
import {
  findBudgetAlternative,
  findPremiumUpgrade,
  findSimilarProducts,
} from "@/components/recommendationIntelligence/similarProductsEngine";
import type {
  RecommendationContext,
  RecommendationIntelligenceResult,
  RecommendationKind,
  RecommendationSet,
  ScoredAddOnRecommendation,
  ScoredProductRecommendation,
} from "@/components/recommendationIntelligence/recommendationIntelligenceTypes";

const SET_META: Record<
  RecommendationKind,
  { title: string; emoji: string }
> = {
  similar: { title: "Похожие букеты", emoji: "🌸" },
  bought_together: { title: "Покупают вместе", emoji: "⭐" },
  premium: { title: "Премиальная версия", emoji: "💎" },
  budget: { title: "Более доступный вариант", emoji: "💰" },
  occasion: { title: "Для вашего повода", emoji: "🎁" },
  seasonal: { title: "Сезонный выбор", emoji: "🍂" },
  add_ons: { title: "Добавьте к заказу", emoji: "🎁" },
};

function toScoredFromProducts(
  products: CatalogProductRecord[],
  source: CatalogProductRecord,
): ScoredProductRecommendation[] {
  const season = getCurrentSeason();
  const occasion = detectPrimaryOccasion(source);

  return products.map((product) => {
    const result = scoreProductRecommendation({
      source,
      candidate: product,
      season,
      occasion,
    });

    return {
      product,
      score: result.score,
      reasons: result.reasons,
      reasonSummary: result.reasonSummary,
    };
  });
}

async function mergeAiProducts(
  base: ScoredProductRecommendation[],
  aiProducts: CatalogProductRecord[],
  source: CatalogProductRecord,
): Promise<ScoredProductRecommendation[]> {
  if (aiProducts.length === 0) {
    return base;
  }

  const merged = rankScoredProducts([
    ...toScoredFromProducts(aiProducts, source).map((item) => ({
      ...item,
      score: item.score + 25,
      reasons: [
        ...item.reasons,
        {
          code: "admin_pinned" as const,
          label: "AI recommendation",
          weight: 25,
        },
      ],
    })),
    ...base,
  ]);

  const seen = new Set<string>();
  return merged.filter((item) => {
    if (seen.has(item.product.id)) {
      return false;
    }

    seen.add(item.product.id);
    return true;
  });
}

function applyAdminToProducts(
  kind: RecommendationKind,
  products: ScoredProductRecommendation[],
): ScoredProductRecommendation[] {
  const rule = readRecommendationAdminRule();
  const orderedIds = applyAdminProductFilters(
    rule,
    kind,
    products.map((item) => item.product.id),
  );

  const productMap = new Map(
    products.map((item) => [item.product.id, item]),
  );

  return orderedIds
    .map((id) => productMap.get(id))
    .filter((item): item is ScoredProductRecommendation => item !== undefined);
}

function applyAdminToAddOns(
  addOns: ScoredAddOnRecommendation[],
): ScoredAddOnRecommendation[] {
  const rule = readRecommendationAdminRule();
  const orderedIds = applyAdminAddOnFilters(
    rule,
    addOns.map((item) => item.addOn.id),
  );

  const addOnMap = new Map(addOns.map((item) => [item.addOn.id, item]));

  return orderedIds
    .map((id) => addOnMap.get(id))
    .filter((item): item is ScoredAddOnRecommendation => item !== undefined);
}

function buildAddOnSet(
  source: CatalogProductRecord,
  limit: number,
): RecommendationSet {
  const bundle = findFrequentlyBoughtTogether(source, [], 0, limit);
  const addOns = applyAdminToAddOns(
    rankScoredProducts(
      getActiveRecommendationAddOns().map((addOn) => ({
        addOn,
        score: source.addOnIds.includes(addOn.id) ? 80 : 50 - addOn.sortOrder,
        reasons: [],
        reasonSummary: "",
      })),
    ).slice(0, limit),
  );

  const mergedAddOns =
    addOns.length > 0 ? addOns : applyAdminToAddOns(bundle.addOns);

  return {
    kind: "add_ons",
    title: SET_META.add_ons.title,
    emoji: SET_META.add_ons.emoji,
    products: [],
    addOns: mergedAddOns,
    enabled: true,
  };
}

function buildSet(
  kind: RecommendationKind,
  products: ScoredProductRecommendation[],
  addOns: ScoredAddOnRecommendation[] = [],
): RecommendationSet {
  const rule = readRecommendationAdminRule();
  const meta = SET_META[kind];

  return {
    kind,
    title: meta.title,
    emoji: meta.emoji,
    products: applyAdminToProducts(kind, products),
    addOns: applyAdminToAddOns(addOns),
    enabled: isRecommendationKindEnabled(rule, kind),
  };
}

export async function buildRecommendationIntelligence(
  context: RecommendationContext,
  catalog: CatalogProductRecord[] = getPublishedCatalogProducts(),
): Promise<RecommendationIntelligenceResult> {
  const source = catalog.find((product) => product.id === context.productId);
  const limit = context.limitPerSet ?? 8;
  const season = getCurrentSeason(context.now);
  const occasion =
    context.occasion ?? (source ? detectPrimaryOccasion(source) : null);

  if (!source) {
    return {
      sourceProductId: context.productId,
      occasion,
      season,
      sets: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const similarInput = {
    source,
    catalog,
    season,
    occasion,
    limit,
  };

  let similar = findSimilarProducts(similarInput);
  let premium = findPremiumUpgrade({ ...similarInput, limit: 4 });
  const budget = findBudgetAlternative({ ...similarInput, limit: 4 });
  const bundle = findFrequentlyBoughtTogether(source, catalog, 4, 4);

  if (occasion) {
    const occasionProducts = findOccasionRecommendations(
      source,
      catalog,
      occasion,
      4,
    );
    similar = rankScoredProducts([...occasionProducts, ...similar]).slice(
      0,
      limit,
    );
  }

  const seasonalProducts = findSeasonalRecommendations(
    source,
    catalog,
    season,
    4,
  );
  similar = rankScoredProducts([...seasonalProducts, ...similar]).slice(
    0,
    limit,
  );

  const hooks = getAiRecommendationHooks();
  if (hooks.recommendByHistory) {
    const aiSimilar = await recommendByHistory(source.id, limit);
    similar = await mergeAiProducts(similar, aiSimilar, source);
  }

  if (hooks.recommendByFavorites && context.favoriteProductIds?.length) {
    const aiFavorites = await recommendByFavorites(
      source.id,
      context.favoriteProductIds,
      limit,
    );
    similar = await mergeAiProducts(similar, aiFavorites, source);
  }

  if (hooks.recommendByOrders) {
    const aiOrders = await recommendByOrders(source.id, limit);
    premium = await mergeAiProducts(premium, aiOrders, source);
  }

  if (hooks.recommendByAI) {
    const aiPremium = await recommendByAI(source.id, "premium", 4);
    premium = await mergeAiProducts(premium, aiPremium, source);
  }

  const sets: RecommendationSet[] = [
    buildSet("similar", similar.slice(0, limit)),
    buildSet("bought_together", bundle.products, bundle.addOns),
    buildSet("premium", premium),
    buildSet("budget", budget),
    buildAddOnSet(source, limit),
  ].filter((set) => set.enabled && (set.products.length > 0 || set.addOns.length > 0));

  return {
    sourceProductId: source.id,
    occasion,
    season,
    sets,
    generatedAt: new Date().toISOString(),
  };
}

export function buildRecommendationIntelligenceSync(
  context: RecommendationContext,
  catalog: CatalogProductRecord[] = getPublishedCatalogProducts(),
): RecommendationIntelligenceResult {
  const source = catalog.find((product) => product.id === context.productId);
  const limit = context.limitPerSet ?? 8;
  const season = getCurrentSeason(context.now);
  const occasion =
    context.occasion ?? (source ? detectPrimaryOccasion(source) : null);

  if (!source) {
    return {
      sourceProductId: context.productId,
      occasion,
      season,
      sets: [],
      generatedAt: new Date().toISOString(),
    };
  }

  const similarInput = {
    source,
    catalog,
    season,
    occasion,
    limit,
  };

  let similar = findSimilarProducts(similarInput);
  const premium = findPremiumUpgrade({ ...similarInput, limit: 4 });
  const budget = findBudgetAlternative({ ...similarInput, limit: 4 });
  const bundle = findFrequentlyBoughtTogether(source, catalog, 4, 4);

  if (occasion) {
    const occasionProducts = findOccasionRecommendations(
      source,
      catalog,
      occasion,
      4,
    );
    similar = rankScoredProducts([...occasionProducts, ...similar]).slice(
      0,
      limit,
    );
  }

  const seasonalProducts = findSeasonalRecommendations(
    source,
    catalog,
    season,
    4,
  );
  similar = rankScoredProducts([...seasonalProducts, ...similar]).slice(
    0,
    limit,
  );

  const sets: RecommendationSet[] = [
    buildSet("similar", similar.slice(0, limit)),
    buildSet("bought_together", bundle.products, bundle.addOns),
    buildSet("premium", premium),
    buildSet("budget", budget),
    buildAddOnSet(source, limit),
  ].filter((set) => set.enabled && (set.products.length > 0 || set.addOns.length > 0));

  return {
    sourceProductId: source.id,
    occasion,
    season,
    sets,
    generatedAt: new Date().toISOString(),
  };
}
