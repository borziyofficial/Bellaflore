// ==================================================
// SECTION: SEARCH INTELLIGENCE
// РАЗДЕЛ: Index registry
// ==================================================
import { buildSearchExampleRegistryState } from "@/components/searchIntelligence/searchExamples";
import type {
  SearchIndexEntry,
  SearchResultKind,
  SearchSynonym,
  SearchTypoCorrection,
} from "@/components/searchIntelligence/searchTypes";

export const SEARCH_INDEX_STORAGE_KEY =
  "bellaflore_search_intelligence_index_v1";

export const SEARCH_SYNONYM_STORAGE_KEY =
  "bellaflore_search_intelligence_synonyms_v1";

export const SEARCH_TYPO_STORAGE_KEY =
  "bellaflore_search_intelligence_typos_v1";

let inMemoryIndex: SearchIndexEntry[] | null = null;
let inMemorySynonyms: SearchSynonym[] | null = null;
let inMemoryTypos: SearchTypoCorrection[] | null = null;

function readIndexFromStorage(): SearchIndexEntry[] {
  if (typeof window === "undefined") {
    return inMemoryIndex ?? buildSearchExampleRegistryState().index;
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_INDEX_STORAGE_KEY);
    if (!raw) {
      return inMemoryIndex ?? buildSearchExampleRegistryState().index;
    }

    const parsed = JSON.parse(raw) as SearchIndexEntry[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSearchExampleRegistryState().index;
  } catch {
    return inMemoryIndex ?? buildSearchExampleRegistryState().index;
  }
}

function writeIndexToStorage(entries: SearchIndexEntry[]): void {
  inMemoryIndex = entries;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SEARCH_INDEX_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // In-memory fallback remains active.
  }
}

function readSynonymsFromStorage(): SearchSynonym[] {
  if (typeof window === "undefined") {
    return inMemorySynonyms ?? buildSearchExampleRegistryState().synonyms;
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_SYNONYM_STORAGE_KEY);
    if (!raw) {
      return inMemorySynonyms ?? buildSearchExampleRegistryState().synonyms;
    }

    const parsed = JSON.parse(raw) as SearchSynonym[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSearchExampleRegistryState().synonyms;
  } catch {
    return inMemorySynonyms ?? buildSearchExampleRegistryState().synonyms;
  }
}

function writeSynonymsToStorage(synonyms: SearchSynonym[]): void {
  inMemorySynonyms = synonyms;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SEARCH_SYNONYM_STORAGE_KEY, JSON.stringify(synonyms));
  } catch {
    // In-memory fallback remains active.
  }
}

function readTyposFromStorage(): SearchTypoCorrection[] {
  if (typeof window === "undefined") {
    return inMemoryTypos ?? buildSearchExampleRegistryState().typoCorrections;
  }

  try {
    const raw = window.localStorage.getItem(SEARCH_TYPO_STORAGE_KEY);
    if (!raw) {
      return inMemoryTypos ?? buildSearchExampleRegistryState().typoCorrections;
    }

    const parsed = JSON.parse(raw) as SearchTypoCorrection[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSearchExampleRegistryState().typoCorrections;
  } catch {
    return inMemoryTypos ?? buildSearchExampleRegistryState().typoCorrections;
  }
}

function writeTyposToStorage(typos: SearchTypoCorrection[]): void {
  inMemoryTypos = typos;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SEARCH_TYPO_STORAGE_KEY, JSON.stringify(typos));
  } catch {
    // In-memory fallback remains active.
  }
}

export function normalizeSearchToken(value: string): string {
  return value.trim().toLowerCase();
}

export function listSearchIndexEntries(): SearchIndexEntry[] {
  return readIndexFromStorage();
}

export function listSearchIndexByEntity(entityId: string): SearchIndexEntry[] {
  return readIndexFromStorage().filter((entry) => entry.entityId === entityId);
}

export function listSearchIndexByKind(kind: SearchResultKind): SearchIndexEntry[] {
  return readIndexFromStorage().filter((entry) => entry.entityKind === kind);
}

export function registerSearchIndexEntry(entry: SearchIndexEntry): SearchIndexEntry {
  const entries = readIndexFromStorage();
  const index = entries.findIndex((item) => item.id === entry.id);
  const next =
    index === -1
      ? [...entries, entry]
      : entries.map((item, itemIndex) => (itemIndex === index ? entry : item));

  writeIndexToStorage(next);
  return entry;
}

export function listSearchSynonyms(): SearchSynonym[] {
  return readSynonymsFromStorage();
}

export function resolveSynonymsForTerm(term: string): string[] {
  const normalized = normalizeSearchToken(term);
  const results = new Set<string>([normalized]);

  for (const synonym of readSynonymsFromStorage()) {
    const allTerms = [synonym.term, ...synonym.synonyms].map(normalizeSearchToken);

    if (allTerms.includes(normalized)) {
      for (const item of allTerms) {
        results.add(item);
      }
    }
  }

  return [...results];
}

export function registerSearchSynonym(synonym: SearchSynonym): SearchSynonym {
  const synonyms = readSynonymsFromStorage();
  const index = synonyms.findIndex((item) => item.id === synonym.id);
  const next =
    index === -1
      ? [...synonyms, synonym]
      : synonyms.map((item, itemIndex) => (itemIndex === index ? synonym : item));

  writeSynonymsToStorage(next);
  return synonym;
}

export function listTypoCorrections(): SearchTypoCorrection[] {
  return readTyposFromStorage();
}

export function correctSearchTypo(query: string): {
  corrected: string;
  wasCorrected: boolean;
  confidence: number;
} {
  const normalized = normalizeSearchToken(query);

  for (const typo of readTyposFromStorage()) {
    if (normalizeSearchToken(typo.typo) === normalized) {
      return {
        corrected: typo.correction,
        wasCorrected: true,
        confidence: typo.confidence,
      };
    }
  }

  return {
    corrected: query,
    wasCorrected: false,
    confidence: 1,
  };
}

export function registerTypoCorrection(correction: SearchTypoCorrection): SearchTypoCorrection {
  const typos = readTyposFromStorage();
  const index = typos.findIndex((item) => item.id === correction.id);
  const next =
    index === -1
      ? [...typos, correction]
      : typos.map((item, itemIndex) => (itemIndex === index ? correction : item));

  writeTyposToStorage(next);
  return correction;
}

export function seedSearchIndexRegistry(): SearchIndexEntry[] {
  const seed = buildSearchExampleRegistryState();
  writeIndexToStorage(seed.index);
  writeSynonymsToStorage(seed.synonyms);
  writeTyposToStorage(seed.typoCorrections);
  return listSearchIndexEntries();
}

export function clearSearchIndexRegistry(): void {
  writeIndexToStorage([]);
  writeSynonymsToStorage([]);
  writeTyposToStorage([]);
}

export function matchSearchIndex(
  query: string,
  expandedTerms?: string[],
): Map<string, { score: number; matched: Set<string> }> {
  const terms = expandedTerms ?? [normalizeSearchToken(query)];
  const scoreByEntity = new Map<string, { score: number; matched: Set<string> }>();

  for (const entry of readIndexFromStorage()) {
    const matched = terms.some(
      (term) =>
        entry.normalizedToken.includes(term) || term.includes(entry.normalizedToken),
    );

    if (!matched) {
      continue;
    }

    const existing = scoreByEntity.get(entry.entityId) ?? {
      score: 0,
      matched: new Set<string>(),
    };

    existing.score += entry.weight;
    existing.matched.add(entry.normalizedToken);
    scoreByEntity.set(entry.entityId, existing);
  }

  return scoreByEntity;
}
