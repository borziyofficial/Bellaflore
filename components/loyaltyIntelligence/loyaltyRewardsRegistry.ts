// ==================================================
// SECTION: LOYALTY INTELLIGENCE
// РАЗДЕЛ: Rewards registry
// ==================================================
import { buildLoyaltyExampleRegistryState } from "@/components/loyaltyIntelligence/loyaltyExamples";
import type {
  LoyaltyBirthdayReward,
  LoyaltyMembershipStatus,
  LoyaltyReferralReward,
  LoyaltyReward,
  LoyaltyRewardKind,
  LoyaltyTierId,
  LoyaltyVipMembership,
} from "@/components/loyaltyIntelligence/loyaltyTypes";

export const LOYALTY_REWARDS_STORAGE_KEY =
  "bellaflore_loyalty_intelligence_rewards_v1";

export const LOYALTY_REFERRALS_STORAGE_KEY =
  "bellaflore_loyalty_intelligence_referrals_v1";

let inMemoryRewards: LoyaltyReward[] | null = null;
let inMemoryReferrals: LoyaltyReferralReward[] | null = null;

function readRewardsFromStorage(): LoyaltyReward[] {
  if (typeof window === "undefined") {
    return inMemoryRewards ?? buildLoyaltyExampleRegistryState().rewards;
  }

  try {
    const raw = window.localStorage.getItem(LOYALTY_REWARDS_STORAGE_KEY);
    if (!raw) {
      return inMemoryRewards ?? buildLoyaltyExampleRegistryState().rewards;
    }

    const parsed = JSON.parse(raw) as LoyaltyReward[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildLoyaltyExampleRegistryState().rewards;
  } catch {
    return inMemoryRewards ?? buildLoyaltyExampleRegistryState().rewards;
  }
}

function writeRewardsToStorage(rewards: LoyaltyReward[]): void {
  inMemoryRewards = rewards;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LOYALTY_REWARDS_STORAGE_KEY, JSON.stringify(rewards));
  } catch {
    // In-memory fallback remains active.
  }
}

function readReferralsFromStorage(): LoyaltyReferralReward[] {
  if (typeof window === "undefined") {
    return inMemoryReferrals ?? buildLoyaltyExampleRegistryState().referrals;
  }

  try {
    const raw = window.localStorage.getItem(LOYALTY_REFERRALS_STORAGE_KEY);
    if (!raw) {
      return inMemoryReferrals ?? buildLoyaltyExampleRegistryState().referrals;
    }

    const parsed = JSON.parse(raw) as LoyaltyReferralReward[];
    return Array.isArray(parsed) ? parsed : buildLoyaltyExampleRegistryState().referrals;
  } catch {
    return inMemoryReferrals ?? buildLoyaltyExampleRegistryState().referrals;
  }
}

function writeReferralsToStorage(referrals: LoyaltyReferralReward[]): void {
  inMemoryReferrals = referrals;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      LOYALTY_REFERRALS_STORAGE_KEY,
      JSON.stringify(referrals),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

export function listLoyaltyRewards(): LoyaltyReward[] {
  return readRewardsFromStorage();
}

export function getLoyaltyRewardById(rewardId: string): LoyaltyReward | null {
  return readRewardsFromStorage().find((reward) => reward.id === rewardId) ?? null;
}

export function listLoyaltyRewardsByKind(kind: LoyaltyRewardKind): LoyaltyReward[] {
  return readRewardsFromStorage().filter((reward) => reward.kind === kind);
}

export function listActiveLoyaltyRewards(
  tierId?: LoyaltyTierId,
  at: Date = new Date(),
): LoyaltyReward[] {
  const timestamp = at.getTime();

  return readRewardsFromStorage()
    .filter((reward) => reward.status === "active")
    .filter((reward) => {
      const starts = new Date(reward.validFrom).getTime();
      const ends = reward.validUntil ? new Date(reward.validUntil).getTime() : null;
      return starts <= timestamp && (ends === null || ends >= timestamp);
    })
    .filter((reward) =>
      tierId ? reward.tierRestrictions.includes(tierId) : true,
    );
}

export function listCashbackRewards(): LoyaltyReward[] {
  return listLoyaltyRewardsByKind("cashback");
}

export function listBonusPointsRewards(): LoyaltyReward[] {
  return listLoyaltyRewardsByKind("bonus_points");
}

export function listReferralRewards(): LoyaltyReward[] {
  return listLoyaltyRewardsByKind("referral");
}

export function listBirthdayRewards(): LoyaltyReward[] {
  return listLoyaltyRewardsByKind("birthday");
}

export function listVipMembershipRewards(): LoyaltyReward[] {
  return listLoyaltyRewardsByKind("vip_membership");
}

export function listLoyaltyReferrals(): LoyaltyReferralReward[] {
  return readReferralsFromStorage();
}

export function listReferralsByCustomer(customerId: string): LoyaltyReferralReward[] {
  return readReferralsFromStorage().filter(
    (referral) => referral.referrerCustomerId === customerId,
  );
}

export function getReferralByCode(code: string): LoyaltyReferralReward | null {
  const normalized = code.trim().toUpperCase();
  return (
    readReferralsFromStorage().find(
      (referral) => referral.referralCode.toUpperCase() === normalized,
    ) ?? null
  );
}

export function registerLoyaltyReward(reward: LoyaltyReward): LoyaltyReward {
  const rewards = readRewardsFromStorage();
  const index = rewards.findIndex((entry) => entry.id === reward.id);
  const next =
    index === -1
      ? [...rewards, reward]
      : rewards.map((entry, entryIndex) => (entryIndex === index ? reward : entry));

  writeRewardsToStorage(next);
  return reward;
}

export function registerLoyaltyReferral(
  referral: LoyaltyReferralReward,
): LoyaltyReferralReward {
  const referrals = readReferralsFromStorage();
  const index = referrals.findIndex((entry) => entry.id === referral.id);
  const next =
    index === -1
      ? [...referrals, referral]
      : referrals.map((entry, entryIndex) => (entryIndex === index ? referral : entry));

  writeReferralsToStorage(next);
  return referral;
}

export function seedLoyaltyRewardsRegistry(): LoyaltyReward[] {
  const seed = buildLoyaltyExampleRegistryState();
  writeRewardsToStorage(seed.rewards);
  writeReferralsToStorage(seed.referrals);
  return listLoyaltyRewards();
}

export function clearLoyaltyRewardsRegistry(): void {
  writeRewardsToStorage([]);
  writeReferralsToStorage([]);
}

export function isVipMembershipActive(
  membership: LoyaltyVipMembership | null,
  at: Date = new Date(),
): boolean {
  if (!membership || membership.status !== "active") {
    return false;
  }

  if (!membership.expiresAt) {
    return true;
  }

  return new Date(membership.expiresAt).getTime() >= at.getTime();
}

export function isBirthdayRewardAvailable(
  reward: LoyaltyBirthdayReward | null,
  month: number,
  at: Date = new Date(),
): boolean {
  if (!reward || reward.status !== "active") {
    return false;
  }

  if (reward.birthMonth !== month) {
    return false;
  }

  if (reward.expiresAt && new Date(reward.expiresAt).getTime() < at.getTime()) {
    return false;
  }

  return true;
}

export function resolveRewardStatus(
  reward: LoyaltyReward,
  at: Date = new Date(),
): LoyaltyMembershipStatus {
  const timestamp = at.getTime();
  const ends = reward.validUntil ? new Date(reward.validUntil).getTime() : null;

  if (ends !== null && ends < timestamp) {
    return "expired";
  }

  const starts = new Date(reward.validFrom).getTime();
  if (starts > timestamp) {
    return "pending";
  }

  return reward.status;
}
