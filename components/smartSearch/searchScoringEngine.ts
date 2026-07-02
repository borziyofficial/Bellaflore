// ==================================================
// SECTION: SMART SEARCH
// РАЗДЕЛ: Search Scoring Engine
//
// Purpose (EN): Intent-aware product scoring with human-readable match reasons.
//
// Назначение (RU): Скоринг товаров с причинами совпадения.
// ==================================================
import { CATALOG_CATEGORY_BY_ID } from "@/components/catalogEngine/categoriesCatalog";
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";
import {
  isProductPurchasable,
  isProductVisibleInCatalog,
} from "@/components/catalogEngine/availabilityEngine";
import type {
  ParsedSearchQuery,
  SmartSearchMatchReason,
  SmartSearchProductResult,
} from "@/components/smartSearch/smartSearchTypes";
import { normalizeSearchText } from "@/components/search/searchFoundation";

const FLOWER_LABELS: Record<string, string> = {
  rose: "розы",
  peony: "пионы",
  hydrangea: "гортензии",
  tulip: "тюльпаны",
  mix: "микс-букет",
};

const COLOR_LABELS: Record<string, string> = {
  white: "белые",
  pink: "розовые",
  red: "красные",
  soft: "нежные",
  cream: "кремовые",
};

const OCCASION_LABELS: Record<string, string> = {
  mother: "для мамы",
  birthday: "день рождения",
  romantic: "для любимой",
  gift: "подарок",
  vip: "VIP",
};

const STYLE_LABELS: Record<string, string> = {
  gentle: "нежный стиль",
  premium: "премиум",
  luxury: "luxury",
  romantic: "романтичный",
};

function addReason(
  reasons: SmartSearchMatchReason[],
  reason: SmartSearchMatchReason,
): void {
  if (!reasons.some((item) => item.code === reason.code && item.label === reason.label)) {
    reasons.push(reason);
  }
}

function productMatchesFlower(product: CatalogProductRecord, flower: string): boolean {
  const haystack = [
    ...product.flowerTypes,
    product.searchIndexText,
    product.metadata.legacyCategory ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (flower === "rose") {
    return haystack.includes("роз");
  }
  if (flower === "peony") {
    return haystack.includes("пион");
  }
  if (flower === "hydrangea") {
    return haystack.includes("гортенз");
  }
  if (flower === "tulip") {
    return haystack.includes("тюльпан");
  }

  return haystack.includes("микс") || haystack.includes("автор");
}

function productMatchesColor(product: CatalogProductRecord, color: string): boolean {
  if (product.colors.includes(color)) {
    return true;
  }

  const tagHaystack = (product.tags ?? []).join(" ").toLowerCase();
  const colorNeedle = COLOR_LABELS[color] ?? color;
  return tagHaystack.includes(colorNeedle) || product.searchIndexText.includes(colorNeedle);
}

function productMatchesOccasion(product: CatalogProductRecord, occasion: string): boolean {
  if (product.occasions.includes(occasion)) {
    return true;
  }

  return product.searchTerms.some((term) =>
    term.toLowerCase().includes(
      occasion === "mother" ? "мам" : occasion,
    ),
  );
}

function productMatchesStyle(product: CatalogProductRecord, style: string): boolean {
  const haystack = `${product.tags.join(" ")} ${product.searchIndexText}`.toLowerCase();

  if (style === "gentle") {
    return haystack.includes("неж") || haystack.includes("soft");
  }

  if (style === "premium" || style === "luxury") {
    return haystack.includes("premium") || haystack.includes("премиум") || haystack.includes("luxury");
  }

  return haystack.includes("romantic") || haystack.includes("романт");
}

function buildReasonSummary(reasons: SmartSearchMatchReason[]): string {
  const labels = reasons
    .filter((reason) => reason.code !== "availability")
    .slice(0, 4)
    .map((reason) => reason.label.toLowerCase());

  if (labels.length === 0) {
    return "Подходит по запросу";
  }

  return `Подходит: ${labels.join(", ")}`;
}

export function scoreProductForParsedQuery(
  product: CatalogProductRecord,
  parsedQuery: ParsedSearchQuery,
): SmartSearchProductResult {
  const reasons: SmartSearchMatchReason[] = [];
  let score = 0;

  const normalizedTitle = normalizeSearchText(product.title);
  const normalizedQuery = parsedQuery.normalizedQuery;

  if (normalizedQuery && normalizedTitle.includes(normalizedQuery)) {
    score += 120;
    addReason(reasons, {
      code: "title_match",
      label: "точное совпадение названия",
      weight: 120,
    });
  }

  for (const token of parsedQuery.keywords) {
    if (
      token.length > 2 &&
      (product.searchIndexText.includes(token) || normalizedTitle.includes(token))
    ) {
      score += 18;
      addReason(reasons, {
        code: "keyword_match",
        label: `совпадение «${token}»`,
        weight: 18,
      });
    }
  }

  for (const flower of parsedQuery.flowers) {
    if (productMatchesFlower(product, flower)) {
      score += 48;
      addReason(reasons, {
        code: "flower_match",
        label: FLOWER_LABELS[flower] ?? flower,
        weight: 48,
      });
    }
  }

  for (const color of parsedQuery.colors) {
    if (productMatchesColor(product, color)) {
      score += 36;
      addReason(reasons, {
        code: "color_match",
        label: COLOR_LABELS[color] ?? color,
        weight: 36,
      });
    }
  }

  for (const occasion of parsedQuery.occasions) {
    if (productMatchesOccasion(product, occasion)) {
      score += 32;
      addReason(reasons, {
        code: "occasion_match",
        label: OCCASION_LABELS[occasion] ?? occasion,
        weight: 32,
      });
    }
  }

  for (const style of parsedQuery.styles) {
    if (productMatchesStyle(product, style)) {
      score += 24;
      addReason(reasons, {
        code: "style_match",
        label: STYLE_LABELS[style] ?? style,
        weight: 24,
      });
    }
  }

  if (parsedQuery.stemCount !== null && product.metadata.stemCount !== undefined) {
    const delta = Math.abs(product.metadata.stemCount - parsedQuery.stemCount);
    if (delta === 0) {
      score += 80;
      addReason(reasons, {
        code: "stem_count_match",
        label: `${parsedQuery.stemCount} стеблей`,
        weight: 80,
      });
    } else if (delta <= 10) {
      score += 40;
      addReason(reasons, {
        code: "stem_count_match",
        label: `около ${parsedQuery.stemCount} стеблей`,
        weight: 40,
      });
    }
  }

  if (parsedQuery.maxPriceRub !== null) {
    if (product.basePriceRub <= parsedQuery.maxPriceRub) {
      score += 44;
      addReason(reasons, {
        code: "price_match",
        label: `цена до ${parsedQuery.maxPriceRub.toLocaleString("ru-RU")} ₽`,
        weight: 44,
      });
    } else {
      score -= 30;
    }
  }

  for (const categoryId of product.categoryIds) {
    const categoryTitle = CATALOG_CATEGORY_BY_ID[categoryId]?.title.toLowerCase() ?? "";
    if (
      categoryTitle &&
      parsedQuery.normalizedQuery.includes(normalizeSearchText(categoryTitle))
    ) {
      score += 28;
      addReason(reasons, {
        code: "category_match",
        label: categoryTitle,
        weight: 28,
      });
    }
  }

  if (product.isFeatured || product.popularityScore >= 80) {
    score += product.popularityScore / 10;
    addReason(reasons, {
      code: "popularity",
      label: "популярный товар",
      weight: product.popularityScore / 10,
    });
  }

  if (product.isFeatured) {
    score += 8;
    addReason(reasons, {
      code: "featured",
      label: "рекомендуем Bellaflore",
      weight: 8,
    });
  }

  if (isProductPurchasable(product.availability)) {
    score += 6;
    addReason(reasons, {
      code: "availability",
      label: "в наличии",
      weight: 6,
    });
  } else {
    score -= 20;
  }

  reasons.sort((left, right) => right.weight - left.weight);

  return {
    product,
    score,
    reasons,
    reasonSummary: buildReasonSummary(reasons),
  };
}

export function rankSmartSearchResults(
  products: CatalogProductRecord[],
  parsedQuery: ParsedSearchQuery,
  limit?: number,
): SmartSearchProductResult[] {
  const visibleProducts = products.filter((product) =>
    isProductVisibleInCatalog(product.availability, product.isPublished),
  );

  const ranked = visibleProducts
    .map((product) => scoreProductForParsedQuery(product, parsedQuery))
    .filter((result) => result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.product.title.localeCompare(right.product.title, "ru-RU");
    });

  return limit ? ranked.slice(0, limit) : ranked;
}
