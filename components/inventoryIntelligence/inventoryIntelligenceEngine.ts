// ==================================================
// SECTION: INVENTORY INTELLIGENCE
// РАЗДЕЛ: Main engine
// ==================================================
import { getPublishedCatalogProducts } from "@/components/catalogEngine/productCatalogEngine";
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";
import {
  buildInventoryEngineSnapshot,
  getCatalogProductInventoryAvailability,
  inspectCompositionCheck,
  inspectStockCatalog,
} from "@/components/inventoryIntelligence/inventoryCatalogBridge";
import { checkBouquetCompositionExample } from "@/components/inventoryIntelligence/compositionCheckerEngine";
import type { InventoryEngineSnapshot } from "@/components/inventoryIntelligence/inventoryCatalogBridge";

export function runInventoryIntelligenceEngine(
  sizeId: CatalogProductSizeId = "S",
): InventoryEngineSnapshot {
  return buildInventoryEngineSnapshot(getPublishedCatalogProducts(), sizeId);
}

export function getInventoryAvailabilityForProduct(
  productId: string,
  sizeId: CatalogProductSizeId = "S",
) {
  return getCatalogProductInventoryAvailability(productId, sizeId);
}

export function getInventoryStockSnapshot() {
  return inspectStockCatalog();
}

export function runCompositionCheck(productId: string, sizeId: CatalogProductSizeId = "S") {
  return inspectCompositionCheck(productId, sizeId);
}

export function getInventoryCompositionExample() {
  return checkBouquetCompositionExample();
}
