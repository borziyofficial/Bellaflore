// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: History registry (Stage 35 isolated)
// ==================================================
import { buildRecommendationExampleRegistryState } from "@/components/recommendationIntelligence/recommendationExamples";
import type {
  RecommendationAiSuggestion,
  RecommendationHistoryEntry,
  RecommendationKind,
} from "@/components/recommendationIntelligence/recommendationTypes";

export const RECOMMENDATION_HISTORY_STORAGE_KEY =
  "bellaflore_recommendation_intelligence_history_v1";

export const RECOMMENDATION_AI_STORAGE_KEY =
  "bellaflore_recommendation_intelligence_ai_v1";

let inMemoryHistory: RecommendationHistoryEntry[] | null = null;
let inMemoryAi: RecommendationAiSuggestion[] | null = null;

function readHistoryFromStorage(): RecommendationHistoryEntry[] {
  if (typeof window === "undefined") {
    return inMemoryHistory ?? buildRecommendationExampleRegistryState().history;
  }

  try {
    const raw = window.localStorage.getItem(RECOMMENDATION_HISTORY_STORAGE_KEY);
    if (!raw) {
      return inMemoryHistory ?? buildRecommendationExampleRegistryState().history;
    }

    const parsed = JSON.parse(raw) as RecommendationHistoryEntry[];
    return Array.isArray(parsed)
      ? parsed
      : buildRecommendationExampleRegistryState().history;
  } catch {
    return inMemoryHistory ?? buildRecommendationExampleRegistryState().history;
  }
}

function writeHistoryToStorage(entries: RecommendationHistoryEntry[]): void {
  inMemoryHistory = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      RECOMMENDATION_HISTORY_STORAGE_KEY,
      JSON.stringify(entries),
    );
  } catch {
    // In-memory fallback remains active.
  }
}

function readAiFromStorage(): RecommendationAiSuggestion[] {
  if (typeof window === "undefined") {
    return inMemoryAi ?? buildRecommendationExampleRegistryState().aiSuggestions;
  }

  try {
    const raw = window.localStorage.getItem(RECOMMENDATION_AI_STORAGE_KEY);
    if (!raw) {
      return inMemoryAi ?? buildRecommendationExampleRegistryState().aiSuggestions;
    }

    const parsed = JSON.parse(raw) as RecommendationAiSuggestion[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildRecommendationExampleRegistryState().aiSuggestions;
  } catch {
    return inMemoryAi ?? buildRecommendationExampleRegistryState().aiSuggestions;
  }
}

function writeAiToStorage(suggestions: RecommendationAiSuggestion[]): void {
  inMemoryAi = suggestions;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(RECOMMENDATION_AI_STORAGE_KEY, JSON.stringify(suggestions));
  } catch {
    // In-memory fallback remains active.
  }
}

export function listRecommendationHistory(
  customerId?: string,
  sessionId?: string,
): RecommendationHistoryEntry[] {
  return readHistoryFromStorage()
    .filter((entry) => (customerId ? entry.customerId === customerId : true))
    .filter((entry) => (sessionId ? entry.sessionId === sessionId : true))
    .sort(
      (left, right) =>
        new Date(right.viewedAt).getTime() - new Date(left.viewedAt).getTime(),
    );
}

export function listRecentlyViewed(
  sessionId: string,
  limit = 6,
): RecommendationHistoryEntry[] {
  const seen = new Set<string>();

  return listRecommendationHistory(undefined, sessionId)
    .filter((entry) => {
      if (seen.has(entry.productId)) {
        return false;
      }

      seen.add(entry.productId);
      return true;
    })
    .slice(0, limit);
}

export function listRecommendationHistoryByKind(
  kind: RecommendationKind,
): RecommendationHistoryEntry[] {
  return readHistoryFromStorage().filter((entry) => entry.kind === kind);
}

export function listAiRecommendations(): RecommendationAiSuggestion[] {
  return readAiFromStorage();
}

export function listAiRecommendationsByCustomer(
  customerId: string,
): RecommendationAiSuggestion[] {
  return readAiFromStorage().filter((item) => item.customerId === customerId);
}

export function getAiRecommendationById(id: string): RecommendationAiSuggestion | null {
  return readAiFromStorage().find((item) => item.id === id) ?? null;
}

export function appendRecommendationHistoryEntry(
  entry: RecommendationHistoryEntry,
): RecommendationHistoryEntry {
  writeHistoryToStorage([entry, ...readHistoryFromStorage()]);
  return entry;
}

export function registerAiRecommendation(
  suggestion: RecommendationAiSuggestion,
): RecommendationAiSuggestion {
  const items = readAiFromStorage();
  const index = items.findIndex((entry) => entry.id === suggestion.id);
  const next =
    index === -1
      ? [...items, suggestion]
      : items.map((entry, entryIndex) => (entryIndex === index ? suggestion : entry));

  writeAiToStorage(next);
  return suggestion;
}

export function seedRecommendationHistoryRegistry(): RecommendationHistoryEntry[] {
  const seed = buildRecommendationExampleRegistryState();
  writeHistoryToStorage(seed.history);
  writeAiToStorage(seed.aiSuggestions);
  return listRecommendationHistory();
}

export function clearRecommendationHistoryRegistry(): void {
  writeHistoryToStorage([]);
  writeAiToStorage([]);
}

export function getViewedProductIds(sessionId: string): string[] {
  return listRecentlyViewed(sessionId).map((entry) => entry.productId);
}

export function countHistoryClicks(): number {
  return readHistoryFromStorage().filter((entry) => entry.clicked).length;
}

export function countHistoryPurchases(): number {
  return readHistoryFromStorage().filter((entry) => entry.purchased).length;
}
