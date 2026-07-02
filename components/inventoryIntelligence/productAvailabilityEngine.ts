// ==================================================
// SECTION: INVENTORY INTELLIGENCE
// РАЗДЕЛ: Product availability engine
// ==================================================
import type { CatalogProductRecord, CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";
import { checkProductComposition } from "@/components/inventoryIntelligence/compositionCheckerEngine";
import { mergeInventoryStockWithAdmin } from "@/components/inventoryIntelligence/inventoryAdminStore";
import type {
  InventoryProductAvailabilityStatus,
  ProductAvailabilityResult,
} from "@/components/inventoryIntelligence/inventoryIntelligenceTypes";

export const INVENTORY_AVAILABILITY_LABELS: Record<
  InventoryProductAvailabilityStatus,
  string
> = {
  in_stock: "В наличии",
  low_stock: "Мало осталось",
  out_of_stock: "Нет в наличии",
  made_to_order: "Под заказ",
  seasonal_unavailable: "Сезонно недоступен",
  unavailable: "Сейчас недоступно",
};

export function getInventoryAvailabilityLabel(
  status: InventoryProductAvailabilityStatus,
): string {
  return INVENTORY_AVAILABILITY_LABELS[status];
}

export function isInventoryProductPurchasable(
  status: InventoryProductAvailabilityStatus,
): boolean {
  return (
    status === "in_stock" ||
    status === "low_stock" ||
    status === "made_to_order"
  );
}

export function resolveProductAvailability(
  productId: string,
  sizeId: CatalogProductSizeId = "S",
  now: Date = new Date(),
): ProductAvailabilityResult {
  const stockItems = mergeInventoryStockWithAdmin();
  const composition = checkProductComposition(productId, sizeId, stockItems, now);

  return {
    productId,
    sizeId,
    status: composition.status,
    label: getInventoryAvailabilityLabel(composition.status),
    isPurchasable: isInventoryProductPurchasable(composition.status),
    composition,
  };
}

export function resolveCatalogProductAvailability(
  product: CatalogProductRecord,
  sizeId: CatalogProductSizeId = "S",
  now: Date = new Date(),
): ProductAvailabilityResult {
  const inventoryResult = resolveProductAvailability(product.id, sizeId, now);

  if (product.availability === "made_to_order") {
    return {
      ...inventoryResult,
      status: "made_to_order",
      label: getInventoryAvailabilityLabel("made_to_order"),
      isPurchasable: true,
      composition: {
        ...inventoryResult.composition,
        canAssemble: true,
        status: "made_to_order",
        reasonSummary: "Собирается только под заказ",
      },
    };
  }

  if (!product.isPublished || product.status === "ARCHIVED") {
    return {
      ...inventoryResult,
      status: "unavailable",
      label: getInventoryAvailabilityLabel("unavailable"),
      isPurchasable: false,
    };
  }

  return inventoryResult;
}

export function buildCatalogAvailabilityIndex(
  products: CatalogProductRecord[],
  sizeId: CatalogProductSizeId = "S",
): Record<string, ProductAvailabilityResult> {
  return products.reduce<Record<string, ProductAvailabilityResult>>(
    (accumulator, product) => {
      accumulator[product.id] = resolveCatalogProductAvailability(
        product,
        sizeId,
      );
      return accumulator;
    },
    {},
  );
}
