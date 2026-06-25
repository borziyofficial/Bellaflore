import type { SmartCatalogGroup } from "@/data/smartCatalog";

export type SearchableBouquet = {
  id: string;
  title: string;
  description: string;
  searchTerms?: string[];
};

type CatalogSearchEntry = {
  groupId: string;
  groupTitle: string;
  label: string;
  query: string;
  normalizedText: string;
  tokens: string[];
  bridgeTokens: string[];
};

const SEARCH_SYNONYMS: Record<string, string[]> = {
  red: ["красн", "red"],
  white: ["бел", "white"],
  pink: ["розов", "pink"],
  rose: ["роз"],
  roses: ["роз"],
  роза: ["роз"],
  розы: ["роз"],
  peony: ["пион"],
  peonies: ["пион"],
  пион: ["пион"],
  пионы: ["пион"],
  hydrangea: ["гортенз"],
  hydrangeas: ["гортенз"],
  гортензия: ["гортенз"],
  гортензии: ["гортенз"],
  basket: ["корзин"],
  корзина: ["корзин"],
  корзины: ["корзин"],
  box: ["короб"],
  boxes: ["короб"],
  коробка: ["короб"],
  коробки: ["короб"],
  bouquet: ["букет"],
  букет: ["букет"],
  букеты: ["букет"],
  mix: ["микс"],
  микс: ["микс"],
  mono: ["моно"],
  tulip: ["тюльпан"],
  tulips: ["тюльпан"],
  тюльпан: ["тюльпан"],
  тюльпаны: ["тюльпан"],
};

const GROUP_BRIDGE_TOKENS: Record<string, string[]> = {
  roses: ["роз"],
  peonies: ["пион"],
  hydrangeas: ["гортенз"],
  tulips: ["тюльпан"],
  mono: ["моно", "букет"],
  mix: ["микс", "букет"],
  baskets: ["корзин"],
  boxes: ["короб"],
  "french-style": ["француз", "стиль"],
  occasions: ["повод"],
  recipients: ["подар"],
  offers: ["акци"],
};

const FLOWER_STEMS: Record<string, string> = {
  роз: "роз",
  пион: "пион",
  гортенз: "гортенз",
  тюльпан: "тюльпан",
};

const FORMAT_STEMS: Record<string, string> = {
  корзин: "корзин",
  короб: "короб",
  микс: "микс",
  моно: "моно",
  букет: "букет",
};

export function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");
}

function tokenize(value: string) {
  return normalizeSearchText(value)
    .split(/[^a-zа-я0-9]+/i)
    .filter((token) => token.length > 0);
}

function uniqueTokens(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function extractStemTokens(text: string) {
  const normalized = normalizeSearchText(text);
  const stems: string[] = [];

  for (const stem of Object.keys(FLOWER_STEMS)) {
    if (normalized.includes(stem)) {
      stems.push(stem);
    }
  }

  for (const stem of Object.keys(FORMAT_STEMS)) {
    if (normalized.includes(stem)) {
      stems.push(stem);
    }
  }

  return stems;
}

export function expandSearchTokens(normalizedQuery: string) {
  const tokens = new Set(tokenize(normalizedQuery));

  if (normalizedQuery.length >= 2) {
    tokens.add(normalizedQuery);
  }

  for (const [key, synonyms] of Object.entries(SEARCH_SYNONYMS)) {
    const normalizedKey = normalizeSearchText(key);
    const matchesQuery =
      normalizedQuery.includes(normalizedKey) ||
      normalizedKey.startsWith(normalizedQuery) ||
      normalizedQuery.startsWith(normalizedKey) ||
      tokens.has(normalizedKey);

    if (matchesQuery) {
      synonyms.forEach((synonym) => tokens.add(synonym));
      tokens.add(normalizedKey);
    }
  }

  extractStemTokens(normalizedQuery).forEach((stem) => tokens.add(stem));

  return [...tokens];
}

function buildBouquetCorpus(bouquet: SearchableBouquet) {
  return normalizeSearchText(
    [
      bouquet.title,
      bouquet.description,
      ...(bouquet.searchTerms ?? []),
    ].join(" "),
  );
}

function buildCatalogEntries(
  smartCatalogGroups: SmartCatalogGroup[],
): CatalogSearchEntry[] {
  return smartCatalogGroups.flatMap((group) =>
    group.sections.flatMap((section) =>
      section.items.map((item) => {
        const normalizedText = normalizeSearchText(
          [group.title, group.description, section.title, item.label, item.query].join(
            " ",
          ),
        );
        const bridgeTokens = uniqueTokens([
          ...(GROUP_BRIDGE_TOKENS[group.id] ?? []),
          ...extractStemTokens(item.label),
          ...extractStemTokens(item.query),
          ...tokenize(item.label),
          ...tokenize(item.query),
        ]);

        return {
          groupId: group.id,
          groupTitle: group.title,
          label: item.label,
          query: item.query,
          normalizedText,
          tokens: tokenize(normalizedText),
          bridgeTokens,
        };
      }),
    ),
  );
}

function catalogEntryMatchesQuery(
  entry: CatalogSearchEntry,
  normalizedQuery: string,
  expandedTokens: string[],
) {
  if (normalizedQuery.length >= 2 && entry.normalizedText.includes(normalizedQuery)) {
    return true;
  }

  return expandedTokens.some((token) => {
    if (token.length < 2) {
      return false;
    }

    if (entry.normalizedText.includes(token)) {
      return true;
    }

    return entry.tokens.some(
      (entryToken) =>
        entryToken.startsWith(token) ||
        token.startsWith(entryToken) ||
        entryToken.includes(token),
    );
  });
}

function getCatalogBridgeTokens(
  smartCatalogGroups: SmartCatalogGroup[],
  normalizedQuery: string,
  expandedTokens: string[],
) {
  const entries = buildCatalogEntries(smartCatalogGroups);

  return uniqueTokens(
    entries
      .filter((entry) =>
        catalogEntryMatchesQuery(entry, normalizedQuery, expandedTokens),
      )
      .flatMap((entry) => [
        ...entry.bridgeTokens,
        ...extractStemTokens(entry.label),
        ...extractStemTokens(entry.query),
      ]),
  );
}

function scoreBouquetMatch(
  bouquet: SearchableBouquet,
  normalizedQuery: string,
  expandedTokens: string[],
  catalogBridgeTokens: string[],
) {
  const corpus = buildBouquetCorpus(bouquet);
  const title = normalizeSearchText(bouquet.title);
  let score = 0;

  if (!normalizedQuery) {
    return 0;
  }

  if (title === normalizedQuery) {
    score += 220;
  } else if (title.startsWith(normalizedQuery)) {
    score += 160;
  } else if (corpus.includes(normalizedQuery)) {
    score += 120;
  }

  for (const token of expandedTokens) {
    if (token.length < 2) {
      continue;
    }

    if (title.includes(token)) {
      score += 70;
    }

    if (corpus.includes(token)) {
      score += 45;
    }

    if (
      tokenize(corpus).some(
        (word) => word.startsWith(token) || word.includes(token),
      )
    ) {
      score += 25;
    }
  }

  for (const bridgeToken of catalogBridgeTokens) {
    if (corpus.includes(bridgeToken)) {
      score += 35;
    }
  }

  return score;
}

export function filterSearchResults<T extends SearchableBouquet>(
  bouquets: T[],
  searchQuery: string,
  smartCatalogGroups: SmartCatalogGroup[],
): T[] {
  const normalizedQuery = normalizeSearchText(searchQuery);

  if (!normalizedQuery) {
    return [];
  }

  const expandedTokens = expandSearchTokens(normalizedQuery);
  const catalogBridgeTokens = getCatalogBridgeTokens(
    smartCatalogGroups,
    normalizedQuery,
    expandedTokens,
  );

  return bouquets
    .map((bouquet) => ({
      bouquet,
      score: scoreBouquetMatch(
        bouquet,
        normalizedQuery,
        expandedTokens,
        catalogBridgeTokens,
      ),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.bouquet.title.localeCompare(right.bouquet.title, "ru-RU");
    })
    .map(({ bouquet }) => bouquet);
}

export function getSearchSuggestions(
  smartCatalogGroups: SmartCatalogGroup[],
  limit = 6,
) {
  const suggestions = new Set<string>();

  for (const group of smartCatalogGroups) {
    suggestions.add(group.title);

    for (const section of group.sections) {
      for (const item of section.items) {
        if (item.status === "live") {
          suggestions.add(item.label);
        }
      }
    }
  }

  return [...suggestions].slice(0, limit);
}
