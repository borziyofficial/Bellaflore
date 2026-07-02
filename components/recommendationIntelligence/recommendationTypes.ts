// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Foundation types (Stage 35 isolated)
// ==================================================

export type RecommendationKind =
  | "related"
  | "similar"
  | "frequently_bought_together"
  | "personalized"
  | "seasonal"
  | "trending"
  | "best_seller"
  | "recently_viewed"
  | "ai";

export type RecommendationSeason = "spring" | "summer" | "autumn" | "winter";

export type RecommendationAiStatus = "suggestion_only";

export type RecommendationScoreSignal =
  | "popularity"
  | "similarity"
  | "co_purchase"
  | "seasonal"
  | "personal_history"
  | "trending"
  | "margin"
  | "availability";

export type RecommendationProductRef = {
  productId: string;
  title: string;
  categoryIds: string[];
  flowerTypes: string[];
  colors: string[];
  seasons: RecommendationSeason[];
  basePriceRub: number;
  popularityScore: number;
  isFeatured: boolean;
};

export type RecommendationRule = {
  id: string;
  kind: RecommendationKind;
  title: string;
  description: string;
  priority: number;
  maxResults: number;
  minScore: number;
  enabledSignals: RecommendationScoreSignal[];
  productIds: string[];
  categoryIds: string[];
  seasons: RecommendationSeason[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RecommendationScore = {
  productId: string;
  kind: RecommendationKind;
  score: number;
  signals: RecommendationScoreSignal[];
  reason: string;
  calculatedAt: string;
};

export type RecommendationSet = {
  id: string;
  kind: RecommendationKind;
  title: string;
  sourceProductId: string | null;
  customerId: string | null;
  items: RecommendationScore[];
  generatedAt: string;
};

export type RecommendationHistoryEntry = {
  id: string;
  customerId: string | null;
  sessionId: string;
  productId: string;
  kind: RecommendationKind;
  viewedAt: string;
  clicked: boolean;
  purchased: boolean;
};

export type RecommendationAiSuggestion = {
  id: string;
  customerId: string | null;
  productId: string;
  title: string;
  rationale: string;
  confidence: number;
  status: RecommendationAiStatus;
  createdAt: string;
};

export type RecommendationStatistics = {
  totalRules: number;
  activeRules: number;
  totalHistoryEntries: number;
  totalViews: number;
  totalClicks: number;
  clickThroughRate: number;
  topRecommendedProductId: string | null;
  topKind: RecommendationKind | null;
  calculatedAt: string;
};

export type RecommendationIntelligenceSnapshot = {
  rules: RecommendationRule[];
  products: RecommendationProductRef[];
  history: RecommendationHistoryEntry[];
  aiSuggestions: RecommendationAiSuggestion[];
  statistics: RecommendationStatistics;
  generatedAt: string;
};

export type RecommendationListFilters = {
  kind?: RecommendationKind | RecommendationKind[];
  customerId?: string;
  productId?: string;
};

export type RecommendationRegistryState = {
  rules: RecommendationRule[];
  products: RecommendationProductRef[];
  history: RecommendationHistoryEntry[];
  aiSuggestions: RecommendationAiSuggestion[];
};

export type RecommendationReadOnlySummary = {
  ruleCount: number;
  productCount: number;
  historyCount: number;
  aiSuggestionCount: number;
};

export type PersonalizedRecommendationContext = {
  customerId: string;
  favoriteProductIds: string[];
  orderProductIds: string[];
  viewedProductIds: string[];
  preferredCategories: string[];
  season?: RecommendationSeason;
};

export type RecommendationQueryOptions = {
  limit?: number;
  minScore?: number;
  season?: RecommendationSeason;
};
