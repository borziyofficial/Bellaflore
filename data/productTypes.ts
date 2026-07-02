// ==================================================
// SECTION: PRODUCT
// РАЗДЕЛ: Типы товара
//
// Purpose (EN): Admin-ready product size and detail field types.
//
// Назначение (RU): Типы размеров и деталей товара для будущей админки.
// ==================================================

export type ProductSizeLabel = "S" | "M" | "L" | "XL";

export type ProductSizeOption = {
  label: ProductSizeLabel;
  price: number;
};

export type ProductDetailFields = {
  composition?: string;
  care?: string;
  deliveryHint?: string;
  availability?: string;
  badge?: string;
  isPopular?: boolean;
  isNew?: boolean;
  whatsIncluded?: string;
};

export type ProductSelection = {
  sizeId: ProductSizeLabel;
  sizeLabel: ProductSizeLabel;
  priceRub: number;
};
