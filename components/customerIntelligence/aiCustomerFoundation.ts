// ==================================================
// SECTION: CUSTOMER INTELLIGENCE
// РАЗДЕЛ: AI hooks foundation
// ==================================================
import { readPromotionCustomerSnapshot } from "@/components/customerIntelligence/promotionCustomerBridge";
import { calculateCustomerRiskScore } from "@/components/customerIntelligence/customerRiskEngine";
import { detectCustomerSegment } from "@/components/customerIntelligence/customerSegmentEngine";
import { getSegmentLabel } from "@/components/customerIntelligence/customerSegmentEngine";
import type {
  AiCustomerHooks,
  CustomerOccasion,
  CustomerProfile,
  CustomerRiskScore,
} from "@/components/customerIntelligence/customerIntelligenceTypes";

let aiCustomerHooks: AiCustomerHooks = {};

export function registerAiCustomerHooks(hooks: AiCustomerHooks): AiCustomerHooks {
  aiCustomerHooks = { ...aiCustomerHooks, ...hooks };
  return aiCustomerHooks;
}

export function getAiCustomerHooks(): AiCustomerHooks {
  return aiCustomerHooks;
}

export function clearAiCustomerHooks(): void {
  aiCustomerHooks = {};
}

function localSuggestNextPurchase(profile: CustomerProfile) {
  const snapshot = readPromotionCustomerSnapshot(profile.id);
  const productIds = snapshot.promotionCandidates.map((item) => item.productId);

  if (productIds.length === 0 && profile.favorites.length > 0) {
    return {
      productIds: profile.favorites.slice(0, 3).map((item) => item.productId),
      rationale: "На основе избранного клиента",
    };
  }

  return {
    productIds,
    rationale: "На основе предпочитаемых категорий и каталога",
  };
}

function localDetectVIPCustomer(profile: CustomerProfile): boolean {
  return (
    profile.vipLevel >= 2 ||
    profile.segment === "vip_customer" ||
    profile.lifetimeValue.tier === "gold" ||
    profile.lifetimeValue.tier === "platinum"
  );
}

function localRecommendBouquetForCustomer(profile: CustomerProfile) {
  const snapshot = readPromotionCustomerSnapshot(profile.id);
  const productIds = snapshot.promotionCandidates.map((item) => item.productId);

  if (productIds.length === 0) {
    return null;
  }

  const flowers = profile.preferences.favoriteFlowers.join(", ") || "классика";
  return {
    productIds: productIds.slice(0, 2),
    reason: `Подбор по любимым цветам: ${flowers}`,
  };
}

function localDetectImportantDate(profile: CustomerProfile): CustomerOccasion | null {
  const now = new Date();
  const upcoming = profile.occasions
    .map((occasion) => ({
      occasion,
      daysUntil: Math.ceil(
        (new Date(occasion.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    }))
    .filter((item) => item.daysUntil >= 0 && item.daysUntil <= 30)
    .sort((left, right) => left.daysUntil - right.daysUntil);

  return upcoming[0]?.occasion ?? null;
}

function localSummarizeCustomerProfile(profile: CustomerProfile) {
  const segmentLabel = getSegmentLabel(profile.segment);

  return {
    summary: `${profile.fullName} — ${segmentLabel}, ${profile.statistics.totalOrders} заказов, LTV ${profile.lifetimeValue.score}`,
    highlights: [
      `Сегмент: ${segmentLabel}`,
      `VIP level: ${profile.vipLevel}`,
      `Risk: ${profile.riskScore.level}`,
      profile.statistics.lastOrderDate
        ? `Последний заказ: ${profile.statistics.lastOrderDate}`
        : "Заказов пока нет",
    ],
  };
}

function localSuggestCustomerRetentionAction(profile: CustomerProfile) {
  if (profile.segment === "at_risk_customer" || profile.riskScore.level === "high") {
    return {
      action: "personal_outreach",
      rationale: "Клиент в зоне риска — персональное предложение или звонок",
    };
  }

  if (profile.segment === "inactive_customer") {
    return {
      action: "reactivation_campaign",
      rationale: "Долго не заказывал — отправить reactivation offer",
    };
  }

  if (profile.segment === "vip_customer") {
    return {
      action: "vip_exclusive_offer",
      rationale: "VIP-клиент — эксклюзивное предложение или ранний доступ",
    };
  }

  return {
    action: "standard_loyalty_nudge",
    rationale: "Стандартное поощрение повторной покупки",
  };
}

export async function suggestNextPurchase(profile: CustomerProfile) {
  return (
    aiCustomerHooks.suggestNextPurchase?.(profile) ??
    localSuggestNextPurchase(profile)
  );
}

export async function detectVIPCustomer(profile: CustomerProfile): Promise<boolean> {
  return aiCustomerHooks.detectVIPCustomer?.(profile) ?? localDetectVIPCustomer(profile);
}

export async function detectCustomerRisk(
  profile: CustomerProfile,
): Promise<CustomerRiskScore> {
  return (
    aiCustomerHooks.detectCustomerRisk?.(profile) ??
    calculateCustomerRiskScore(profile)
  );
}

export async function recommendBouquetForCustomer(profile: CustomerProfile) {
  return (
    aiCustomerHooks.recommendBouquetForCustomer?.(profile) ??
    localRecommendBouquetForCustomer(profile)
  );
}

export async function detectImportantDate(
  profile: CustomerProfile,
): Promise<CustomerOccasion | null> {
  return aiCustomerHooks.detectImportantDate?.(profile) ?? localDetectImportantDate(profile);
}

export async function summarizeCustomerProfile(profile: CustomerProfile) {
  return (
    aiCustomerHooks.summarizeCustomerProfile?.(profile) ??
    localSummarizeCustomerProfile(profile)
  );
}

export async function suggestCustomerRetentionAction(profile: CustomerProfile) {
  return (
    aiCustomerHooks.suggestCustomerRetentionAction?.(profile) ??
    localSuggestCustomerRetentionAction(profile)
  );
}

export const AI_CUSTOMER_INTEGRATION_SLOTS = [
  {
    id: "suggestNextPurchase",
    label: "Suggest next purchase",
    status: "ready_for_integration" as const,
  },
  {
    id: "detectVIPCustomer",
    label: "Detect VIP customer",
    status: "ready_for_integration" as const,
  },
  {
    id: "detectCustomerRisk",
    label: "Detect customer risk",
    status: "ready_for_integration" as const,
  },
  {
    id: "recommendBouquetForCustomer",
    label: "Recommend bouquet for customer",
    status: "ready_for_integration" as const,
  },
  {
    id: "detectImportantDate",
    label: "Detect important date",
    status: "ready_for_integration" as const,
  },
  {
    id: "summarizeCustomerProfile",
    label: "Summarize customer profile",
    status: "ready_for_integration" as const,
  },
  {
    id: "suggestCustomerRetentionAction",
    label: "Suggest customer retention action",
    status: "ready_for_integration" as const,
  },
] as const;

export function buildAiCustomerContext(profile: CustomerProfile) {
  return {
    customerId: profile.id,
    segment: detectCustomerSegment(profile),
    vipLevel: profile.vipLevel,
    statistics: profile.statistics,
    lifetimeValue: profile.lifetimeValue,
    riskScore: profile.riskScore,
    preferences: profile.preferences,
    occasionCount: profile.occasions.length,
    favoriteCount: profile.favorites.length,
    generatedAt: new Date().toISOString(),
  };
}
