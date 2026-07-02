// ==================================================
// SECTION: LOYALTY INTELLIGENCE
// РАЗДЕЛ: Типы
// ==================================================

export type LoyaltyTierId =
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "diamond";

export type LoyaltyRewardKind =
  | "cashback"
  | "bonus_points"
  | "referral"
  | "birthday"
  | "vip_membership";

export type LoyaltyHistoryEntryKind =
  | "purchase"
  | "cashback_earned"
  | "cashback_redeemed"
  | "points_earned"
  | "points_redeemed"
  | "referral_bonus"
  | "birthday_bonus"
  | "tier_upgrade"
  | "vip_grant";

export type LoyaltyMembershipStatus =
  | "active"
  | "paused"
  | "expired"
  | "pending";

export type LoyaltyTier = {
  id: LoyaltyTierId;
  name: string;
  minPoints: number;
  minLifetimeSpendRub: number;
  cashbackPercent: number;
  bonusPointsMultiplier: number;
  discountPercent: number;
  perks: string[];
  sortOrder: number;
};

export type LoyaltyReward = {
  id: string;
  kind: LoyaltyRewardKind;
  title: string;
  description: string;
  value: number;
  valueUnit: "percent" | "rub" | "points";
  tierRestrictions: LoyaltyTierId[];
  status: LoyaltyMembershipStatus;
  validFrom: string;
  validUntil: string | null;
  metadata: Record<string, string | number | boolean | null>;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyCashbackBalance = {
  customerId: string;
  availableRub: number;
  pendingRub: number;
  lifetimeEarnedRub: number;
  lifetimeRedeemedRub: number;
  updatedAt: string;
};

export type LoyaltyBonusPointsBalance = {
  customerId: string;
  availablePoints: number;
  pendingPoints: number;
  lifetimeEarnedPoints: number;
  lifetimeRedeemedPoints: number;
  updatedAt: string;
};

export type LoyaltyVipMembership = {
  customerId: string;
  tierId: LoyaltyTierId;
  status: LoyaltyMembershipStatus;
  memberSince: string;
  expiresAt: string | null;
  perks: string[];
  updatedAt: string;
};

export type LoyaltyReferralReward = {
  id: string;
  referrerCustomerId: string;
  referredCustomerId: string | null;
  referralCode: string;
  bonusPoints: number;
  bonusRub: number;
  status: "pending" | "completed" | "expired";
  createdAt: string;
  completedAt: string | null;
};

export type LoyaltyBirthdayReward = {
  id: string;
  customerId: string;
  birthMonth: number;
  bonusPoints: number;
  discountPercent: number;
  giftDescription: string | null;
  status: LoyaltyMembershipStatus;
  grantedAt: string | null;
  expiresAt: string | null;
};

export type LoyaltyPurchaseHistoryEntry = {
  id: string;
  customerId: string;
  orderId: string;
  totalRub: number;
  cashbackEarnedRub: number;
  pointsEarned: number;
  tierAtPurchase: LoyaltyTierId;
  purchasedAt: string;
};

export type LoyaltyHistoryEntry = {
  id: string;
  customerId: string;
  kind: LoyaltyHistoryEntryKind;
  title: string;
  amountRub: number | null;
  pointsDelta: number | null;
  relatedOrderId: string | null;
  occurredAt: string;
};

export type LoyaltyLifetimeValue = {
  customerId: string;
  totalSpendRub: number;
  totalOrders: number;
  averageOrderValueRub: number;
  projectedAnnualValueRub: number;
  loyaltyScore: number;
  tierId: LoyaltyTierId;
  calculatedAt: string;
};

export type LoyaltyStatistics = {
  customerId: string;
  currentTierId: LoyaltyTierId;
  totalPoints: number;
  totalCashbackRub: number;
  totalReferrals: number;
  birthdayRewardsClaimed: number;
  tierUpgrades: number;
  purchaseCount: number;
  lastPurchaseAt: string | null;
  firstPurchaseAt: string | null;
  repeatPurchaseScore: number;
  calculatedAt: string;
};

export type LoyaltyAccount = {
  customerId: string;
  fullName: string;
  phone: string;
  tierId: LoyaltyTierId;
  points: LoyaltyBonusPointsBalance;
  cashback: LoyaltyCashbackBalance;
  vipMembership: LoyaltyVipMembership | null;
  birthdayReward: LoyaltyBirthdayReward | null;
  referralCode: string;
  statistics: LoyaltyStatistics;
  lifetimeValue: LoyaltyLifetimeValue;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyIntelligenceSnapshot = {
  tiers: LoyaltyTier[];
  rewards: LoyaltyReward[];
  accounts: LoyaltyAccount[];
  purchaseHistory: LoyaltyPurchaseHistoryEntry[];
  history: LoyaltyHistoryEntry[];
  referrals: LoyaltyReferralReward[];
  generatedAt: string;
};

export type LoyaltyListFilters = {
  tierId?: LoyaltyTierId | LoyaltyTierId[];
  query?: string;
  status?: LoyaltyMembershipStatus;
};

export type LoyaltyRegistryState = {
  tiers: LoyaltyTier[];
  rewards: LoyaltyReward[];
  accounts: LoyaltyAccount[];
  purchaseHistory: LoyaltyPurchaseHistoryEntry[];
  history: LoyaltyHistoryEntry[];
  referrals: LoyaltyReferralReward[];
};

export type LoyaltyTierProgress = {
  customerId: string;
  currentTierId: LoyaltyTierId;
  nextTierId: LoyaltyTierId | null;
  pointsToNextTier: number | null;
  spendToNextTierRub: number | null;
  progressPercent: number;
};

export type LoyaltyReadOnlySummary = {
  customerId: string;
  tierName: string;
  tierId: LoyaltyTierId;
  availablePoints: number;
  availableCashbackRub: number;
  isVip: boolean;
  nextRewardHint: string | null;
};
