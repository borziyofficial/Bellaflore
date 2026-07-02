// ==================================================
// SECTION: PRICING INTELLIGENCE
// РАЗДЕЛ: History registry
// ==================================================
import { buildPricingExampleRegistryState } from "@/components/pricingIntelligence/pricingExamples";
import type {
  PricingHistoryEntry,
  PricingMarginAnalysis,
} from "@/components/pricingIntelligence/pricingTypes";

export const PRICING_HISTORY_STORAGE_KEY =
  "bellaflore_pricing_intelligence_history_v1";

export const PRICING_MARGINS_STORAGE_KEY =
  "bellaflore_pricing_intelligence_margins_v1";

let inMemoryHistory: PricingHistoryEntry[] | null = null;
let inMemoryMargins: PricingMarginAnalysis[] | null = null;

function readHistoryFromStorage(): PricingHistoryEntry[] {
  if (typeof window === "undefined") {
    return inMemoryHistory ?? buildPricingExampleRegistryState().history;
  }

  try {
    const raw = window.localStorage.getItem(PRICING_HISTORY_STORAGE_KEY);
    if (!raw) {
      return inMemoryHistory ?? buildPricingExampleRegistryState().history;
    }

    const parsed = JSON.parse(raw) as PricingHistoryEntry[];
    return Array.isArray(parsed) ? parsed : buildPricingExampleRegistryState().history;
  } catch {
    return inMemoryHistory ?? buildPricingExampleRegistryState().history;
  }
}

function writeHistoryToStorage(entries: PricingHistoryEntry[]): void {
  inMemoryHistory = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PRICING_HISTORY_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readMarginsFromStorage(): PricingMarginAnalysis[] {
  if (typeof window === "undefined") {
    return inMemoryMargins ?? buildPricingExampleRegistryState().margins;
  }

  try {
    const raw = window.localStorage.getItem(PRICING_MARGINS_STORAGE_KEY);
    if (!raw) {
      return inMemoryMargins ?? buildPricingExampleRegistryState().margins;
    }

    const parsed = JSON.parse(raw) as PricingMarginAnalysis[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildPricingExampleRegistryState().margins;
  } catch {
    return inMemoryMargins ?? buildPricingExampleRegistryState().margins;
  }
}

function writeMarginsToStorage(margins: PricingMarginAnalysis[]): void {
  inMemoryMargins = margins;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(PRICING_MARGINS_STORAGE_KEY, JSON.stringify(margins));
  } catch {
    // In-memory fallback remains active.
  }
}

export function listPriceHistory(productId?: string): PricingHistoryEntry[] {
  const entries = readHistoryFromStorage();

  const filtered = productId
    ? entries.filter((entry) => entry.productId === productId)
    : entries;

  return filtered.sort(
    (left, right) =>
      new Date(right.changedAt).getTime() - new Date(left.changedAt).getTime(),
  );
}

export function getLatestPriceForProduct(productId: string): number | null {
  const latest = listPriceHistory(productId)[0];
  return latest?.newPriceRub ?? null;
}

export function listMarginAnalysis(): PricingMarginAnalysis[] {
  return readMarginsFromStorage();
}

export function getMarginAnalysisByProduct(
  productId: string,
): PricingMarginAnalysis | null {
  return readMarginsFromStorage().find((item) => item.productId === productId) ?? null;
}

export function calculateAverageMarginPercent(): number {
  const margins = listMarginAnalysis();
  if (margins.length === 0) {
    return 0;
  }

  const total = margins.reduce((sum, item) => sum + item.marginPercent, 0);
  return Math.round(total / margins.length);
}

export function countPriceChangesSince(since: Date): number {
  const timestamp = since.getTime();
  return readHistoryFromStorage().filter(
    (entry) => new Date(entry.changedAt).getTime() >= timestamp,
  ).length;
}

export function registerPriceHistoryEntry(entry: PricingHistoryEntry): PricingHistoryEntry {
  writeHistoryToStorage([entry, ...readHistoryFromStorage()]);
  return entry;
}

export function registerMarginAnalysis(analysis: PricingMarginAnalysis): PricingMarginAnalysis {
  const margins = readMarginsFromStorage();
  const index = margins.findIndex((entry) => entry.productId === analysis.productId);
  const next =
    index === -1
      ? [...margins, analysis]
      : margins.map((entry, entryIndex) => (entryIndex === index ? analysis : entry));

  writeMarginsToStorage(next);
  return analysis;
}

export function seedPricingHistoryRegistry(): PricingHistoryEntry[] {
  const seed = buildPricingExampleRegistryState();
  writeHistoryToStorage(seed.history);
  writeMarginsToStorage(seed.margins);
  return listPriceHistory();
}

export function clearPricingHistoryRegistry(): void {
  writeHistoryToStorage([]);
  writeMarginsToStorage([]);
}

export function getTopAdjustedProductId(): string | null {
  const counts = new Map<string, number>();

  for (const entry of readHistoryFromStorage()) {
    counts.set(entry.productId, (counts.get(entry.productId) ?? 0) + 1);
  }

  const sorted = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  return sorted[0]?.[0] ?? null;
}
