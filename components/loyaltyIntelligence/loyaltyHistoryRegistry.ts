// ==================================================
// SECTION: LOYALTY INTELLIGENCE
// РАЗДЕЛ: History registry
// ==================================================
import { buildLoyaltyExampleRegistryState } from "@/components/loyaltyIntelligence/loyaltyExamples";
import type {
  LoyaltyAccount,
  LoyaltyHistoryEntry,
  LoyaltyHistoryEntryKind,
  LoyaltyLifetimeValue,
  LoyaltyListFilters,
  LoyaltyPurchaseHistoryEntry,
  LoyaltyStatistics,
  LoyaltyTierId,
} from "@/components/loyaltyIntelligence/loyaltyTypes";

export const LOYALTY_ACCOUNTS_STORAGE_KEY =
  "bellaflore_loyalty_intelligence_accounts_v1";

export const LOYALTY_PURCHASE_HISTORY_STORAGE_KEY =
  "bellaflore_loyalty_intelligence_purchase_history_v1";

export const LOYALTY_HISTORY_STORAGE_KEY =
  "bellaflore_loyalty_intelligence_history_v1";

let inMemoryAccounts: LoyaltyAccount[] | null = null;
let inMemoryPurchaseHistory: LoyaltyPurchaseHistoryEntry[] | null = null;
let inMemoryHistory: LoyaltyHistoryEntry[] | null = null;

function readAccountsFromStorage(): LoyaltyAccount[] {
  if (typeof window === "undefined") {
    return inMemoryAccounts ?? buildLoyaltyExampleRegistryState().accounts;
  }

  try {
    const raw = window.localStorage.getItem(LOYALTY_ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      return inMemoryAccounts ?? buildLoyaltyExampleRegistryState().accounts;
    }

    const parsed = JSON.parse(raw) as LoyaltyAccount[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildLoyaltyExampleRegistryState().accounts;
  } catch {
    return inMemoryAccounts ?? buildLoyaltyExampleRegistryState().accounts;
  }
}

function writeAccountsToStorage(accounts: LoyaltyAccount[]): void {
  inMemoryAccounts = accounts;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LOYALTY_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {
    // In-memory fallback remains active.
  }
}

function readPurchaseHistoryFromStorage(): LoyaltyPurchaseHistoryEntry[] {
  if (typeof window === "undefined") {
    return inMemoryPurchaseHistory ?? buildLoyaltyExampleRegistryState().purchaseHistory;
  }

  try {
    const raw = window.localStorage.getItem(LOYALTY_PURCHASE_HISTORY_STORAGE_KEY);
    if (!raw) {
      return inMemoryPurchaseHistory ?? buildLoyaltyExampleRegistryState().purchaseHistory;
    }

    const parsed = JSON.parse(raw) as LoyaltyPurchaseHistoryEntry[];
    return Array.isArray(parsed)
      ? parsed
      : buildLoyaltyExampleRegistryState().purchaseHistory;
  } catch {
    return inMemoryPurchaseHistory ?? buildLoyaltyExampleRegistryState().purchaseHistory;
  }
}

function writePurchaseHistoryToStorage(
  entries: LoyaltyPurchaseHistoryEntry[],
): void {
  inMemoryPurchaseHistory = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      LOYALTY_PURCHASE_HISTORY_STORAGE_KEY,
      JSON.stringify(entries),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function readHistoryFromStorage(): LoyaltyHistoryEntry[] {
  if (typeof window === "undefined") {
    return inMemoryHistory ?? buildLoyaltyExampleRegistryState().history;
  }

  try {
    const raw = window.localStorage.getItem(LOYALTY_HISTORY_STORAGE_KEY);
    if (!raw) {
      return inMemoryHistory ?? buildLoyaltyExampleRegistryState().history;
    }

    const parsed = JSON.parse(raw) as LoyaltyHistoryEntry[];
    return Array.isArray(parsed) ? parsed : buildLoyaltyExampleRegistryState().history;
  } catch {
    return inMemoryHistory ?? buildLoyaltyExampleRegistryState().history;
  }
}

function writeHistoryToStorage(entries: LoyaltyHistoryEntry[]): void {
  inMemoryHistory = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(LOYALTY_HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function matchesTier(
  account: LoyaltyAccount,
  tierId?: LoyaltyListFilters["tierId"],
): boolean {
  if (!tierId) {
    return true;
  }

  if (Array.isArray(tierId)) {
    return tierId.includes(account.tierId);
  }

  return account.tierId === tierId;
}

function matchesQuery(account: LoyaltyAccount, query?: string): boolean {
  if (!query?.trim()) {
    return true;
  }

  const normalized = query.trim().toLowerCase();

  return (
    account.fullName.toLowerCase().includes(normalized) ||
    normalizePhone(account.phone).includes(normalized.replace(/\D/g, "")) ||
    account.customerId.toLowerCase().includes(normalized)
  );
}

export function listLoyaltyAccounts(
  filters: LoyaltyListFilters = {},
): LoyaltyAccount[] {
  return readAccountsFromStorage()
    .filter((account) => matchesTier(account, filters.tierId))
    .filter((account) => matchesQuery(account, filters.query));
}

export function getLoyaltyAccountByCustomerId(
  customerId: string,
): LoyaltyAccount | null {
  return readAccountsFromStorage().find((account) => account.customerId === customerId) ?? null;
}

export function getLoyaltyAccountByPhone(phone: string): LoyaltyAccount | null {
  const normalized = normalizePhone(phone);
  return (
    readAccountsFromStorage().find(
      (account) => normalizePhone(account.phone) === normalized,
    ) ?? null
  );
}

export function listLoyaltyPurchaseHistory(
  customerId?: string,
): LoyaltyPurchaseHistoryEntry[] {
  const entries = readPurchaseHistoryFromStorage();

  if (!customerId) {
    return entries;
  }

  return entries.filter((entry) => entry.customerId === customerId);
}

export function listLoyaltyHistoryEntries(
  customerId?: string,
  kind?: LoyaltyHistoryEntryKind,
): LoyaltyHistoryEntry[] {
  return readHistoryFromStorage()
    .filter((entry) => (customerId ? entry.customerId === customerId : true))
    .filter((entry) => (kind ? entry.kind === kind : true))
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    );
}

export function calculateLoyaltyLifetimeValue(
  customerId: string,
): LoyaltyLifetimeValue | null {
  const account = getLoyaltyAccountByCustomerId(customerId);
  if (account) {
    return account.lifetimeValue;
  }

  const purchases = listLoyaltyPurchaseHistory(customerId);
  if (purchases.length === 0) {
    return null;
  }

  const totalSpendRub = purchases.reduce((sum, entry) => sum + entry.totalRub, 0);
  const totalOrders = purchases.length;
  const averageOrderValueRub = Math.round(totalSpendRub / totalOrders);

  const sortedDates = purchases
    .map((entry) => entry.purchasedAt)
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime());

  const first = sortedDates[0];
  const last = sortedDates[sortedDates.length - 1];
  const daysSpan = Math.max(
    1,
    Math.round(
      (new Date(last).getTime() - new Date(first).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );

  const ordersPerYear = (totalOrders / daysSpan) * 365;
  const projectedAnnualValueRub = Math.round(ordersPerYear * averageOrderValueRub);

  const loyaltyScore = Math.min(
    100,
    Math.round(totalSpendRub / 3000 + totalOrders * 3),
  );

  const tierId: LoyaltyTierId =
    loyaltyScore >= 90
      ? "diamond"
      : loyaltyScore >= 75
        ? "platinum"
        : loyaltyScore >= 55
          ? "gold"
          : loyaltyScore >= 35
            ? "silver"
            : "bronze";

  return {
    customerId,
    totalSpendRub,
    totalOrders,
    averageOrderValueRub,
    projectedAnnualValueRub,
    loyaltyScore,
    tierId,
    calculatedAt: new Date().toISOString(),
  };
}

export function calculateLoyaltyStatistics(
  customerId: string,
): LoyaltyStatistics | null {
  const account = getLoyaltyAccountByCustomerId(customerId);
  if (account) {
    return account.statistics;
  }

  const purchases = listLoyaltyPurchaseHistory(customerId);
  const history = listLoyaltyHistoryEntries(customerId);

  if (purchases.length === 0 && history.length === 0) {
    return null;
  }

  const sortedPurchases = [...purchases].sort(
    (left, right) =>
      new Date(left.purchasedAt).getTime() - new Date(right.purchasedAt).getTime(),
  );

  const totalPoints = history
    .filter((entry) => entry.pointsDelta !== null && entry.pointsDelta > 0)
    .reduce((sum, entry) => sum + (entry.pointsDelta ?? 0), 0);

  const totalCashbackRub = history
    .filter((entry) => entry.kind === "cashback_earned")
    .reduce((sum, entry) => sum + (entry.amountRub ?? 0), 0);

  return {
    customerId,
    currentTierId: sortedPurchases.at(-1)?.tierAtPurchase ?? "bronze",
    totalPoints,
    totalCashbackRub,
    totalReferrals: history.filter((entry) => entry.kind === "referral_bonus").length,
    birthdayRewardsClaimed: history.filter((entry) => entry.kind === "birthday_bonus")
      .length,
    tierUpgrades: history.filter((entry) => entry.kind === "tier_upgrade").length,
    purchaseCount: purchases.length,
    lastPurchaseAt: sortedPurchases.at(-1)?.purchasedAt ?? null,
    firstPurchaseAt: sortedPurchases[0]?.purchasedAt ?? null,
    repeatPurchaseScore:
      purchases.length >= 3 ? 90 : purchases.length === 2 ? 65 : purchases.length === 1 ? 35 : 0,
    calculatedAt: new Date().toISOString(),
  };
}

export function registerLoyaltyAccount(account: LoyaltyAccount): LoyaltyAccount {
  const accounts = readAccountsFromStorage();
  const index = accounts.findIndex((entry) => entry.customerId === account.customerId);
  const next =
    index === -1
      ? [...accounts, account]
      : accounts.map((entry, entryIndex) => (entryIndex === index ? account : entry));

  writeAccountsToStorage(next);
  return account;
}

export function seedLoyaltyHistoryRegistry(): LoyaltyAccount[] {
  const seed = buildLoyaltyExampleRegistryState();
  writeAccountsToStorage(seed.accounts);
  writePurchaseHistoryToStorage(seed.purchaseHistory);
  writeHistoryToStorage(seed.history);
  return listLoyaltyAccounts();
}

export function clearLoyaltyHistoryRegistry(): void {
  writeAccountsToStorage([]);
  writePurchaseHistoryToStorage([]);
  writeHistoryToStorage([]);
}

export function listAccountsByTier(tierId: LoyaltyTierId): LoyaltyAccount[] {
  return listLoyaltyAccounts({ tierId });
}

export function listVipLoyaltyAccounts(): LoyaltyAccount[] {
  return readAccountsFromStorage().filter(
    (account) => account.vipMembership?.status === "active",
  );
}
