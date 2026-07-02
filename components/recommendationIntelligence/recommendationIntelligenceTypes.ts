// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Типы
//
// Purpose (EN): Types for Bellaflore recommendation intelligence system.
//
// Назначение (RU): Типы системы рекомендаций Bellaflore.
// ==================================================
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";

export type RecommendationKind =
  | "similar"
  | "premium"
  | "budget"
  | "bought_together"
  | "occasion"
  | "seasonal"
  | "add_ons";

export type RecommendationSeason = "spring" | "summer" | "autumn" | "winter";

export type RecommendationOccasion =
  | "birthday"
  | "wedding"
  | "romantic"
  | "mother"
  | "gift"
  | "vip";

export type RecommendationMatchReasonCode =
  | "color"
  | "flower"
  | "category"
  | "price_band"
  | "style"
  | "season"
  | "occasion"
  | "popularity"
  | "availability"
  | "admin_pinned"
  | "crm_bundle";

export type RecommendationMatchReason = {
  code: RecommendationMatchReasonCode;
  label: string;
  weight: number;
};

export type ScoredProductRecommendation = {
  product: CatalogProductRecord;
  score: number;
  reasons: RecommendationMatchReason[];
  reasonSummary: string;
};

export type RecommendationAddOnItem = {
  id: string;
  title: string;
  description: string;
  priceRub: number;
  emoji: string;
  category: "vase" | "card" | "candle" | "toy" | "sweets" | "balloons" | "decor";
  isActive: boolean;
  sortOrder: number;
  crmSource?: string;
};

export type ScoredAddOnRecommendation = {
  addOn: RecommendationAddOnItem;
  score: number;
  reasons: RecommendationMatchReason[];
  reasonSummary: string;
};

export type RecommendationSet = {
  kind: RecommendationKind;
  title: string;
  emoji: string;
  products: ScoredProductRecommendation[];
  addOns: ScoredAddOnRecommendation[];
  enabled: boolean;
};

export type RecommendationIntelligenceResult = {
  sourceProductId: string;
  occasion: RecommendationOccasion | null;
  season: RecommendationSeason;
  sets: RecommendationSet[];
  generatedAt: string;
};

export type RecommendationAdminRule = {
  enabled: boolean;
  disabledKinds: RecommendationKind[];
  pinnedProductIds: Partial<Record<RecommendationKind, string[]>>;
  excludedProductIds: Partial<Record<RecommendationKind, string[]>>;
  pinnedAddOnIds: string[];
  excludedAddOnIds: string[];
  rulesVersion: string;
  updatedAt: string;
};

export type AiRecommendationHooks = {
  recommendByHistory?: (
    productId: string,
    limit?: number,
  ) => Promise<CatalogProductRecord[]>;
  recommendByFavorites?: (
    productId: string,
    favoriteIds: string[],
    limit?: number,
  ) => Promise<CatalogProductRecord[]>;
  recommendByOrders?: (
    productId: string,
    limit?: number,
  ) => Promise<CatalogProductRecord[]>;
  recommendByAI?: (
    productId: string,
    kind: RecommendationKind,
    limit?: number,
  ) => Promise<CatalogProductRecord[]>;
};

export type RecommendationContext = {
  productId: string;
  occasion?: RecommendationOccasion | null;
  favoriteProductIds?: string[];
  now?: Date;
  limitPerSet?: number;
};
