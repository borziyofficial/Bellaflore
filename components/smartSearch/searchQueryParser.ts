// ==================================================
// SECTION: SMART SEARCH
// РАЗДЕЛ: Search Query Parser
//
// Purpose (EN): Parse natural-language queries into structured search intent.
//
// Назначение (RU): Разбор запроса клиента в структурированный intent.
// ==================================================
import {
  mergeAdminSynonymDictionary,
  SMART_SEARCH_COLOR_CANONICAL_MAP,
  SMART_SEARCH_FLOWER_CANONICAL_MAP,
  SMART_SEARCH_OCCASION_CANONICAL_MAP,
  SMART_SEARCH_STYLE_CANONICAL_MAP,
  SMART_SEARCH_SYNONYMS,
} from "@/components/smartSearch/searchSynonymsDictionary";
import type {
  ParsedSearchQuery,
  SmartSearchColorId,
  SmartSearchFlowerId,
  SmartSearchIntent,
  SmartSearchOccasionId,
  SmartSearchStyleId,
  SmartSearchSynonymEntry,
} from "@/components/smartSearch/smartSearchTypes";
import { normalizeSearchText } from "@/components/search/searchFoundation";

const PRICE_UNTIL_PATTERN =
  /(?:до|do|under|max|не\s+дороже)\s*(\d[\d\s]{2,6})/i;
const STEM_COUNT_PATTERN = /\b(\d{1,4})\b/;

function normalizeAlias(alias: string): string {
  return normalizeSearchText(alias.replace(/ё/g, "е"));
}

function buildAliasIndex(entries: SmartSearchSynonymEntry[]): Map<string, SmartSearchSynonymEntry> {
  const index = new Map<string, SmartSearchSynonymEntry>();

  for (const entry of entries) {
    for (const alias of entry.aliases) {
      index.set(normalizeAlias(alias), entry);
    }
    index.set(normalizeAlias(entry.canonical), entry);
  }

  return index;
}

function extractMaxPrice(normalizedQuery: string): number | null {
  const match = normalizedQuery.match(PRICE_UNTIL_PATTERN);
  if (!match?.[1]) {
    return null;
  }

  const parsed = Number(match[1].replace(/\s/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function extractStemCount(normalizedQuery: string, hasFlowerMatch: boolean): number | null {
  if (!hasFlowerMatch) {
    return null;
  }

  const matches = normalizedQuery.match(new RegExp(STEM_COUNT_PATTERN, "g"));
  if (!matches || matches.length === 0) {
    return null;
  }

  const counts = matches
    .map((value) => Number(value))
    .filter((value) => value >= 7 && value <= 1001);

  return counts.length > 0 ? Math.max(...counts) : null;
}

function pushUnique<T>(list: T[], value: T): void {
  if (!list.includes(value)) {
    list.push(value);
  }
}

export function parseSearchQuery(
  rawQuery: string,
  synonymEntries: SmartSearchSynonymEntry[] = SMART_SEARCH_SYNONYMS,
): ParsedSearchQuery {
  const normalizedQuery = normalizeSearchText(rawQuery);
  const aliasIndex = buildAliasIndex(synonymEntries);

  const flowers: SmartSearchFlowerId[] = [];
  const colors: SmartSearchColorId[] = [];
  const occasions: SmartSearchOccasionId[] = [];
  const styles: SmartSearchStyleId[] = [];
  const keywords: string[] = [];
  const matchedSynonyms: string[] = [];
  let intent: SmartSearchIntent = null;

  const maxPriceRub = extractMaxPrice(normalizedQuery);

  if (maxPriceRub !== null) {
    intent = "price_shopping";
  }

  for (const [alias, entry] of aliasIndex.entries()) {
    if (alias.length < 2) {
      continue;
    }

    if (!normalizedQuery.includes(alias)) {
      continue;
    }

    matchedSynonyms.push(alias);

    switch (entry.kind) {
      case "flower": {
        const flowerId = SMART_SEARCH_FLOWER_CANONICAL_MAP[entry.canonical];
        if (flowerId) {
          pushUnique(flowers, flowerId);
        }
        break;
      }
      case "color": {
        const colorId = SMART_SEARCH_COLOR_CANONICAL_MAP[entry.canonical];
        if (colorId) {
          pushUnique(colors, colorId);
        }
        break;
      }
      case "occasion": {
        const occasionId = SMART_SEARCH_OCCASION_CANONICAL_MAP[entry.canonical];
        if (occasionId) {
          pushUnique(occasions, occasionId);
        }
        break;
      }
      case "style": {
        const styleId = SMART_SEARCH_STYLE_CANONICAL_MAP[entry.canonical];
        if (styleId) {
          pushUnique(styles, styleId);
        }
        break;
      }
      case "intent":
        intent = "gift";
        break;
      case "keyword":
        keywords.push(entry.canonical);
        break;
      default:
        break;
    }
  }

  if (
    normalizedQuery.includes("мам") ||
    occasions.includes("mother")
  ) {
    pushUnique(occasions, "mother");
    intent = intent ?? "gift";
  }

  if (
    normalizedQuery.includes("нежн") ||
    normalizedQuery.includes("pastel") ||
    normalizedQuery.includes("пастель")
  ) {
    pushUnique(styles, "gentle");
    pushUnique(colors, "soft");
  }

  const stemCount = extractStemCount(normalizedQuery, flowers.length > 0);

  const leftoverTokens = normalizedQuery
    .split(/\s+/)
    .filter((token) => token.length > 1 && !matchedSynonyms.some((syn) => syn.includes(token)));

  for (const token of leftoverTokens) {
    if (!keywords.includes(token)) {
      keywords.push(token);
    }
  }

  return {
    rawQuery,
    normalizedQuery,
    flowers,
    colors,
    occasions,
    styles,
    stemCount,
    minPriceRub: null,
    maxPriceRub,
    intent,
    keywords,
    matchedSynonyms,
  };
}

export function parseSearchQueryWithAdminDictionary(
  rawQuery: string,
  adminSynonyms: SmartSearchSynonymEntry[],
): ParsedSearchQuery {
  return parseSearchQuery(rawQuery, mergeAdminSynonymDictionary(adminSynonyms));
}
