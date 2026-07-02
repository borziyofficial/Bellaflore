// ==================================================
// SECTION: LOYALTY INTELLIGENCE
// РАЗДЕЛ: Core engine
// ==================================================
import { buildLoyaltyExampleRegistryState } from "@/components/loyaltyIntelligence/loyaltyExamples";
import {
  calculateLoyaltyLifetimeValue,
  calculateLoyaltyStatistics,
  getLoyaltyAccountByCustomerId,
  getLoyaltyAccountByPhone,
  listLoyaltyAccounts,
  listLoyaltyHistoryEntries,
  listLoyaltyPurchaseHistory,
  listVipLoyaltyAccounts,
  seedLoyaltyHistoryRegistry,
} from "@/components/loyaltyIntelligence/loyaltyHistoryRegistry";
import {
  isBirthdayRewardAvailable,
  isVipMembershipActive,
  listActiveLoyaltyRewards,
  listBirthdayRewards,
  listBonusPointsRewards,
  listCashbackRewards,
  listLoyaltyReferrals,
  listReferralRewards,
  listVipMembershipRewards,
  seedLoyaltyRewardsRegistry,
} from "@/components/loyaltyIntelligence/loyaltyRewardsRegistry";
import {
  buildLoyaltyTierProgress,
  getLoyaltyTierById,
  listLoyaltyTiers,
  resolveTierByLifetimeSpend,
  resolveTierByPoints,
  seedLoyaltyTierRegistry,
} from "@/components/loyaltyIntelligence/loyaltyTierRegistry";
import type {
  LoyaltyIntelligenceSnapshot,
  LoyaltyReadOnlySummary,
  LoyaltyTierId,
} from "@/components/loyaltyIntelligence/loyaltyTypes";

export const LOYALTY_INTELLIGENCE_STORAGE_KEY =
  "bellaflore_loyalty_intelligence_v1";

export function buildLoyaltyIntelligenceSnapshot(
  at: Date = new Date(),
): LoyaltyIntelligenceSnapshot {
  return {
    tiers: listLoyaltyTiers(),
    rewards: listActiveLoyaltyRewards(undefined, at),
    accounts: listLoyaltyAccounts(),
    purchaseHistory: listLoyaltyPurchaseHistory(),
    history: listLoyaltyHistoryEntries(),
    referrals: listLoyaltyReferrals(),
    generatedAt: at.toISOString(),
  };
}

export function initializeLoyaltyIntelligence(): LoyaltyIntelligenceSnapshot {
  seedLoyaltyTierRegistry();
  seedLoyaltyRewardsRegistry();
  seedLoyaltyHistoryRegistry();
  return buildLoyaltyIntelligenceSnapshot();
}

export function getLoyaltyIntelligenceExample() {
  return buildLoyaltyExampleRegistryState().accounts[0];
}

export function getLoyaltyReadOnlySummary(
  customerIdOrPhone: string,
): LoyaltyReadOnlySummary | null {
  const account =
    getLoyaltyAccountByCustomerId(customerIdOrPhone) ??
    getLoyaltyAccountByPhone(customerIdOrPhone);

  if (!account) {
    return null;
  }

  const tier = getLoyaltyTierById(account.tierId);
  const progress = buildLoyaltyTierProgress({
    customerId: account.customerId,
    currentTierId: account.tierId,
    availablePoints: account.points.availablePoints,
    totalSpendRub: account.lifetimeValue.totalSpendRub,
  });

  let nextRewardHint: string | null = null;

  if (isVipMembershipActive(account.vipMembership)) {
    nextRewardHint = "VIP Membership активен";
  } else if (progress.nextTierId) {
    nextRewardHint = `До ${progress.nextTierId}: ${progress.pointsToNextTier} баллов`;
  } else if (isBirthdayRewardAvailable(account.birthdayReward, new Date().getMonth() + 1)) {
    nextRewardHint = "Доступен birthday reward";
  }

  return {
    customerId: account.customerId,
    tierName: tier?.name ?? account.tierId,
    tierId: account.tierId,
    availablePoints: account.points.availablePoints,
    availableCashbackRub: account.cashback.availableRub,
    isVip: isVipMembershipActive(account.vipMembership),
    nextRewardHint,
  };
}

export function resolveCustomerLoyaltyTier(input: {
  points: number;
  lifetimeSpendRub: number;
}): LoyaltyTierId {
  const byPoints = resolveTierByPoints(input.points);
  const bySpend = resolveTierByLifetimeSpend(input.lifetimeSpendRub);

  return byPoints.sortOrder >= bySpend.sortOrder ? byPoints.id : bySpend.id;
}

export function readLoyaltyCustomerInsights(customerId: string) {
  const account = getLoyaltyAccountByCustomerId(customerId);
  const statistics = calculateLoyaltyStatistics(customerId);
  const lifetimeValue = calculateLoyaltyLifetimeValue(customerId);
  const purchaseHistory = listLoyaltyPurchaseHistory(customerId);
  const history = listLoyaltyHistoryEntries(customerId);

  return {
    customerId,
    account,
    statistics,
    lifetimeValue,
    purchaseHistory,
    history,
    tierProgress: account
      ? buildLoyaltyTierProgress({
          customerId,
          currentTierId: account.tierId,
          availablePoints: account.points.availablePoints,
          totalSpendRub: account.lifetimeValue.totalSpendRub,
        })
      : null,
    generatedAt: new Date().toISOString(),
  };
}

export function listAllLoyaltyFoundationCapabilities() {
  return {
    tiers: listLoyaltyTiers(),
    bronze: getLoyaltyTierById("bronze"),
    silver: getLoyaltyTierById("silver"),
    gold: getLoyaltyTierById("gold"),
    platinum: getLoyaltyTierById("platinum"),
    diamond: getLoyaltyTierById("diamond"),
    cashback: listCashbackRewards(),
    bonusPoints: listBonusPointsRewards(),
    referralRewards: listReferralRewards(),
    birthdayRewards: listBirthdayRewards(),
    vipMembership: listVipMembershipRewards(),
    purchaseHistory: listLoyaltyPurchaseHistory(),
    lifetimeValue: listLoyaltyAccounts().map((account) => account.lifetimeValue),
    statistics: listLoyaltyAccounts().map((account) => account.statistics),
    vipAccounts: listVipLoyaltyAccounts(),
    referrals: listLoyaltyReferrals(),
  };
}

export const LOYALTY_INTELLIGENCE_ENGINE_SCHEMA = {
  module: "loyaltyIntelligence",
  storageKeys: [
    LOYALTY_INTELLIGENCE_STORAGE_KEY,
    "bellaflore_loyalty_intelligence_tiers_v1",
    "bellaflore_loyalty_intelligence_rewards_v1",
    "bellaflore_loyalty_intelligence_referrals_v1",
    "bellaflore_loyalty_intelligence_accounts_v1",
    "bellaflore_loyalty_intelligence_purchase_history_v1",
    "bellaflore_loyalty_intelligence_history_v1",
  ],
  capabilities: [
    "bronze",
    "silver",
    "gold",
    "platinum",
    "diamond",
    "cashback",
    "bonus_points",
    "referral_rewards",
    "birthday_rewards",
    "vip_membership",
    "purchase_history",
    "customer_lifetime_value",
    "loyalty_statistics",
  ],
  layers: [
    { id: "types", file: "loyaltyTypes.ts" },
    { id: "examples", file: "loyaltyExamples.ts" },
    {
      id: "registries",
      files: [
        "loyaltyTierRegistry.ts",
        "loyaltyRewardsRegistry.ts",
        "loyaltyHistoryRegistry.ts",
      ],
    },
    { id: "engine", file: "loyaltyEngine.ts" },
    { id: "foundation", file: "loyaltyIntelligenceFoundation.ts" },
  ],
  mode: "isolated_foundation",
  wired: false,
} as const;
