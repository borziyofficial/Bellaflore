// ==================================================
// SECTION: PRODUCT EDITOR
// РАЗДЕЛ: Mock product draft (no DB)
// ==================================================
import type { ProductEditorDraft } from "@/components/productEditor/productEditorTypes";

export const PRODUCT_EDITOR_MOCK_DRAFT: ProductEditorDraft = {
  name: "Белые розы 101",
  slug: "belye-rozy-101",
  category: "Розы",
  priceRub: 18900,
  oldPriceRub: 21900,
  flowerCount: 101,
  size: "L",
  status: "draft",
  shortDescription: "Классический монобукет из белых роз для особого случая.",
  fullDescription:
    "Премиальный букет из 101 белой розы для торжественного подарка. " +
    "Композиция собирается вручную флористами Bellaflore, оформляется в фирменную упаковку " +
    "и готовится к доставке по Москве в выбранный интервал. Идеально подходит для предложения, " +
    "юбилея, свадебного жеста или статусного подарка.",
  composition: "101 белая роза, упаковка premium, лента Bellaflore",
  colorPalette: "Белый, кремовый",
  occasion: "premium",
  seasonality: "Круглый год",
  deliveryNote: "Доставка по Москве в день заказа при оформлении до 18:00",
  sku: "BF-ROSE-101-WHT",
  seoTitle: "Белые розы 101 — купить букет с доставкой по Москве | Bellaflore",
  metaDescription:
    "Закажите букет из 101 белой розы с премиальной доставкой по Москве. " +
    "Bellaflore — доставка цветов Москва, авторская упаковка, свежие розы.",
  seoKeywords: "белые розы 101, букет роз, доставка цветов Москва, Bellaflore",
  h1: "Белые розы 101",
  h2: "Премиальный букет с доставкой по Москве",
  imageAltText: "Букет из 101 белой розы Bellaflore на светлом фоне",
  canonicalUrl: "https://bellaflore.ru/catalog/belye-rozy-101",
  openGraphTitle: "Белые розы 101 — Bellaflore",
  openGraphDescription:
    "Премиальный букет из 101 белой розы с доставкой по Москве.",
  structuredDataType: "Product",
  localSeoPhrase: "доставка цветов Москва",
  searchIntent: "buy",
};

export const PRODUCT_EDITOR_CATEGORIES = [
  "Розы",
  "Пионы",
  "Авторские",
  "Корзины",
  "Премиум",
];

export const PRODUCT_EDITOR_OCCASION_OPTIONS: {
  value: ProductEditorDraft["occasion"];
  label: string;
}[] = [
  { value: "birthday", label: "День рождения" },
  { value: "love", label: "Любовь" },
  { value: "wedding", label: "Свадьба" },
  { value: "premium", label: "Премиум" },
  { value: "none", label: "Без повода" },
];

export const PRODUCT_EDITOR_SEARCH_INTENT_OPTIONS: {
  value: ProductEditorDraft["searchIntent"];
  label: string;
}[] = [
  { value: "buy", label: "Купить" },
  { value: "gift", label: "Подарить" },
  { value: "delivery", label: "Доставка" },
  { value: "premium", label: "Премиум" },
];

export const PRODUCT_EDITOR_STRUCTURED_DATA_OPTIONS: {
  value: ProductEditorDraft["structuredDataType"];
  label: string;
}[] = [
  { value: "Product", label: "Product" },
  { value: "Offer", label: "Offer" },
  { value: "Breadcrumb", label: "Breadcrumb" },
];
