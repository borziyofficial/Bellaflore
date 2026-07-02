// ==================================================
// SECTION: Admin Catalog Manager — bouquet inference engine
// РАЗДЕЛ: Определение категории и описания по названию букета
// ==================================================
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";
import { formatBouquetTitle } from "@/components/adminCatalogManager/mockAiHintUtils";

type BouquetFlowerRule = {
  patterns: RegExp[];
  flowerNameRu: string;
  defaultTitle: string;
  categoryId: string;
  shortDescription: string;
  composition: string;
  tags: string[];
  basePrice: number;
};

const BOUQUET_FLOWER_RULES: BouquetFlowerRule[] = [
  {
    patterns: [/маттиол/i, /matthiola/i, /stock\s*flower/i, /леуко/i],
    flowerNameRu: "маттиолы",
    defaultTitle: "Маттиола",
    categoryId: "mono-bouquets",
    shortDescription:
      "Нежный монобукет из маттиолы в премиальной упаковке Bellaflore",
    composition: "Маттиола, зелень, фирменная лента Bellaflore",
    tags: ["маттиола", "моно-букет", "нежный", "сезонный"],
    basePrice: 8900,
  },
  {
    patterns: [/гортенз/i, /hydrangea/i],
    flowerNameRu: "гортензий",
    defaultTitle: "Гортензия",
    categoryId: "hydrangeas",
    shortDescription: "Объёмная композиция из свежих гортензий",
    composition: "Гортензии, зелень, фирменная коробка Bellaflore",
    tags: ["гортензии", "объёмный", "премиум", "композиция"],
    basePrice: 16900,
  },
  {
    patterns: [/пион/i, /peony/i],
    flowerNameRu: "пионов",
    defaultTitle: "Пионы",
    categoryId: "peonies",
    shortDescription: "Нежный букет из пионовидных роз и сезонных пионов",
    composition: "Пионы, эвкалипт, атласная лента Bellaflore",
    tags: ["пионы", "нежный", "сезонный", "подарок"],
    basePrice: 12900,
  },
  {
    patterns: [/роз/i, /\brose\b/i, /roses/i],
    flowerNameRu: "роз",
    defaultTitle: "Розы",
    categoryId: "roses",
    shortDescription: "Монобукет из премиальных роз",
    composition: "Розы, фирменная лента, премиальная упаковка Bellaflore",
    tags: ["розы", "моно-букет", "премиум", "классика"],
    basePrice: 14900,
  },
  {
    patterns: [/тюльпан/i, /tulip/i],
    flowerNameRu: "тюльпанов",
    defaultTitle: "Тюльпаны",
    categoryId: "mono-bouquets",
    shortDescription: "Яркий весенний букет из свежих тюльпанов",
    composition: "Тюльпаны, зелень, фирменная упаковка Bellaflore",
    tags: ["тюльпаны", "весна", "моно-букет", "яркий"],
    basePrice: 7900,
  },
  {
    patterns: [/лили/i, /lily|lilies/i],
    flowerNameRu: "лилий",
    defaultTitle: "Лилии",
    categoryId: "mono-bouquets",
    shortDescription: "Ароматный букет из премиальных лилий",
    composition: "Лилии, зелень, дизайнерская упаковка Bellaflore",
    tags: ["лилии", "ароматный", "премиум", "моно-букет"],
    basePrice: 11900,
  },
  {
    patterns: [/хризантем/i, /chrysanthemum/i],
    flowerNameRu: "хризантем",
    defaultTitle: "Хризантемы",
    categoryId: "mono-bouquets",
    shortDescription: "Стильный букет из свежих хризантем",
    composition: "Хризантемы, зелень, фирменная лента Bellaflore",
    tags: ["хризантемы", "моно-букет", "стильный", "долгоиграющий"],
    basePrice: 6900,
  },
  {
    patterns: [/орхиде/i, /orchid/i],
    flowerNameRu: "орхидей",
    defaultTitle: "Орхидеи",
    categoryId: "vip",
    shortDescription: "Элегантная VIP-композиция с орхидеями",
    composition: "Орхидеи, декоративная зелень, премиальная упаковка Bellaflore",
    tags: ["орхидеи", "vip", "премиум", "эксклюзив"],
    basePrice: 19900,
  },
  {
    patterns: [/эвкалипт/i, /eucalyptus/i],
    flowerNameRu: "эвкалипта",
    defaultTitle: "Эвкалипт",
    categoryId: "author",
    shortDescription: "Авторский букет с эвкалиптом и сезонными акцентами",
    composition: "Эвкалипт, сезонные цветы, дизайнерская упаковка Bellaflore",
    tags: ["эвкалипт", "авторский", "зелень", "стильный"],
    basePrice: 9900,
  },
  {
    patterns: [/гипсофил/i, /gypsophila/i],
    flowerNameRu: "гипсофилы",
    defaultTitle: "Гипсофила",
    categoryId: "mono-bouquets",
    shortDescription: "Воздушный букет из нежной гипсофилы",
    composition: "Гипсофила, фирменная лента, премиальная упаковка Bellaflore",
    tags: ["гипсофила", "нежный", "моно-букет", "воздушный"],
    basePrice: 7900,
  },
  {
    patterns: [/короб/i, /box/i],
    flowerNameRu: "цветов",
    defaultTitle: "Цветы в коробке",
    categoryId: "boxes",
    shortDescription: "Цветочная композиция в фирменной коробке Bellaflore",
    composition: "Сезонные цветы, дизайнерская коробка Bellaflore",
    tags: ["коробка", "подарок", "премиум", "композиция"],
    basePrice: 13900,
  },
  {
    patterns: [/корзин/i, /basket/i],
    flowerNameRu: "цветов",
    defaultTitle: "Цветочная корзина",
    categoryId: "baskets",
    shortDescription: "Премиальная цветочная корзина Bellaflore",
    composition: "Сезонные цветы, фирменная корзина Bellaflore",
    tags: ["корзина", "подарок", "премиум", "композиция"],
    basePrice: 15900,
  },
];

const DEFAULT_AUTHOR_RULE: BouquetFlowerRule = {
  patterns: [],
  flowerNameRu: "сезонных цветов",
  defaultTitle: "Авторский букет",
  categoryId: "author",
  shortDescription: "Авторский букет в премиальной подаче Bellaflore",
  composition: "Сезонные цветы, дизайнерская упаковка, фирменная лента Bellaflore",
  tags: ["авторский", "премиум", "подарок", "bellaflore"],
  basePrice: 11900,
};

export type InferredBouquetProfile = {
  title: string;
  categoryId: string;
  shortDescription: string;
  fullDescription: string;
  composition: string;
  tags: string[];
  sizePrices: Record<CatalogProductSizeId, number>;
  imageAlt: string;
  suggestFeatured: boolean;
  suggestNew: boolean;
  suggestBestseller: boolean;
};

function buildSizePrices(basePrice: number): Record<CatalogProductSizeId, number> {
  return {
    S: basePrice,
    M: Math.round(basePrice * 1.27),
    L: Math.round(basePrice * 1.67),
    XL: Math.round(basePrice * 2.2),
  };
}

function matchFlowerRule(title: string): BouquetFlowerRule {
  const haystack = title.toLowerCase();

  for (const rule of BOUQUET_FLOWER_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      return rule;
    }
  }

  return DEFAULT_AUTHOR_RULE;
}

function buildTitleFromRule(rule: BouquetFlowerRule, rawTitle: string): string {
  const formatted = formatBouquetTitle(rawTitle);
  if (formatted) {
    return formatted;
  }

  return rule.defaultTitle;
}

function personalizeDescription(
  rule: BouquetFlowerRule,
  title: string,
  field: "shortDescription" | "composition",
): string {
  const base = rule[field];
  const titleLower = title.toLowerCase();

  if (titleLower && rule.patterns.some((pattern) => pattern.test(titleLower))) {
    return base;
  }

  if (field === "shortDescription") {
    return `${title} — ${base.charAt(0).toLowerCase()}${base.slice(1)}`;
  }

  return `${title}, ${base.charAt(0).toLowerCase()}${base.slice(1)}`;
}

export function inferBouquetProfile(rawTitle: string): InferredBouquetProfile {
  const rule = matchFlowerRule(rawTitle);
  const title = buildTitleFromRule(rule, rawTitle);
  const shortDescription = personalizeDescription(rule, title, "shortDescription");
  const composition = personalizeDescription(rule, title, "composition");
  const fullDescription = `${shortDescription}. Композиция собрана флористами Bellaflore с доставкой по Москве в день заказа.`;
  const tags = Array.from(new Set([title.toLowerCase(), ...rule.tags]));
  const sizePrices = buildSizePrices(rule.basePrice);

  return {
    title,
    categoryId: rule.categoryId,
    shortDescription,
    fullDescription,
    composition,
    tags,
    sizePrices,
    imageAlt: `Букет «${title}» — Bellaflore`,
    suggestFeatured: rule.categoryId === "vip" || rule.basePrice >= 14900,
    suggestNew: /новин|new|cloud/i.test(title),
    suggestBestseller: rule.categoryId === "vip" || rule.categoryId === "roses",
  };
}
