// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Дополнительные подарки
//
// Purpose (EN): Admin-ready add-on gifts catalog for product page.
//
// Назначение (RU): Каталог доп. подарков для страницы товара (админка позже).
// ==================================================
import type { ProductAddOnItem } from "@/components/product/productExperienceTypes";

export const PRODUCT_ADD_ONS_CATALOG: ProductAddOnItem[] = [
  {
    id: "greeting-card",
    title: "Открытка",
    description: "Персональное поздравление от Bellaflore",
    priceRub: 390,
    emoji: "💌",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "vase",
    title: "Ваза",
    description: "Стеклянная ваза премиум-класса",
    priceRub: 2490,
    emoji: "🏺",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "candles",
    title: "Свечи",
    description: "Ароматические свечи в фирменной упаковке",
    priceRub: 1290,
    emoji: "🕯️",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "sweets",
    title: "Конфеты",
    description: "Премиальные конфеты к букету",
    priceRub: 990,
    emoji: "🍫",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "plush-toy",
    title: "Игрушка",
    description: "Мягкая игрушка в подарок",
    priceRub: 1890,
    emoji: "🧸",
    isActive: true,
    sortOrder: 5,
  },
];

export function getActiveProductAddOns(): ProductAddOnItem[] {
  return PRODUCT_ADD_ONS_CATALOG.filter((item) => item.isActive).sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );
}
