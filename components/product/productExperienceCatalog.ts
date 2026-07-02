// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Product Experience — каталог
//
// Purpose (EN): Product detail config derived from catalog product data.
//
// Назначение (RU): Детали товара на основе данных каталога.
// ==================================================
import type {
  CatalogProductBase,
  ProductExperienceData,
  ProductGalleryImage,
  ProductSizeId,
  ProductSizeVariant,
} from "@/components/product/productExperienceTypes";
import type { CatalogProduct } from "@/data/catalogProducts";
import {
  getDefaultProductSizeId,
  getProductCompositionFallback,
  getProductDetailFields,
  getProductSizeOptions,
  hasProductSizes,
} from "@/data/productSizeFoundation";

const SIZE_SCALE: Record<ProductSizeId, number> = {
  S: 1,
  M: 1.27,
  L: 1.67,
  XL: 2.2,
};

const PRODUCT_GALLERY_OVERRIDES: Record<string, string[]> = {
  "red-luxury": ["/roza rouze royal.PNG", "/0002.jpg", "/white rose 101.PNG"],
  "pink-elegance": ["/0002.jpg", "/mix piony siren.PNG", "/piony 11.PNG"],
  "white-pearl": ["/white rose 101.PNG", "/roza rouze royal.PNG"],
  "golden-romance": ["/roza rouze royal.PNG", "/mix piony siren.PNG"],
  "luxury-box": ["/mix piony siren.PNG", "/piony 11.PNG", "/0002.jpg"],
  "royal-collection": ["/piony 11.PNG", "/mix piony siren.PNG", "/0002.jpg"],
};

function buildGalleryImages(product: CatalogProductBase): ProductGalleryImage[] {
  const overrideSources = PRODUCT_GALLERY_OVERRIDES[product.id];
  const sources = overrideSources?.length
    ? overrideSources
    : product.src
      ? [product.src, product.src, product.src]
      : ["/roza rouze royal.PNG"];

  return sources.map((src, index) => ({
    id: `${product.id}-gallery-${index}`,
    src,
    alt:
      index === 0
        ? product.alt
        : `${product.title} — фото ${index + 1}`,
    width: product.width,
    height: product.height,
  }));
}

function buildStemCount(baseCount: number | undefined, sizeId: ProductSizeId): number | undefined {
  if (!baseCount) {
    return undefined;
  }

  return Math.round(baseCount * SIZE_SCALE[sizeId]);
}

function buildSizeVariants(product: CatalogProduct): ProductSizeVariant[] {
  const sizeOptions = getProductSizeOptions(product);

  return sizeOptions.map((option) => {
    const stemCount = buildStemCount(product.stemCount, option.label);

    return {
      sizeId: option.label,
      label: option.label,
      priceRub: option.price,
      description:
        option.label === "S"
          ? product.description
          : `${product.description}${stemCount ? ` · ${stemCount} стеблей` : ""}`,
      stemCount,
      flowerCount: stemCount,
      specs: [
        {
          label: "Размер",
          value: option.label,
        },
        ...(stemCount
          ? [{ label: "Стеблей", value: String(stemCount) }]
          : [{ label: "Формат", value: product.category ?? "Авторский" }]),
        {
          label: "Упаковка",
          value: "Премиальная Bellaflore",
        },
      ],
    };
  });
}

function buildReviews(product: CatalogProductBase) {
  return [
    {
      id: `${product.id}-review-1`,
      author: "Анна",
      rating: 5,
      text: `«${product.title} выглядел ещё лучше, чем на фото. Доставили аккуратно и вовремя.»`,
      dateLabel: "2 дня назад",
    },
    {
      id: `${product.id}-review-2`,
      author: "Михаил",
      rating: 5,
      text: "Отличное качество цветов и упаковки. Заказываем не первый раз.",
      dateLabel: "1 неделю назад",
    },
  ];
}

function buildExperienceData(product: CatalogProduct): ProductExperienceData {
  const details = getProductDetailFields(product);

  return {
    productId: product.id,
    description: product.description,
    galleryImages: buildGalleryImages(product),
    sizeVariants: buildSizeVariants(product),
    defaultSizeId: getDefaultProductSizeId(product),
    hasMultipleSizes: hasProductSizes(product),
    composition: getProductCompositionFallback(product),
    deliveryNote: details.deliveryHint,
    careNote: details.care,
    whatsIncluded:
      product.whatsIncluded ??
      "Премиальная упаковка Bellaflore, аккуратная доставка и рекомендации по уходу после получения.",
    availability: details.availability,
    badge: details.badge,
    isPopular: details.isPopular,
    isNew: details.isNew,
    freshnessGuarantee:
      "Гарантия свежести 48 часов. Если букет не оправдает ожиданий — свяжитесь с нами, мы оперативно решим вопрос.",
    reviews: buildReviews(product),
  };
}

const experienceCache = new Map<string, ProductExperienceData>();

export function getProductExperienceData(
  product: CatalogProductBase | CatalogProduct,
): ProductExperienceData {
  const cached = experienceCache.get(product.id);
  if (cached) {
    return cached;
  }

  const data = buildExperienceData(product as CatalogProduct);
  experienceCache.set(product.id, data);
  return data;
}

export function getSimilarProducts(
  productId: string,
  allProducts: CatalogProductBase[],
  limit = 8,
): CatalogProductBase[] {
  const current = allProducts.find((item) => item.id === productId);
  if (!current) {
    return allProducts.filter((item) => item.id !== productId).slice(0, limit);
  }

  const sameCategory = allProducts.filter(
    (item) => item.id !== productId && item.category === current.category,
  );
  const pool =
    sameCategory.length >= 3
      ? sameCategory
      : allProducts.filter((item) => item.id !== productId);

  return pool.slice(0, limit);
}

export function getProductSizeVariant(
  data: ProductExperienceData,
  sizeId: ProductSizeId,
): ProductSizeVariant {
  return (
    data.sizeVariants.find((variant) => variant.sizeId === sizeId) ??
    data.sizeVariants[0]
  );
}
