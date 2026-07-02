// ==================================================
// SECTION: LOYALTY INTELLIGENCE
// РАЗДЕЛ: Public foundation exports
// ==================================================
export type {
  LoyaltyTierId,
  LoyaltyRewardKind,
  LoyaltyHistoryEntryKind,
  LoyaltyMembershipStatus,
  LoyaltyTier,
  LoyaltyReward,
  LoyaltyCashbackBalance,
  LoyaltyBonusPointsBalance,
  LoyaltyVipMembership,
  LoyaltyReferralReward,
  LoyaltyBirthdayReward,
  LoyaltyPurchaseHistoryEntry,
  LoyaltyHistoryEntry,
  LoyaltyLifetimeValue,
  LoyaltyStatistics,
  LoyaltyAccount,
  LoyaltyIntelligenceSnapshot,
  LoyaltyListFilters,
  LoyaltyRegistryState,
  LoyaltyTierProgress,
  LoyaltyReadOnlySummary,
} from "@/components/loyaltyIntelligence/loyaltyTypes";

export {
  LOYALTY_EXAMPLE_TIERS,
  LOYALTY_EXAMPLE_REWARDS,
  LOYALTY_EXAMPLE_PURCHASE_HISTORY,
  LOYALTY_EXAMPLE_HISTORY,
  LOYALTY_EXAMPLE_REFERRALS,
  LOYALTY_EXAMPLE_ACCOUNTS,
  buildLoyaltyExampleRegistryState,
} from "@/components/loyaltyIntelligence/loyaltyExamples";

export {
  LOYALTY_TIER_STORAGE_KEY,
  listLoyaltyTiers,
  getLoyaltyTierById,
  resolveTierByPoints,
  resolveTierByLifetimeSpend,
  getNextLoyaltyTier,
  buildLoyaltyTierProgress,
  registerLoyaltyTier,
  seedLoyaltyTierRegistry,
  clearLoyaltyTierRegistry,
  LOYALTY_TIER_IDS,
} from "@/components/loyaltyIntelligence/loyaltyTierRegistry";

export {
  LOYALTY_REWARDS_STORAGE_KEY,
  LOYALTY_REFERRALS_STORAGE_KEY,
  listLoyaltyRewards,
  getLoyaltyRewardById,
  listLoyaltyRewardsByKind,
  listActiveLoyaltyRewards,
  listCashbackRewards,
  listBonusPointsRewards,
  listReferralRewards,
  listBirthdayRewards,
  listVipMembershipRewards,
  listLoyaltyReferrals,
  listReferralsByCustomer,
  getReferralByCode,
  registerLoyaltyReward,
  registerLoyaltyReferral,
  seedLoyaltyRewardsRegistry,
  clearLoyaltyRewardsRegistry,
  isVipMembershipActive,
  isBirthdayRewardAvailable,
  resolveRewardStatus,
} from "@/components/loyaltyIntelligence/loyaltyRewardsRegistry";

export {
  LOYALTY_ACCOUNTS_STORAGE_KEY,
  LOYALTY_PURCHASE_HISTORY_STORAGE_KEY,
  LOYALTY_HISTORY_STORAGE_KEY,
  listLoyaltyAccounts,
  getLoyaltyAccountByCustomerId,
  getLoyaltyAccountByPhone,
  listLoyaltyPurchaseHistory,
  listLoyaltyHistoryEntries,
  calculateLoyaltyLifetimeValue,
  calculateLoyaltyStatistics,
  registerLoyaltyAccount,
  seedLoyaltyHistoryRegistry,
  clearLoyaltyHistoryRegistry,
  listAccountsByTier,
  listVipLoyaltyAccounts,
} from "@/components/loyaltyIntelligence/loyaltyHistoryRegistry";

export {
  LOYALTY_INTELLIGENCE_STORAGE_KEY,
  buildLoyaltyIntelligenceSnapshot,
  initializeLoyaltyIntelligence,
  getLoyaltyIntelligenceExample,
  getLoyaltyReadOnlySummary,
  resolveCustomerLoyaltyTier,
  readLoyaltyCustomerInsights,
  listAllLoyaltyFoundationCapabilities,
  LOYALTY_INTELLIGENCE_ENGINE_SCHEMA,
} from "@/components/loyaltyIntelligence/loyaltyEngine";
