// ==================================================
// SECTION: FINANCE INTELLIGENCE
// РАЗДЕЛ: Revenue registry
// ==================================================
import { buildFinanceExampleRegistryState } from "@/components/financeIntelligence/financeExamples";
import type {
  DailyRevenueMetric,
  MonthlyRevenueMetric,
  RevenueEntry,
  RevenueKind,
  RevenueListFilters,
} from "@/components/financeIntelligence/financeTypes";

export const FINANCE_REVENUE_STORAGE_KEY =
  "bellaflore_finance_intelligence_revenue_v1";

export const FINANCE_DAILY_REVENUE_STORAGE_KEY =
  "bellaflore_finance_intelligence_daily_revenue_v1";

export const FINANCE_MONTHLY_REVENUE_STORAGE_KEY =
  "bellaflore_finance_intelligence_monthly_revenue_v1";

let inMemoryRevenue: RevenueEntry[] | null = null;
let inMemoryDailyRevenue: DailyRevenueMetric[] | null = null;
let inMemoryMonthlyRevenue: MonthlyRevenueMetric[] | null = null;

function readRevenueFromStorage(): RevenueEntry[] {
  if (typeof window === "undefined") {
    return inMemoryRevenue ?? buildFinanceExampleRegistryState().revenue;
  }

  try {
    const raw = window.localStorage.getItem(FINANCE_REVENUE_STORAGE_KEY);
    if (!raw) {
      return inMemoryRevenue ?? buildFinanceExampleRegistryState().revenue;
    }

    const parsed = JSON.parse(raw) as RevenueEntry[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildFinanceExampleRegistryState().revenue;
  } catch {
    return inMemoryRevenue ?? buildFinanceExampleRegistryState().revenue;
  }
}

function writeRevenueToStorage(entries: RevenueEntry[]): void {
  inMemoryRevenue = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FINANCE_REVENUE_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readDailyRevenueFromStorage(): DailyRevenueMetric[] {
  if (typeof window === "undefined") {
    return inMemoryDailyRevenue ?? buildFinanceExampleRegistryState().dailyRevenue;
  }

  try {
    const raw = window.localStorage.getItem(FINANCE_DAILY_REVENUE_STORAGE_KEY);
    if (!raw) {
      return inMemoryDailyRevenue ?? buildFinanceExampleRegistryState().dailyRevenue;
    }

    const parsed = JSON.parse(raw) as DailyRevenueMetric[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildFinanceExampleRegistryState().dailyRevenue;
  } catch {
    return inMemoryDailyRevenue ?? buildFinanceExampleRegistryState().dailyRevenue;
  }
}

function writeDailyRevenueToStorage(metrics: DailyRevenueMetric[]): void {
  inMemoryDailyRevenue = metrics;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FINANCE_DAILY_REVENUE_STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // In-memory fallback remains active.
  }
}

function readMonthlyRevenueFromStorage(): MonthlyRevenueMetric[] {
  if (typeof window === "undefined") {
    return inMemoryMonthlyRevenue ?? buildFinanceExampleRegistryState().monthlyRevenue;
  }

  try {
    const raw = window.localStorage.getItem(FINANCE_MONTHLY_REVENUE_STORAGE_KEY);
    if (!raw) {
      return inMemoryMonthlyRevenue ?? buildFinanceExampleRegistryState().monthlyRevenue;
    }

    const parsed = JSON.parse(raw) as MonthlyRevenueMetric[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildFinanceExampleRegistryState().monthlyRevenue;
  } catch {
    return inMemoryMonthlyRevenue ?? buildFinanceExampleRegistryState().monthlyRevenue;
  }
}

function writeMonthlyRevenueToStorage(metrics: MonthlyRevenueMetric[]): void {
  inMemoryMonthlyRevenue = metrics;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FINANCE_MONTHLY_REVENUE_STORAGE_KEY, JSON.stringify(metrics));
  } catch {
    // In-memory fallback remains active.
  }
}

function matchesRevenueFilters(entry: RevenueEntry, filters: RevenueListFilters): boolean {
  if (filters.kind && entry.kind !== filters.kind) {
    return false;
  }

  if (filters.orderId && entry.orderId !== filters.orderId) {
    return false;
  }

  if (filters.from && new Date(entry.occurredAt) < new Date(filters.from)) {
    return false;
  }

  if (filters.to && new Date(entry.occurredAt) > new Date(filters.to)) {
    return false;
  }

  return true;
}

export function listRevenueEntries(filters: RevenueListFilters = {}): RevenueEntry[] {
  return readRevenueFromStorage()
    .filter((e) => matchesRevenueFilters(e, filters))
    .sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
}

export function getRevenueById(revenueId: string): RevenueEntry | null {
  return readRevenueFromStorage().find((e) => e.id === revenueId) ?? null;
}

export function getRevenueByOrderId(orderId: string): RevenueEntry[] {
  return listRevenueEntries({ orderId });
}

export function listRevenueByKind(kind: RevenueKind): RevenueEntry[] {
  return listRevenueEntries({ kind });
}

export function calculateTotalRevenue(filters: RevenueListFilters = {}): number {
  return listRevenueEntries(filters).reduce((sum, e) => sum + e.amountRub, 0);
}

export function listDailyRevenue(from?: string, to?: string): DailyRevenueMetric[] {
  return readDailyRevenueFromStorage()
    .filter((m) => {
      if (from && m.date < from) {
        return false;
      }

      if (to && m.date > to) {
        return false;
      }

      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getDailyRevenueByDate(date: string): DailyRevenueMetric | null {
  return readDailyRevenueFromStorage().find((m) => m.date === date) ?? null;
}

export function listMonthlyRevenue(from?: string, to?: string): MonthlyRevenueMetric[] {
  return readMonthlyRevenueFromStorage()
    .filter((m) => {
      if (from && m.month < from) {
        return false;
      }

      if (to && m.month > to) {
        return false;
      }

      return true;
    })
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function getMonthlyRevenueByMonth(month: string): MonthlyRevenueMetric | null {
  return readMonthlyRevenueFromStorage().find((m) => m.month === month) ?? null;
}

export function registerRevenueEntry(entry: RevenueEntry): RevenueEntry {
  const entries = readRevenueFromStorage();
  const index = entries.findIndex((e) => e.id === entry.id);
  const next =
    index === -1
      ? [...entries, entry]
      : entries.map((e, i) => (i === index ? entry : e));

  writeRevenueToStorage(next);
  return entry;
}

export function seedRevenueRegistry(): RevenueEntry[] {
  const seed = buildFinanceExampleRegistryState();
  writeRevenueToStorage(seed.revenue);
  writeDailyRevenueToStorage(seed.dailyRevenue);
  writeMonthlyRevenueToStorage(seed.monthlyRevenue);
  return listRevenueEntries();
}

export function clearRevenueRegistry(): void {
  writeRevenueToStorage([]);
  writeDailyRevenueToStorage([]);
  writeMonthlyRevenueToStorage([]);
}
