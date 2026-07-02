// ==================================================
// SECTION: RECOMMENDATION INTELLIGENCE
// РАЗДЕЛ: Add-ons catalog (CRM-ready)
// ==================================================
import type { RecommendationAddOnItem } from "@/components/recommendationIntelligence/recommendationIntelligenceTypes";

export const RECOMMENDATION_ADD_ONS_CATALOG: RecommendationAddOnItem[] = [
  {
    id: "greeting-card",
    title: "Открытка",
    description: "Персональное поздравление",
    priceRub: 390,
    emoji: "💌",
    category: "card",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "vase",
    title: "Ваза",
    description: "Стеклянная ваза премиум-класса",
    priceRub: 2490,
    emoji: "🏺",
    category: "vase",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "candles",
    title: "Свечи",
    description: "Ароматические свечи",
    priceRub: 1290,
    emoji: "🕯️",
    category: "candle",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "plush-toy",
    title: "Игрушка",
    description: "Мягкая игрушка в подарок",
    priceRub: 1890,
    emoji: "🧸",
    category: "toy",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "sweets",
    title: "Конфеты",
    description: "Премиальные конфеты",
    priceRub: 990,
    emoji: "🍫",
    category: "sweets",
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "balloons",
    title: "Шары",
    description: "Фирменный набор шаров",
    priceRub: 1490,
    emoji: "🎈",
    category: "balloons",
    isActive: true,
    sortOrder: 6,
    crmSource: "bellaflore_crm_bundle_v1",
  },
  {
    id: "satin-ribbon",
    title: "Ленты",
    description: "Декоративные атласные ленты",
    priceRub: 690,
    emoji: "🎀",
    category: "decor",
    isActive: true,
    sortOrder: 7,
    crmSource: "bellaflore_crm_bundle_v1",
  },
];

export function getActiveRecommendationAddOns(): RecommendationAddOnItem[] {
  return RECOMMENDATION_ADD_ONS_CATALOG.filter((item) => item.isActive).sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
}
