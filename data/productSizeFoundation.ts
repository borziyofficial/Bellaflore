// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Размеры и цены
//
// Purpose (EN): Resolve product sizes, default selection, and price from catalog data.
//
// Назначение (RU): Размеры, выбор по умолчанию и цена из данных каталога.
// ==================================================
import type { CatalogProduct } from "@/data/catalogProducts";
import type {
  ProductDetailFields,
  ProductSelection,
  ProductSizeLabel,
  ProductSizeOption,
} from "@/data/productTypes";

const SIZE_ORDER: ProductSizeLabel[] = ["S", "M", "L", "XL"];

const DEFAULT_DELIVERY_HINT = "Доставка сегодня по Москве и области";
const DEFAULT_CARE =
  "Обрежьте стебли под углом, меняйте воду каждые 2 дня и держите букет вдали от прямого солнца и сквозняков.";
const DEFAULT_AVAILABILITY = "В наличии";

export function hasProductSizes(product: CatalogProduct): boolean {
  return Array.isArray(product.sizes) && product.sizes.length > 0;
}

export function getProductSizeOptions(product: CatalogProduct): ProductSizeOption[] {
  if (hasProductSizes(product)) {
    return [...product.sizes!].sort(
      (left, right) =>
        SIZE_ORDER.indexOf(left.label) - SIZE_ORDER.indexOf(right.label),
    );
  }

  return [{ label: "S", price: product.priceRub }];
}

export function getDefaultProductSizeId(product: CatalogProduct): ProductSizeLabel {
  return getProductSizeOptions(product)[0]?.label ?? "S";
}

export function getProductSizePrice(
  product: CatalogProduct,
  sizeId: ProductSizeLabel,
): number {
  const match = getProductSizeOptions(product).find(
    (option) => option.label === sizeId,
  );

  return match?.price ?? product.priceRub;
}

export function resolveProductSelection(
  product: CatalogProduct,
  sizeId?: ProductSizeLabel,
  priceRub?: number,
): ProductSelection {
  const options = getProductSizeOptions(product);
  const resolvedSizeId =
    sizeId && options.some((option) => option.label === sizeId)
      ? sizeId
      : getDefaultProductSizeId(product);
  const resolvedPrice =
    typeof priceRub === "number" && Number.isFinite(priceRub)
      ? priceRub
      : getProductSizePrice(product, resolvedSizeId);

  return {
    sizeId: resolvedSizeId,
    sizeLabel: resolvedSizeId,
    priceRub: resolvedPrice,
  };
}

export function getProductDetailFields(product: CatalogProduct): Required<
  Pick<ProductDetailFields, "deliveryHint" | "care" | "availability">
> &
  ProductDetailFields {
  return {
    composition: product.composition,
    care: product.care ?? DEFAULT_CARE,
    deliveryHint: product.deliveryHint ?? DEFAULT_DELIVERY_HINT,
    availability: product.availability ?? DEFAULT_AVAILABILITY,
    badge: product.badge,
    isPopular: product.isPopular,
    isNew: product.isNew,
  };
}

export function getProductCompositionFallback(product: CatalogProduct): string {
  if (product.composition?.trim()) {
    return product.composition.trim();
  }

  if (product.stemCount && product.stemCount > 0) {
    return `Свежие ${product.description.toLowerCase()} в авторской упаковке Bellaflore. Каждый стебль отбирается вручную перед отправкой.`;
  }

  return `Авторская композиция «${product.title}»: свежие цветы премиального сорта и фирменная упаковка Bellaflore.`;
}
