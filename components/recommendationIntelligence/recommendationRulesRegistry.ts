// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Rules registry (Stage 35 isolated)
// ==================================================
import {
  buildRecommendationExampleRegistryState,
  RECOMMENDATION_FBT_MAP,
  RECOMMENDATION_RELATED_MAP,
} from "@/components/recommendationIntelligence/recommendationExamples";
import type {
  RecommendationKind,
  RecommendationListFilters,
  RecommendationProductRef,
  RecommendationRule,
  RecommendationScore,
  RecommendationScoreSignal,
  RecommendationSeason,
} from "@/components/recommendationIntelligence/recommendationTypes";

export const RECOMMENDATION_RULES_STORAGE_KEY =
  "bellaflore_recommendation_intelligence_rules_v1";

export const RECOMMENDATION_PRODUCTS_STORAGE_KEY =
  "bellaflore_recommendation_intelligence_products_v1";

let inMemoryRules: RecommendationRule[] | null = null;
let inMemoryProducts: RecommendationProductRef[] | null = null;

function readRulesFromStorage(): RecommendationRule[] {
  if (typeof window === "undefined") {
    return inMemoryRules ?? buildRecommendationExampleRegistryState().rules;
  }

  try {
    const raw = window.localStorage.getItem(RECOMMENDATION_RULES_STORAGE_KEY);
    if (!raw) {
      return inMemoryRules ?? buildRecommendationExampleRegistryState().rules;
    }

    const parsed = JSON.parse(raw) as RecommendationRule[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildRecommendationExampleRegistryState().rules;
  } catch {
    return inMemoryRules ?? buildRecommendationExampleRegistryState().rules;
  }
}

function writeRulesToStorage(rules: RecommendationRule[]): void {
  inMemoryRules = rules;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(RECOMMENDATION_RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch {
    // In-memory fallback remains active.
  }
}

function readProductsFromStorage(): RecommendationProductRef[] {
  if (typeof window === "undefined") {
    return inMemoryProducts ?? buildRecommendationExampleRegistryState().products;
  }

  try {
    const raw = window.localStorage.getItem(RECOMMENDATION_PRODUCTS_STORAGE_KEY);
    if (!raw) {
      return inMemoryProducts ?? buildRecommendationExampleRegistryState().products;
    }

    const parsed = JSON.parse(raw) as RecommendationProductRef[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildRecommendationExampleRegistryState().products;
  } catch {
    return inMemoryProducts ?? buildRecommendationExampleRegistryState().products;
  }
}

function writeProductsToStorage(products: RecommendationProductRef[]): void {
  inMemoryProducts = products;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      RECOMMENDATION_PRODUCTS_STORAGE_KEY,
      JSON.stringify(products),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function matchesKind(
  rule: RecommendationRule,
  kind?: RecommendationListFilters["kind"],
): boolean {
  if (!kind) {
    return true;
  }

  if (Array.isArray(kind)) {
    return kind.includes(rule.kind);
  }

  return rule.kind === kind;
}

function similarityScore(
  source: RecommendationProductRef,
  target: RecommendationProductRef,
): number {
  let score = 0;

  const sharedFlowers = source.flowerTypes.filter((f) => target.flowerTypes.includes(f));
  score += sharedFlowers.length * 20;

  const sharedColors = source.colors.filter((c) => target.colors.includes(c));
  score += sharedColors.length * 10;

  const sharedCategories = source.categoryIds.filter((c) => target.categoryIds.includes(c));
  score += sharedCategories.length * 15;

  const sharedSeasons = source.seasons.filter((s) => target.seasons.includes(s));
  score += sharedSeasons.length * 8;

  return score;
}

function scoreProduct(
  product: RecommendationProductRef,
  kind: RecommendationKind,
  signals: RecommendationScoreSignal[],
  source?: RecommendationProductRef,
  season?: RecommendationSeason,
): RecommendationScore {
  let score = 0;
  const appliedSignals: RecommendationScoreSignal[] = [];
  const reasons: string[] = [];

  if (signals.includes("popularity")) {
    score += Math.round(product.popularityScore * 0.5);
    appliedSignals.push("popularity");
    reasons.push("popularity");
  }

  if (signals.includes("similarity") && source) {
    const sim = similarityScore(source, product);
    score += sim;
    if (sim > 0) {
      appliedSignals.push("similarity");
      reasons.push("similar flowers/colors");
    }
  }

  if (signals.includes("co_purchase") && source) {
    const fbt = RECOMMENDATION_FBT_MAP[source.productId] ?? [];
    if (fbt.includes(product.productId)) {
      score += 35;
      appliedSignals.push("co_purchase");
      reasons.push("frequently bought together");
    }
  }

  if (signals.includes("seasonal") && season) {
    if (product.seasons.includes(season)) {
      score += 25;
      appliedSignals.push("seasonal");
      reasons.push(`seasonal:${season}`);
    }
  }

  if (signals.includes("trending")) {
    score += Math.round(product.popularityScore * 0.3);
    appliedSignals.push("trending");
    reasons.push("trending");
  }

  if (product.isFeatured && signals.includes("popularity")) {
    score += 10;
  }

  return {
    productId: product.productId,
    kind,
    score,
    signals: appliedSignals,
    reason: reasons.join(", ") || kind,
    calculatedAt: new Date().toISOString(),
  };
}

export function listRecommendationRules(
  filters: RecommendationListFilters = {},
): RecommendationRule[] {
  return readRulesFromStorage()
    .filter((rule) => rule.isActive)
    .filter((rule) => matchesKind(rule, filters.kind))
    .sort((left, right) => right.priority - left.priority);
}

export function getRecommendationRuleById(ruleId: string): RecommendationRule | null {
  return readRulesFromStorage().find((rule) => rule.id === ruleId) ?? null;
}

export function listRecommendationProducts(): RecommendationProductRef[] {
  return readProductsFromStorage();
}

export function getRecommendationProduct(
  productId: string,
): RecommendationProductRef | null {
  return readProductsFromStorage().find((p) => p.productId === productId) ?? null;
}

export function getRelatedProducts(productId: string, limit = 4): RecommendationScore[] {
  const source = getRecommendationProduct(productId);
  if (!source) {
    return [];
  }

  const relatedIds = RECOMMENDATION_RELATED_MAP[productId] ?? [];
  const products = readProductsFromStorage().filter(
    (p) => p.productId !== productId,
  );

  const scored = products.map((product) =>
    scoreProduct(product, "related", ["similarity", "popularity", "co_purchase"], source),
  );

  const boosted = scored.map((item) =>
    relatedIds.includes(item.productId)
      ? { ...item, score: item.score + 30, reason: `${item.reason}, related map` }
      : item,
  );

  return boosted.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function getSimilarBouquets(productId: string, limit = 4): RecommendationScore[] {
  const source = getRecommendationProduct(productId);
  if (!source) {
    return [];
  }

  return readProductsFromStorage()
    .filter((p) => p.productId !== productId)
    .map((product) => scoreProduct(product, "similar", ["similarity", "popularity"], source))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getFrequentlyBoughtTogether(
  productId: string,
  limit = 3,
): RecommendationScore[] {
  const source = getRecommendationProduct(productId);
  if (!source) {
    return [];
  }

  const fbtIds = new Set(RECOMMENDATION_FBT_MAP[productId] ?? []);

  return readProductsFromStorage()
    .filter((p) => p.productId !== productId)
    .map((product) => {
      const scored = scoreProduct(
        product,
        "frequently_bought_together",
        ["co_purchase", "popularity"],
        source,
      );
      return fbtIds.has(product.productId)
        ? { ...scored, score: scored.score + 40 }
        : scored;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getTrendingProducts(limit = 8): RecommendationScore[] {
  return readProductsFromStorage()
    .map((product) =>
      scoreProduct(product, "trending", ["trending", "popularity"]),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getBestSellers(limit = 10): RecommendationScore[] {
  return readProductsFromStorage()
    .map((product) => scoreProduct(product, "best_seller", ["popularity"]))
    .filter((item) => item.score >= 60)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function getSeasonalRecommendations(
  season: RecommendationSeason,
  limit = 5,
): RecommendationScore[] {
  return readProductsFromStorage()
    .filter((product) => product.seasons.includes(season))
    .map((product) =>
      scoreProduct(product, "seasonal", ["seasonal", "popularity", "trending"], undefined, season),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function registerRecommendationRule(rule: RecommendationRule): RecommendationRule {
  const rules = readRulesFromStorage();
  const index = rules.findIndex((entry) => entry.id === rule.id);
  const next =
    index === -1
      ? [...rules, rule]
      : rules.map((entry, entryIndex) => (entryIndex === index ? rule : entry));

  writeRulesToStorage(next);
  return rule;
}

export function seedRecommendationRulesRegistry(): RecommendationRule[] {
  const seed = buildRecommendationExampleRegistryState();
  writeRulesToStorage(seed.rules);
  writeProductsToStorage(seed.products);
  return listRecommendationRules();
}

export function clearRecommendationRulesRegistry(): void {
  writeRulesToStorage([]);
  writeProductsToStorage([]);
}

export function calculateRecommendationScore(
  productId: string,
  kind: RecommendationKind,
  sourceProductId?: string,
  season?: RecommendationSeason,
): RecommendationScore | null {
  const product = getRecommendationProduct(productId);
  if (!product) {
    return null;
  }

  const rule = listRecommendationRules({ kind })[0];
  const source = sourceProductId
    ? getRecommendationProduct(sourceProductId) ?? undefined
    : undefined;

  return scoreProduct(
    product,
    kind,
    rule?.enabledSignals ?? ["popularity"],
    source,
    season,
  );
}
