// ==================================================
// SECTION: Admin Catalog Manager — mock SEO assistant
// РАЗДЕЛ: Mock SEO AI (без внешнего API)
// ==================================================
import type { MockAiSuggestion } from "@/components/adminCatalogManager/adminCatalogTypes";
import type { MockSeoSuggestion } from "@/components/adminCatalogManager/adminSeoTypes";
import {
  buildSeoChecklist,
  calculateSeoScore,
} from "@/components/adminCatalogManager/seoScoreEngine";
import { CATALOG_CATEGORY_BY_ID } from "@/components/catalogEngine/categoriesCatalog";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateMockSeoSuggestions(
  product: MockAiSuggestion,
): MockSeoSuggestion {
  const categoryTitle =
    CATALOG_CATEGORY_BY_ID[product.categoryId]?.title ?? "Букеты";
  const seoSlug = slugify(product.title);
  const seoTitle = `${product.title} — купить ${categoryTitle.toLowerCase()} с доставкой | Bellaflore`;
  const seoDescription = `${product.shortDescription}. Доставка по Москве сегодня. Премиальные букеты Bellaflore — подарок на любой повод.`;
  const seoH1 = `Букет «${product.title}»`;
  const seoKeywords = [
    product.title.toLowerCase(),
    categoryTitle.toLowerCase(),
    "букет с доставкой",
    "цветы москва",
    "bellaflore",
    ...product.tags.slice(0, 3),
  ];
  const seoFaq = [
    {
      question: `Сколько стоит букет «${product.title}»?`,
      answer: `Стоимость зависит от размера S–XL. Базовая цена от ${product.sizePrices.S} ₽ с доставкой по Москве.`,
    },
    {
      question: "Можно ли доставить сегодня?",
      answer: "Да, Bellaflore доставляет букеты по Москве в день заказа при оформлении до отсечки.",
    },
    {
      question: "Из чего состоит букет?",
      answer: product.composition,
    },
  ];
  const schemaProductJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: seoDescription,
    brand: {
      "@type": "Brand",
      name: "Bellaflore",
    },
    category: categoryTitle,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "RUB",
      lowPrice: product.sizePrices.S,
      highPrice: product.sizePrices.XL,
      availability: "https://schema.org/InStock",
      url: `https://www.bellaflore.ru/catalog/${seoSlug}`,
    },
  };

  const draft = {
    seoTitle,
    seoDescription,
    seoH1,
    seoSlug,
    seoKeywords: seoKeywords.join(", "),
    seoFaq,
    seoImageAlt: `Букет ${product.title} — ${categoryTitle}, Bellaflore`,
    seoGalleryAlt: [
      `Букет ${product.title} крупным планом`,
      `Упаковка букета ${product.title}`,
      `Букет ${product.title} в интерьере`,
    ],
    openGraphTitle: `${product.title} — Bellaflore`,
    openGraphDescription: product.shortDescription,
    schemaProductJsonLd,
    internalLinkSuggestions: [
      `/catalog/${seoSlug}`,
      "/dostavka-cvetov-moskva",
      `/catalog?category=${product.categoryId}`,
    ],
  };

  const seoChecklist = buildSeoChecklist({
    ...draft,
    seoImageAlt: draft.seoImageAlt,
  });
  const seoScore = calculateSeoScore(seoChecklist);
  const seoRecommendations =
    seoScore < 85
      ? [
          "Добавьте ещё одно фото товара",
          "Сделайте описание более конкретным",
          "Добавьте ключевое слово «доставка»",
          "Укажите состав букета",
          "Добавьте ключевое слово повода",
        ]
      : ["SEO-пакет готов к публикации."];

  return {
    ...draft,
    seoScore,
    seoRecommendations,
    seoChecklist,
  };
}
