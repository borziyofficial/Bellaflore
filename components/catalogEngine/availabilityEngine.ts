// ==================================================
// SECTION: CATALOG ENGINE
// РАЗДЕЛ: Availability Engine
//
// Purpose (EN): Product availability labels and storefront filtering.
//
// Назначение (RU): Статусы наличия и фильтрация для витрины.
// ==================================================
import type { ProductAvailabilityStatus } from "@/components/catalogEngine/catalogTypes";

export const AVAILABILITY_LABELS: Record<ProductAvailabilityStatus, string> = {
  in_stock: "В наличии",
  out_of_stock: "Нет в наличии",
  coming_soon: "Скоро появится",
  made_to_order: "Только под заказ",
};

export function getAvailabilityLabel(
  status: ProductAvailabilityStatus,
): string {
  return AVAILABILITY_LABELS[status];
}

export function isProductPurchasable(
  status: ProductAvailabilityStatus,
): boolean {
  return status === "in_stock" || status === "made_to_order";
}

export function isProductVisibleInCatalog(
  status: ProductAvailabilityStatus,
  isPublished: boolean,
): boolean {
  if (!isPublished) {
    return false;
  }

  return status !== "out_of_stock";
}

export function compareAvailabilityPriority(
  left: ProductAvailabilityStatus,
  right: ProductAvailabilityStatus,
): number {
  const order: ProductAvailabilityStatus[] = [
    "in_stock",
    "made_to_order",
    "coming_soon",
    "out_of_stock",
  ];

  return order.indexOf(left) - order.indexOf(right);
}
