// ==================================================
// SECTION: CATALOG ADMIN
// РАЗДЕЛ: Mock catalog data (no DB)
// ==================================================
import type { CatalogAdminProduct } from "@/components/catalogAdmin/catalogAdminTypes";

export const CATALOG_ADMIN_MOCK_PRODUCTS: CatalogAdminProduct[] = [
  {
    id: "bouquet-white-roses-101",
    name: "Белые розы 101",
    category: "Розы",
    priceRub: 18900,
    status: "active",
    flowerCount: 101,
    shortDescription: "Классический монобукет из белых роз для особого случая.",
    placeholderImageLabel: "placeholder · белые розы",
  },
  {
    id: "bouquet-pink-peonies",
    name: "Розовые пионы",
    category: "Пионы",
    priceRub: 12400,
    status: "active",
    flowerCount: 25,
    shortDescription: "Нежный сезонный букет с пышными розовыми пионами.",
    placeholderImageLabel: "placeholder · розовые пионы",
  },
  {
    id: "bouquet-hydrangea-mix",
    name: "Гортензия микс",
    category: "Авторские",
    priceRub: 9800,
    status: "draft",
    flowerCount: 18,
    shortDescription: "Мягкий микс гортензий в пастельных оттенках.",
    placeholderImageLabel: "placeholder · гортензия",
  },
  {
    id: "bouquet-flower-basket",
    name: "Корзина цветов",
    category: "Корзины",
    priceRub: 15600,
    status: "active",
    flowerCount: 42,
    shortDescription: "Объёмная корзина с сезонным цветочным наполнением.",
    placeholderImageLabel: "placeholder · корзина",
  },
  {
    id: "bouquet-red-roses-51",
    name: "Красные розы 51",
    category: "Розы",
    priceRub: 11200,
    status: "hidden",
    flowerCount: 51,
    shortDescription: "Выразительный букет из красных роз для романтического жеста.",
    placeholderImageLabel: "placeholder · красные розы",
  },
];

export function getCatalogAdminCategories(
  products: CatalogAdminProduct[],
): string[] {
  return [...new Set(products.map((product) => product.category))].sort((a, b) =>
    a.localeCompare(b, "ru"),
  );
}
