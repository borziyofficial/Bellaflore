// ==================================================
// SECTION: INVENTORY INTELLIGENCE
// РАЗДЕЛ: Типы
//
// Purpose (EN): Inventory domain types for Bellaflore stock foundation.
//
// Назначение (RU): Типы домена склада Bellaflore.
// ==================================================
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";

export type InventoryItemType = "flower" | "add_on";

export type InventoryProductAvailabilityStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock"
  | "made_to_order"
  | "seasonal_unavailable"
  | "unavailable";

export type InventoryItem = {
  id: string;
  title: string;
  type: InventoryItemType;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold: number;
  isSeasonal: boolean;
  seasonMonths: number[];
  replacementIds: string[];
  isActive: boolean;
};

export type FlowerStockItem = InventoryItem & {
  type: "flower";
  flowerKey: string;
};

export type AddOnStockItem = InventoryItem & {
  type: "add_on";
  addOnCatalogId: string;
};

export type ProductCompositionRequirement = {
  stockItemId: string;
  quantityBySize: Partial<Record<CatalogProductSizeId, number>>;
  scalesWithSize?: boolean;
};

export type ProductCompositionDefinition = {
  productId: string;
  requirements: ProductCompositionRequirement[];
  forceMadeToOrder?: boolean;
};

export type CompositionMissingItem = {
  stockItemId: string;
  title: string;
  requiredQuantity: number;
  availableQuantity: number;
  reason: "out_of_stock" | "seasonal_unavailable" | "inactive" | "reserved";
};

export type CompositionReplacementSuggestion = {
  missingStockItemId: string;
  replacementStockItemId: string;
  replacementTitle: string;
  availableQuantity: number;
};

export type CompositionCheckResult = {
  productId: string;
  sizeId: CatalogProductSizeId;
  canAssemble: boolean;
  status: InventoryProductAvailabilityStatus;
  missingItems: CompositionMissingItem[];
  replacementSuggestions: CompositionReplacementSuggestion[];
  reasonSummary: string;
};

export type ProductAvailabilityResult = {
  productId: string;
  sizeId: CatalogProductSizeId;
  status: InventoryProductAvailabilityStatus;
  label: string;
  isPurchasable: boolean;
  composition: CompositionCheckResult;
};

export type StockReservationLine = {
  stockItemId: string;
  quantity: number;
};

export type StockReservation = {
  orderId: string;
  items: StockReservationLine[];
  status: "reserved" | "confirmed" | "released";
  createdAt: string;
  updatedAt: string;
};

export type InventoryAdminOverride = {
  stockOverrides: Partial<
    Record<
      string,
      Partial<
        Pick<
          InventoryItem,
          | "quantity"
          | "reservedQuantity"
          | "lowStockThreshold"
          | "isSeasonal"
          | "seasonMonths"
          | "replacementIds"
          | "isActive"
        >
      >
    >
  >;
  disabledStockItemIds: string[];
  rulesVersion: string;
  updatedAt: string;
};

export type AiInventoryHooks = {
  predictLowStock?: () => Promise<InventoryItem[]>;
  suggestPurchaseOrder?: () => Promise<
    Array<{ stockItemId: string; suggestedQuantity: number; reason: string }>
  >;
  suggestReplacement?: (
    missingStockItemId: string,
  ) => Promise<CompositionReplacementSuggestion[]>;
  analyzeInventoryDemand?: () => Promise<
    Array<{ stockItemId: string; demandScore: number; reason: string }>
  >;
};
