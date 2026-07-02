// ==================================================
// SECTION: LOYALTY INTELLIGENCE
// РАЗДЕЛ: Tier registry
// ==================================================
import { buildLoyaltyExampleRegistryState } from "@/components/loyaltyIntelligence/loyaltyExamples";
import type {
  LoyaltyTier,
  LoyaltyTierId,
  LoyaltyTierProgress,
} from "@/components/loyaltyIntelligence/loyaltyTypes";

export const LOYALTY_TIER_STORAGE_KEY =
  "bellaflore_loyalty_intelligence_tiers_v1";

let inMemoryTiers: LoyaltyTier[] | null = null;

function readTiersFromStorage(): LoyaltyTier[] {
  if (typeof window === "undefined") {
    return inMemoryTiers ?? buildLoyaltyExampleRegistryState().tiers;
  }

  try {
    const raw = window.localStorage.getItem(LOYALTY_TIER_STORAGE_KEY);
    if (!raw) {
      return inMemoryTiers ?? buildLoyaltyExampleRegistryState().tiers;
    }

    const parsed = JSON.parse(raw) as LoyaltyTier[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildLoyaltyExampleRegistryState().tiers;
  } catch {
    return inMemoryTiers ?? buildLoyaltyExampleRegistryState().tiers;
  }
}

function writeTiersToStorage(tiers: LoyaltyTier[]): void {
  inMemoryTiers = tiers;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LOYALTY_TIER_STORAGE_KEY, JSON.stringify(tiers));
  } catch {
    // In-memory fallback remains active.
  }
}

export function listLoyaltyTiers(): LoyaltyTier[] {
  return readTiersFromStorage().sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getLoyaltyTierById(tierId: LoyaltyTierId): LoyaltyTier | null {
  return readTiersFromStorage().find((tier) => tier.id === tierId) ?? null;
}

export function resolveTierByPoints(points: number): LoyaltyTier {
  const tiers = listLoyaltyTiers();
  let resolved = tiers[0];

  for (const tier of tiers) {
    if (points >= tier.minPoints) {
      resolved = tier;
    }
  }

  return resolved;
}

export function resolveTierByLifetimeSpend(spendRub: number): LoyaltyTier {
  const tiers = listLoyaltyTiers();
  let resolved = tiers[0];

  for (const tier of tiers) {
    if (spendRub >= tier.minLifetimeSpendRub) {
      resolved = tier;
    }
  }

  return resolved;
}

export function getNextLoyaltyTier(
  currentTierId: LoyaltyTierId,
): LoyaltyTier | null {
  const tiers = listLoyaltyTiers();
  const index = tiers.findIndex((tier) => tier.id === currentTierId);

  if (index === -1 || index >= tiers.length - 1) {
    return null;
  }

  return tiers[index + 1];
}

export function buildLoyaltyTierProgress(input: {
  customerId: string;
  currentTierId: LoyaltyTierId;
  availablePoints: number;
  totalSpendRub: number;
}): LoyaltyTierProgress {
  const nextTier = getNextLoyaltyTier(input.currentTierId);

  if (!nextTier) {
    return {
      customerId: input.customerId,
      currentTierId: input.currentTierId,
      nextTierId: null,
      pointsToNextTier: null,
      spendToNextTierRub: null,
      progressPercent: 100,
    };
  }

  const pointsToNextTier = Math.max(0, nextTier.minPoints - input.availablePoints);
  const spendToNextTierRub = Math.max(
    0,
    nextTier.minLifetimeSpendRub - input.totalSpendRub,
  );

  const pointsProgress =
    nextTier.minPoints > 0
      ? Math.min(100, Math.round((input.availablePoints / nextTier.minPoints) * 100))
      : 0;

  const spendProgress =
    nextTier.minLifetimeSpendRub > 0
      ? Math.min(
          100,
          Math.round((input.totalSpendRub / nextTier.minLifetimeSpendRub) * 100),
        )
      : 0;

  return {
    customerId: input.customerId,
    currentTierId: input.currentTierId,
    nextTierId: nextTier.id,
    pointsToNextTier,
    spendToNextTierRub,
    progressPercent: Math.round((pointsProgress + spendProgress) / 2),
  };
}

export function registerLoyaltyTier(tier: LoyaltyTier): LoyaltyTier {
  const tiers = readTiersFromStorage();
  const index = tiers.findIndex((entry) => entry.id === tier.id);
  const next =
    index === -1
      ? [...tiers, tier]
      : tiers.map((entry, entryIndex) => (entryIndex === index ? tier : entry));

  writeTiersToStorage(next);
  return tier;
}

export function seedLoyaltyTierRegistry(): LoyaltyTier[] {
  writeTiersToStorage(buildLoyaltyExampleRegistryState().tiers);
  return listLoyaltyTiers();
}

export function clearLoyaltyTierRegistry(): void {
  writeTiersToStorage([]);
}

export const LOYALTY_TIER_IDS: LoyaltyTierId[] = [
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
];
