// ==================================================
// SECTION: SMART SEARCH
// РАЗДЕЛ: AI Search Foundation
//
// Purpose (EN): Future hooks for OpenAI, local models, admin dictionary.
//
// Назначение (RU): Hooks для будущего AI Search без внешнего API сейчас.
// ==================================================
import type {
  AiSearchProvider,
  SmartSearchSynonymEntry,
} from "@/components/smartSearch/smartSearchTypes";

let activeAiSearchProvider: AiSearchProvider | null = null;
let adminSynonymOverrides: SmartSearchSynonymEntry[] = [];

export function registerAiSearchProvider(provider: AiSearchProvider): void {
  activeAiSearchProvider = provider;
}

export function getAiSearchProvider(): AiSearchProvider | null {
  return activeAiSearchProvider;
}

export function clearAiSearchProvider(): void {
  activeAiSearchProvider = null;
}

export function setAdminSearchSynonymDictionary(
  entries: SmartSearchSynonymEntry[],
): void {
  adminSynonymOverrides = entries;
}

export function getAdminSearchSynonymDictionary(): SmartSearchSynonymEntry[] {
  return adminSynonymOverrides;
}

export const AI_SEARCH_INTEGRATION_SLOTS = [
  {
    id: "openai" as const,
    label: "OpenAI semantic search",
    status: "ready_for_integration" as const,
  },
  {
    id: "local_model" as const,
    label: "On-premise embedding model",
    status: "ready_for_integration" as const,
  },
  {
    id: "admin_dictionary" as const,
    label: "Admin-trained synonym dictionary",
    status: "ready_for_integration" as const,
  },
];

export const SMART_SEARCH_ADMIN_STORAGE_KEY =
  "bellaflore_smart_search_admin_v1";

export function readAdminSearchSynonymsFromStorage(): SmartSearchSynonymEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SMART_SEARCH_ADMIN_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SmartSearchSynonymEntry[]) : [];
  } catch {
    return [];
  }
}

export function writeAdminSearchSynonymsToStorage(
  entries: SmartSearchSynonymEntry[],
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      SMART_SEARCH_ADMIN_STORAGE_KEY,
      JSON.stringify(entries),
    );
    adminSynonymOverrides = entries;
  } catch {
    // Optional admin storage.
  }
}
