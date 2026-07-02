// ==================================================
// SECTION: Admin Catalog Manager — mock AI assistant
// РАЗДЕЛ: Mock AI-помощник (без внешнего API)
// ==================================================
import type {
  MockAiBundle,
  MockAiSuggestion,
} from "@/components/adminCatalogManager/adminCatalogTypes";
import { generateMockSeoSuggestions } from "@/components/adminCatalogManager/mockSeoAssistant";
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";

const MOCK_TEMPLATES = [
  {
    title: "Velvet Rose",
    categoryId: "roses",
    shortDescription: "51 красная роза премиального сорта",
    composition: "Красные розы, фирменная лента, премиальная упаковка Bellaflore",
    tags: ["красные", "моно-букет", "премиум", "розы"],
    basePrice: 14900,
  },
  {
    title: "Soft Peony Cloud",
    categoryId: "peonies",
    shortDescription: "Нежный букет из пионовидных роз и эвкалипта",
    composition: "Пионовидные розы, эвкалипт, атласная лента",
    tags: ["нежный", "пионы", "авторский", "подарок"],
    basePrice: 12900,
  },
  {
    title: "Hydrangea Dream",
    categoryId: "hydrangeas",
    shortDescription: "Объёмная композиция из голубых гортензий",
    composition: "Гортензии, зелень, фирменная коробка Bellaflore",
    tags: ["гортензии", "голубой", "премиум", "композиция"],
    basePrice: 16900,
  },
  {
    title: "Royal Author",
    categoryId: "author",
    shortDescription: "Авторский букет в премиальной подаче",
    composition: "Сезонные цветы, дизайнерская упаковка, фирменная лента",
    tags: ["авторский", "vip", "премиум", "эксклюзив"],
    basePrice: 18900,
  },
] as const;

function buildSizePrices(basePrice: number): Record<CatalogProductSizeId, number> {
  return {
    S: basePrice,
    M: Math.round(basePrice * 1.27),
    L: Math.round(basePrice * 1.67),
    XL: Math.round(basePrice * 2.2),
  };
}

function pickTemplate(seed: string) {
  const hash = seed
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return MOCK_TEMPLATES[hash % MOCK_TEMPLATES.length];
}

export function generateMockProductSuggestions(
  hint = "",
): MockAiSuggestion {
  const template = pickTemplate(hint || "bellaflore");
  const title = hint.trim()
    ? hint.trim().replace(/\b\w/g, (char) => char.toUpperCase())
    : template.title;
  const sizePrices = buildSizePrices(template.basePrice);
  const fullDescription = `${template.shortDescription}. Композиция собрана флористами Bellaflore с доставкой по Москве в день заказа.`;

  return {
    title,
    categoryId: template.categoryId,
    shortDescription: template.shortDescription,
    fullDescription,
    composition: template.composition,
    tags: [...template.tags],
    sizePrices,
    imageAlt: `Букет ${title} — Bellaflore`,
  };
}

export function generateMockAiBundle(hint = ""): MockAiBundle {
  const product = generateMockProductSuggestions(hint);
  const seo = generateMockSeoSuggestions(product);

  return { product, seo };
}

/** @deprecated Use generateMockAiBundle */
export function generateMockAiSuggestions(hint = ""): MockAiSuggestion {
  return generateMockProductSuggestions(hint);
}
