// ==================================================
// SECTION: SEARCH
// РАЗДЕЛ: Поиск
//
// Purpose (EN): Catalog and site search foundation, indexing, and query helpers.
//
// Назначение (RU): Основа поиска по каталогу и сайту, индексация и запросы.
// ==================================================
import {
  catalogPremiumMenu,
  catalogQuantities,
  getVisibleCatalogItems,
  getVisibleCatalogMenu,
  type CatalogMenuItem,
} from "@/components/catalog/catalogConfig";
import type { SmartCatalogGroup } from "@/data/smartCatalog";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type SearchableBouquet = {
  id: string;
  title: string;
  description: string;
  category?: string;
  flowerType?: string;
  stemCount?: number;
  tags?: string[];
  searchTerms?: string[];
};

export type FlowerKeywordGroup = {
  id: string;
  stems: string[];
  aliases: string[];
};

/** Russian + English flower aliases for local smart search. */
export const FLOWER_KEYWORD_GROUPS: FlowerKeywordGroup[] = [
  {
    id: "hydrangeas",
    stems: ["гортенз"],
    aliases: [
      "гортензия",
      "гортензии",
      "гортензий",
      "hydrangea",
      "hydrangeas",
    ],
  },
  {
    id: "roses",
    stems: ["роз"],
    aliases: ["роза", "розы", "роз", "rose", "roses"],
  },
  {
    id: "peonies",
    stems: ["пион"],
    aliases: ["пион", "пионы", "пионов", "peony", "peonies"],
  },
  {
    id: "tulips",
    stems: ["тюльпан"],
    aliases: ["тюльпан", "тюльпаны", "тюльпанов", "tulip", "tulips"],
  },
];

export type CatalogCategorySearchResult = {
  id: string;
  menuItemId: string;
  parentId?: string;
  icon?: string;
  title: string;
  subtitle: string;
  query: string;
  score: number;
};

export type CatalogSearchResponse<T extends SearchableBouquet> = {
  products: T[];
  categories: CatalogCategorySearchResult[];
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


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const ROSE_QUANTITIES = [
  9, 11, 13, 15, 19, 29, 33, 51, 77, 101, 151, 201, 301, 501, 1001,
] as const;

const SEARCH_SYNONYMS: Record<string, string[]> = {
  red: ["красн", "red"],
  white: ["бел", "white"],
  pink: ["розов", "pink"],
  rose: ["роз"],
  roses: ["роз"],
  роза: ["роз"],
  розы: ["роз"],
  роз: ["роз"],
  "красная роза": ["красн", "роз"],
  "красные розы": ["красн", "роз"],
  "белая роза": ["бел", "роз"],
  "белые розы": ["бел", "роз"],
  "кустовые розы": ["кустов", "роз"],
  "пионовидные розы": ["пионовид", "роз"],
  peony: ["пион"],
  peonies: ["пион"],
  пион: ["пион"],
  пионы: ["пион"],
  пионов: ["пион"],
  hydrangea: ["гортенз"],
  hydrangeas: ["гортенз"],
  гортензия: ["гортенз"],
  гортензии: ["гортенз"],
  гортензий: ["гортенз"],
  eustoma: ["эустом"],
  эустома: ["эустом"],
  эустомы: ["эустом"],
  daisy: ["ромаш"],
  daisies: ["ромаш"],
  ромашка: ["ромаш"],
  ромашки: ["ромаш"],
  lily: ["лили"],
  lilies: ["лили"],
  лилия: ["лили"],
  лилии: ["лили"],
  calla: ["калл"],
  callas: ["калл"],
  калла: ["калл"],
  каллы: ["калл"],
  chrysanthemum: ["хризант"],
  chrysanthemums: ["хризант"],
  хризантема: ["хризант"],
  хризантемы: ["хризант"],
  carnation: ["гвозд"],
  carnations: ["гвозд"],
  гвоздика: ["гвозд"],
  гвоздики: ["гвозд"],
  orchid: ["орхид"],
  orchids: ["орхид"],
  орхидея: ["орхид"],
  орхидеи: ["орхид"],
  alstroemeria: ["альстром"],
  альстромерия: ["альстром"],
  альстромерии: ["альстром"],
  mattiola: ["маттиол"],
  маттиола: ["маттиол"],
  "lily of the valley": ["ландыш"],
  ландыш: ["ландыш"],
  ландыши: ["ландыш"],
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
  "микс-букет": ["микс", "букет"],
  mono: ["моно"],
  монобукет: ["моно", "букет"],
  "моно-букет": ["моно", "букет"],
  composition: ["композиц"],
  композиция: ["композиц"],
  композиции: ["композиц"],
  tulip: ["тюльпан"],
  tulips: ["тюльпан"],
  тюльпан: ["тюльпан"],
  тюльпаны: ["тюльпан"],
  тюльпанов: ["тюльпан"],
  vip: ["vip"],
  premium: ["premium", "премиум"],
  luxury: ["luxury"],
  collection: ["collection", "коллекц"],
  "день рождения": ["день", "рожден"],
  birthday: ["день", "рожден"],
  любимой: ["любим"],
  любимая: ["любим"],
  маме: ["мам"],
  мама: ["мам"],
  благодарность: ["благодар", "спасибо"],
  спасибо: ["благодар", "спасибо"],
  извинения: ["извин"],
  извинение: ["извин"],
  новорожденному: ["новорожден", "роддом"],
  юбилей: ["юбил"],
  выпускной: ["выпуск"],
  свадьба: ["свад"],
  wedding: ["свад"],
};

const GROUP_BRIDGE_TOKENS: Record<string, string[]> = {
  roses: ["роз"],
  peonies: ["пион"],
  hydrangeas: ["гортенз"],
  tulips: ["тюльпан"],
  eustoma: ["эустом"],
  daisies: ["ромаш"],
  lilies: ["лили"],
  callas: ["калл"],
  chrysanthemums: ["хризант"],
  carnations: ["гвозд"],
  orchids: ["орхид"],
  alstroemeria: ["альстром"],
  mattiola: ["маттиол"],
  "lily-of-valley": ["ландыш"],
  mono: ["моно", "букет"],
  mix: ["микс", "букет"],
  baskets: ["корзин"],
  boxes: ["короб"],
  compositions: ["композиц"],
  vip: ["vip"],
  bouquets: ["букет"],
  occasions: ["повод"],
  holidays: ["праздник"],
  recipients: ["подар"],
  offers: ["акци"],
  "french-style": ["француз", "стиль"],
};

const FLOWER_STEMS: Record<string, string> = {
  роз: "роз",
  пион: "пион",
  пионовид: "пионовид",
  гортенз: "гортенз",
  тюльпан: "тюльпан",
  эустом: "эустом",
  ромаш: "ромаш",
  лили: "лили",
  калл: "калл",
  хризант: "хризант",
  гвозд: "гвозд",
  орхид: "орхид",
  альстром: "альстром",
  маттиол: "маттиол",
  ландыш: "ландыш",
  кустов: "кустов",
};

const FORMAT_STEMS: Record<string, string> = {
  корзин: "корзин",
  короб: "короб",
  микс: "микс",
  моно: "моно",
  букет: "букет",
  композиц: "композиц",
  vip: "vip",
  premium: "premium",
  luxury: "luxury",
  коллекц: "коллекц",
  авторск: "авторск",
};

const OCCASION_STEMS: Record<string, string> = {
  рожден: "рожден",
  любим: "любим",
  мам: "мам",
  благодар: "благодар",
  спасибо: "спасибо",
  извин: "извин",
  новорожден: "новорожден",
  юбил: "юбил",
  выпуск: "выпуск",
  свад: "свад",
};

const COLOR_STEMS: Record<string, string> = {
  красн: "красн",
  бел: "бел",
  розов: "розов",
  крем: "крем",
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
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

  for (const stemMap of [
    FLOWER_STEMS,
    FORMAT_STEMS,
    OCCASION_STEMS,
    COLOR_STEMS,
  ]) {
    for (const stem of Object.keys(stemMap)) {
      if (normalized.includes(stem)) {
        stems.push(stem);
      }
    }
  }

  return stems;
}

function extractQuantityTokens(normalizedQuery: string) {
  const numbers =
    normalizedQuery.match(/\b\d+\b/g)?.map((value) => Number(value)) ?? [];

  return numbers.filter((value) => Number.isFinite(value) && value > 0);
}

function expandRussianPluralHints(token: string) {
  const hints = [token];

  if (token.length >= 4) {
    if (token.endsWith("ы") || token.endsWith("и")) {
      hints.push(token.slice(0, -1));
    }

    if (token.endsWith("ий")) {
      hints.push(token.slice(0, -2));
    }

    if (token.endsWith("а") || token.endsWith("я")) {
      hints.push(token.slice(0, -1));
    }

    if (token.endsWith("ов") || token.endsWith("ей")) {
      hints.push(token.slice(0, -2));
    }
  }

  return hints;
}

function expandFlowerGroupTokens(tokens: Set<string>, normalizedQuery: string) {
  for (const group of FLOWER_KEYWORD_GROUPS) {
    const normalizedAliases = group.aliases.map((alias) => normalizeSearchText(alias));
    const matchesGroup =
      normalizedAliases.some(
        (alias) =>
          normalizedQuery.includes(alias) ||
          alias.includes(normalizedQuery) ||
          tokens.has(alias),
      ) || group.stems.some((stem) => normalizedQuery.includes(stem));

    if (!matchesGroup) {
      continue;
    }

    group.stems.forEach((stem) => tokens.add(stem));
    normalizedAliases.forEach((alias) => tokens.add(alias));
  }
}

export function expandSearchTokens(normalizedQuery: string) {
  const tokens = new Set<string>();

  tokenize(normalizedQuery).forEach((token) => {
    tokens.add(token);
    expandRussianPluralHints(token).forEach((hint) => tokens.add(hint));
  });

  if (normalizedQuery.length >= 2) {
    tokens.add(normalizedQuery);
  }

  const sortedSynonymKeys = Object.keys(SEARCH_SYNONYMS).sort(
    (left, right) => right.length - left.length,
  );

  for (const key of sortedSynonymKeys) {
    const normalizedKey = normalizeSearchText(key);
    const matchesQuery =
      normalizedQuery.includes(normalizedKey) ||
      normalizedKey.includes(normalizedQuery) ||
      normalizedKey.startsWith(normalizedQuery) ||
      normalizedQuery.startsWith(normalizedKey) ||
      tokens.has(normalizedKey);

    if (matchesQuery) {
      SEARCH_SYNONYMS[key].forEach((synonym) => tokens.add(synonym));
      tokens.add(normalizedKey);
      tokenize(normalizedKey).forEach((token) => tokens.add(token));
    }
  }

  extractStemTokens(normalizedQuery).forEach((stem) => tokens.add(stem));

  expandFlowerGroupTokens(tokens, normalizedQuery);

  extractQuantityTokens(normalizedQuery).forEach((quantity) => {
    tokens.add(String(quantity));
  });

  return [...tokens];
}

function buildBouquetCorpus(bouquet: SearchableBouquet) {
  const stemCountText =
    bouquet.stemCount != null ? String(bouquet.stemCount) : "";

  return normalizeSearchText(
    [
      bouquet.title,
      bouquet.description,
      bouquet.category,
      bouquet.flowerType,
      stemCountText,
      ...(bouquet.tags ?? []),
      ...(bouquet.searchTerms ?? []),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function buildPremiumCatalogEntry(
  groupId: string,
  groupTitle: string,
  label: string,
  query: string,
  bridgeTokens: string[] = [],
): CatalogSearchEntry {
  const normalizedText = normalizeSearchText(
    [groupTitle, label, query].join(" "),
  );

  return {
    groupId,
    groupTitle,
    label,
    query,
    normalizedText,
    tokens: tokenize(normalizedText),
    bridgeTokens: uniqueTokens([
      ...(GROUP_BRIDGE_TOKENS[groupId] ?? []),
      ...bridgeTokens,
      ...extractStemTokens(label),
      ...extractStemTokens(query),
      ...tokenize(label),
      ...tokenize(query),
    ]),
  };
}

function buildPremiumCatalogEntries(): CatalogSearchEntry[] {
  const menu = getVisibleCatalogMenu(catalogPremiumMenu);

  return menu.flatMap((item: CatalogMenuItem) => {
    const entries = [
      buildPremiumCatalogEntry(item.id, item.label, item.label, item.query),
    ];

    if (item.children?.length) {
      entries.push(
        ...item.children.map((child) =>
          buildPremiumCatalogEntry(
            item.id,
            item.label,
            child.label,
            child.query,
            GROUP_BRIDGE_TOKENS[item.id] ?? [],
          ),
        ),
      );
    }

    return entries;
  });
}

function buildQuantityCatalogEntries(): CatalogSearchEntry[] {
  return getVisibleCatalogItems(catalogQuantities).map((item) =>
    buildPremiumCatalogEntry("quantities", "Количество", item.label, item.query, [
      "роз",
      String(item.label),
    ]),
  );
}

function buildCatalogEntries(
  smartCatalogGroups: SmartCatalogGroup[],
): CatalogSearchEntry[] {
  const smartEntries = smartCatalogGroups.flatMap((group) =>
    group.sections.flatMap((section) =>
      section.items.map((item) => {
        const normalizedText = normalizeSearchText(
          [
            group.title,
            group.description,
            section.title,
            item.label,
            item.query,
          ].join(" "),
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

  return [
    ...smartEntries,
    ...buildPremiumCatalogEntries(),
    ...buildQuantityCatalogEntries(),
  ];
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
    if (/^\d+$/.test(token)) {
      return entry.normalizedText.includes(token);
    }

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
        ...tokenize(entry.query),
      ]),
  );
}

function isHydrangeaQuery(normalizedQuery: string, expandedTokens: string[]) {
  return (
    normalizedQuery.includes("гортенз") ||
    expandedTokens.some((token) => token.includes("гортенз"))
  );
}

function scoreQuantityMatch(corpus: string, quantities: number[]) {
  let score = 0;

  for (const quantity of quantities) {
    const quantityText = String(quantity);

    if (!corpus.includes(quantityText)) {
      continue;
    }

    score += ROSE_QUANTITIES.includes(quantity as (typeof ROSE_QUANTITIES)[number])
      ? 95
      : 55;

    if (new RegExp(`\\b${quantityText}\\b`).test(corpus)) {
      score += 35;
    }
  }

  return score;
}

function scoreBouquetMatch(
  bouquet: SearchableBouquet,
  normalizedQuery: string,
  expandedTokens: string[],
  catalogBridgeTokens: string[],
) {
  const corpus = buildBouquetCorpus(bouquet);
  const title = normalizeSearchText(bouquet.title);
  const quantities = extractQuantityTokens(normalizedQuery);
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

  score += scoreQuantityMatch(corpus, quantities);

  if (bouquet.category) {
    const normalizedCategory = normalizeSearchText(bouquet.category);

    if (
      normalizedCategory.includes(normalizedQuery) ||
      normalizedQuery.includes(normalizedCategory) ||
      expandedTokens.some(
        (token) => token.length >= 2 && normalizedCategory.includes(token),
      )
    ) {
      score += 30;
    }
  }

  if (bouquet.flowerType) {
    const normalizedFlowerType = normalizeSearchText(bouquet.flowerType);

    if (
      normalizedQuery.includes(normalizedFlowerType) ||
      expandedTokens.some((token) => normalizedFlowerType.includes(token))
    ) {
      score += 40;
    }
  }

  if (bouquet.stemCount != null && quantities.includes(bouquet.stemCount)) {
    score += 50;
  }

  for (const tag of bouquet.tags ?? []) {
    const normalizedTag = normalizeSearchText(tag);

    if (
      normalizedQuery.includes(normalizedTag) ||
      expandedTokens.some((token) => normalizedTag.includes(token))
    ) {
      score += 20;
    }
  }

  for (const token of expandedTokens) {
    if (/^\d+$/.test(token)) {
      if (corpus.includes(token)) {
        score += 60;
      }
      continue;
    }

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

  const queryStems = extractStemTokens(normalizedQuery);
  const hasFlowerIntent = queryStems.some((stem) => stem in FLOWER_STEMS);
  const hasFormatIntent = queryStems.some((stem) => stem in FORMAT_STEMS);

  if (hasFlowerIntent && hasFormatIntent) {
    const matchesFlower = queryStems.some(
      (stem) => stem in FLOWER_STEMS && corpus.includes(stem),
    );
    const matchesFormat = queryStems.some(
      (stem) => stem in FORMAT_STEMS && corpus.includes(stem),
    );

    if (matchesFlower && matchesFormat) {
      score += 40;
    }
  }

  if (quantities.length > 0 && queryStems.includes("роз") && corpus.includes("роз")) {
    score += 30;
  }

  if (isHydrangeaQuery(normalizedQuery, expandedTokens) && corpus.includes("гортенз")) {
    score += 90;
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

function scoreCategoryMatch(
  label: string,
  query: string,
  context: string,
  normalizedQuery: string,
  expandedTokens: string[],
) {
  const normalizedText = normalizeSearchText(`${label} ${query} ${context}`);
  let score = 0;

  if (normalizedText.includes(normalizedQuery)) {
    score += 140;
  }

  for (const token of expandedTokens) {
    if (/^\d+$/.test(token) && normalizedText.includes(token)) {
      score += 50;
      continue;
    }

    if (token.length < 2) {
      continue;
    }

    if (normalizedText.includes(token)) {
      score += 42;
    }

    if (
      normalizedText.split(/[^a-zа-я0-9]+/i).some(
        (word) => word.startsWith(token) || token.startsWith(word),
      )
    ) {
      score += 24;
    }
  }

  extractStemTokens(`${label} ${query}`).forEach((stem) => {
    if (normalizedQuery.includes(stem) || expandedTokens.includes(stem)) {
      score += 36;
    }
  });

  if (isHydrangeaQuery(normalizedQuery, expandedTokens) && normalizedText.includes("гортенз")) {
    score += 80;
  }

  return score;
}

function buildPremiumCategoryResults(
  normalizedQuery: string,
  expandedTokens: string[],
): CatalogCategorySearchResult[] {
  const menu = getVisibleCatalogMenu(catalogPremiumMenu);
  const results: CatalogCategorySearchResult[] = [];

  for (const item of menu) {
    const parentScore = scoreCategoryMatch(
      item.label,
      item.query,
      item.label,
      normalizedQuery,
      expandedTokens,
    );

    if (parentScore > 0) {
      results.push({
        id: item.id,
        menuItemId: item.id,
        icon: item.icon,
        title: item.label,
        subtitle: "Категория BellaFlore",
        query: item.query,
        score: parentScore,
      });
    }

    for (const child of item.children ?? []) {
      const childScore = scoreCategoryMatch(
        child.label,
        child.query,
        item.label,
        normalizedQuery,
        expandedTokens,
      );

      if (childScore > 0) {
        results.push({
          id: child.id,
          menuItemId: item.id,
          parentId: item.id,
          icon: item.icon,
          title: child.label,
          subtitle: item.label,
          query: child.query,
          score: childScore + 8,
        });
      }
    }
  }

  return results;
}

function buildSmartCatalogCategoryResults(
  smartCatalogGroups: SmartCatalogGroup[],
  normalizedQuery: string,
  expandedTokens: string[],
): CatalogCategorySearchResult[] {
  const menuIcons = new Map(
    getVisibleCatalogMenu(catalogPremiumMenu).map((item) => [item.id, item.icon]),
  );
  const results: CatalogCategorySearchResult[] = [];

  for (const group of smartCatalogGroups) {
    for (const section of group.sections) {
      for (const item of section.items) {
        if (item.status !== "live") {
          continue;
        }

        const score = scoreCategoryMatch(
          item.label,
          item.query,
          `${group.title} ${section.title}`,
          normalizedQuery,
          expandedTokens,
        );

        if (score <= 0) {
          continue;
        }

        results.push({
          id: item.id,
          menuItemId: group.id,
          parentId: group.id,
          icon: menuIcons.get(group.id),
          title: item.label,
          subtitle: `${group.title} · ${section.title}`,
          query: item.query,
          score,
        });
      }
    }
  }

  return results;
}

export function filterCatalogCategoryResults(
  searchQuery: string,
  smartCatalogGroups: SmartCatalogGroup[],
  limit = 8,
): CatalogCategorySearchResult[] {
  const normalizedQuery = normalizeSearchText(searchQuery);

  if (!normalizedQuery) {
    return [];
  }

  const expandedTokens = expandSearchTokens(normalizedQuery);
  const merged = [
    ...buildPremiumCategoryResults(normalizedQuery, expandedTokens),
    ...buildSmartCatalogCategoryResults(
      smartCatalogGroups,
      normalizedQuery,
      expandedTokens,
    ),
  ];

  const uniqueById = new Map<string, CatalogCategorySearchResult>();

  for (const result of merged) {
    const existing = uniqueById.get(result.id);

    if (!existing || result.score > existing.score) {
      uniqueById.set(result.id, result);
    }
  }

  return [...uniqueById.values()]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.title.localeCompare(right.title, "ru-RU");
    })
    .slice(0, limit);
}

export function runCatalogSearch<T extends SearchableBouquet>(
  bouquets: T[],
  searchQuery: string,
  smartCatalogGroups: SmartCatalogGroup[],
): CatalogSearchResponse<T> {
  const products = filterSearchResults(bouquets, searchQuery, smartCatalogGroups);
  const categories =
    products.length === 0
      ? filterCatalogCategoryResults(searchQuery, smartCatalogGroups)
      : [];

  return { products, categories };
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

  for (const item of getVisibleCatalogMenu(catalogPremiumMenu)) {
    suggestions.add(item.label);
    item.children?.forEach((child) => suggestions.add(child.label));
  }

  return [...suggestions].slice(0, limit);
}
