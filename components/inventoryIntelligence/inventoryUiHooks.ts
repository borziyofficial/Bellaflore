// ==================================================
// SECTION: INVENTORY INTELLIGENCE
// РАЗДЕЛ: UI hooks
// ==================================================
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";
import {
  getInventoryAvailabilityLabel,
  isInventoryProductPurchasable,
  resolveProductAvailability,
} from "@/components/inventoryIntelligence/productAvailabilityEngine";

export type ProductCardAvailabilityBadge = {
  productId: string;
  sizeId: CatalogProductSizeId;
  status: ReturnType<typeof resolveProductAvailability>["status"];
  label: string;
  tone: "success" | "warning" | "neutral" | "danger";
  isPurchasable: boolean;
  reasonSummary: string;
};

export type CheckoutAvailabilityWarning = {
  productId: string;
  sizeId: CatalogProductSizeId;
  hasWarning: boolean;
  canProceed: boolean;
  title: string;
  message: string;
  missingItems: Array<{ title: string; requiredQuantity: number; availableQuantity: number }>;
  replacementSuggestions: Array<{ replacementTitle: string; availableQuantity: number }>;
};

function resolveBadgeTone(
  status: ProductCardAvailabilityBadge["status"],
): ProductCardAvailabilityBadge["tone"] {
  switch (status) {
    case "in_stock":
      return "success";
    case "low_stock":
    case "made_to_order":
      return "warning";
    case "out_of_stock":
    case "seasonal_unavailable":
    case "unavailable":
      return "danger";
    default:
      return "neutral";
  }
}

export function getProductCardAvailabilityBadge(
  productId: string,
  sizeId: CatalogProductSizeId = "S",
  now: Date = new Date(),
): ProductCardAvailabilityBadge {
  const availability = resolveProductAvailability(productId, sizeId, now);

  return {
    productId,
    sizeId,
    status: availability.status,
    label: availability.label,
    tone: resolveBadgeTone(availability.status),
    isPurchasable: availability.isPurchasable,
    reasonSummary: availability.composition.reasonSummary,
  };
}

export function getCheckoutAvailabilityWarning(
  productId: string,
  sizeId: CatalogProductSizeId = "S",
  now: Date = new Date(),
): CheckoutAvailabilityWarning {
  const availability = resolveProductAvailability(productId, sizeId, now);
  const { composition } = availability;
  const hasWarning = !composition.canAssemble && availability.status !== "made_to_order";
  const canProceed = isInventoryProductPurchasable(availability.status);

  let title = "Проверка наличия";
  let message = composition.reasonSummary;

  if (availability.status === "made_to_order") {
    title = "Под заказ";
    message = "Букет собирается под заказ — склад резервируется отдельно.";
  } else if (availability.status === "low_stock") {
    title = "Мало осталось";
    message = "Осталось мало цветов — рекомендуем оформить заказ сегодня.";
  } else if (hasWarning) {
    title = "Сейчас недоступно";
    message = `Букет нельзя собрать: ${composition.missingItems
      .map((item) => item.title)
      .join(", ")}.`;
  } else if (availability.status === "in_stock") {
    title = "В наличии";
    message = "Букет можно собрать прямо сейчас.";
  }

  return {
    productId,
    sizeId,
    hasWarning,
    canProceed,
    title,
    message,
    missingItems: composition.missingItems.map((item) => ({
      title: item.title,
      requiredQuantity: item.requiredQuantity,
      availableQuantity: item.availableQuantity,
    })),
    replacementSuggestions: composition.replacementSuggestions.map(
      (suggestion) => ({
        replacementTitle: suggestion.replacementTitle,
        availableQuantity: suggestion.availableQuantity,
      }),
    ),
  };
}

export function getInventoryUiLabel(
  status: ProductCardAvailabilityBadge["status"],
): string {
  return getInventoryAvailabilityLabel(status);
}
