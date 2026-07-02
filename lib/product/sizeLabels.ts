import type { ProductSizeId } from "@/components/product/productExperienceTypes";

export const PRODUCT_SIZE_RU_LABELS: Record<ProductSizeId, string> = {
  S: "Малый",
  M: "Средний",
  L: "Большой",
  XL: "XL",
};

export function getProductSizeRuLabel(sizeId: ProductSizeId): string {
  return PRODUCT_SIZE_RU_LABELS[sizeId];
}
