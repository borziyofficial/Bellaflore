// ==================================================
// SECTION: INVENTORY INTELLIGENCE
// РАЗДЕЛ: Catalog bridge
// ==================================================
import type { CatalogProductRecord, CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";
import type { ProductAvailabilityStatus } from "@/components/catalogEngine/catalogTypes";
import { getPublishedCatalogProducts } from "@/components/catalogEngine/productCatalogEngine";
import { mergeInventoryStockWithAdmin } from "@/components/inventoryIntelligence/inventoryAdminStore";
import { checkProductComposition } from "@/components/inventoryIntelligence/compositionCheckerEngine";
import {
  buildCatalogAvailabilityIndex,
  resolveCatalogProductAvailability,
} from "@/components/inventoryIntelligence/productAvailabilityEngine";
import type {
  InventoryItem,
  InventoryProductAvailabilityStatus,
  ProductAvailabilityResult,
} from "@/components/inventoryIntelligence/inventoryIntelligenceTypes";

export type InventoryEngineSnapshot = {
  stockItems: InventoryItem[];
  availabilityByProductId: Record<string, ProductAvailabilityResult>;
  generatedAt: string;
};

export function mapInventoryStatusToCatalogStatus(
  status: InventoryProductAvailabilityStatus,
): ProductAvailabilityStatus {
  switch (status) {
    case "in_stock":
    case "low_stock":
      return "in_stock";
    case "made_to_order":
      return "made_to_order";
    case "out_of_stock":
    case "seasonal_unavailable":
    case "unavailable":
      return "out_of_stock";
    default:
      return "out_of_stock";
  }
}

export function buildInventoryEngineSnapshot(
  products: CatalogProductRecord[] = getPublishedCatalogProducts(),
  sizeId: CatalogProductSizeId = "S",
  now: Date = new Date(),
): InventoryEngineSnapshot {
  const stockItems = mergeInventoryStockWithAdmin();

  return {
    stockItems,
    availabilityByProductId: buildCatalogAvailabilityIndex(products, sizeId),
    generatedAt: now.toISOString(),
  };
}

export function getCatalogProductInventoryAvailability(
  productId: string,
  sizeId: CatalogProductSizeId = "S",
  products: CatalogProductRecord[] = getPublishedCatalogProducts(),
): ProductAvailabilityResult | null {
  const product = products.find((entry) => entry.id === productId);
  if (!product) {
    return null;
  }

  return resolveCatalogProductAvailability(product, sizeId);
}

export function inspectProductCompositionFromCatalog(
  productId: string,
  sizeId: CatalogProductSizeId = "S",
): ProductAvailabilityResult | null {
  return getCatalogProductInventoryAvailability(productId, sizeId);
}

export function inspectStockCatalog(): InventoryItem[] {
  return mergeInventoryStockWithAdmin();
}

export function inspectCompositionCheck(
  productId: string,
  sizeId: CatalogProductSizeId = "S",
) {
  return checkProductComposition(
    productId,
    sizeId,
    mergeInventoryStockWithAdmin(),
  );
}
