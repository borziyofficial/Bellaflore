// ==================================================
// SECTION: INVENTORY INTELLIGENCE
// РАЗДЕЛ: Composition checker
// ==================================================
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";
import {
  getProductComposition,
  resolveRequirementQuantity,
} from "@/components/inventoryIntelligence/productCompositionCatalog";
import type {
  CompositionCheckResult,
  CompositionMissingItem,
  CompositionReplacementSuggestion,
  InventoryItem,
  InventoryProductAvailabilityStatus,
} from "@/components/inventoryIntelligence/inventoryIntelligenceTypes";

export function getAvailableStockQuantity(item: InventoryItem): number {
  return Math.max(0, item.quantity - item.reservedQuantity);
}

export function isStockSeasonallyAvailable(
  item: InventoryItem,
  now: Date = new Date(),
): boolean {
  if (!item.isSeasonal || item.seasonMonths.length === 0) {
    return true;
  }

  const month = now.getMonth() + 1;
  return item.seasonMonths.includes(month);
}

function buildReplacementSuggestions(
  missingStockItemId: string,
  stockById: Map<string, InventoryItem>,
): CompositionReplacementSuggestion[] {
  const missingItem = stockById.get(missingStockItemId);
  if (!missingItem) {
    return [];
  }

  return missingItem.replacementIds
    .map((replacementId) => {
      const replacement = stockById.get(replacementId);
      if (!replacement || !replacement.isActive) {
        return null;
      }

      const availableQuantity = getAvailableStockQuantity(replacement);
      if (availableQuantity <= 0 || !isStockSeasonallyAvailable(replacement)) {
        return null;
      }

      return {
        missingStockItemId,
        replacementStockItemId: replacementId,
        replacementTitle: replacement.title,
        availableQuantity,
      };
    })
    .filter(
      (suggestion): suggestion is CompositionReplacementSuggestion =>
        suggestion !== null,
    );
}

function resolveStatusFromComposition(
  canAssemble: boolean,
  missingItems: CompositionMissingItem[],
  forceMadeToOrder: boolean,
  stockItems: InventoryItem[],
): InventoryProductAvailabilityStatus {
  if (forceMadeToOrder) {
    return "made_to_order";
  }

  if (!canAssemble) {
    if (
      missingItems.some((item) => item.reason === "seasonal_unavailable")
    ) {
      return "seasonal_unavailable";
    }

    if (missingItems.some((item) => item.reason === "inactive")) {
      return "unavailable";
    }

    return "out_of_stock";
  }

  const hasLowStock = stockItems.some((item) => {
    const available = getAvailableStockQuantity(item);
    return (
      available > 0 &&
      available <= item.lowStockThreshold &&
      item.isActive
    );
  });

  if (hasLowStock) {
    return "low_stock";
  }

  return "in_stock";
}

export function checkProductComposition(
  productId: string,
  sizeId: CatalogProductSizeId = "S",
  stockItems: InventoryItem[],
  now: Date = new Date(),
): CompositionCheckResult {
  const composition = getProductComposition(productId);
  const stockById = new Map(stockItems.map((item) => [item.id, item]));

  if (!composition) {
    return {
      productId,
      sizeId,
      canAssemble: true,
      status: "in_stock",
      missingItems: [],
      replacementSuggestions: [],
      reasonSummary: "Состав не задан — доступен по умолчанию",
    };
  }

  if (composition.forceMadeToOrder) {
    return {
      productId,
      sizeId,
      canAssemble: true,
      status: "made_to_order",
      missingItems: [],
      replacementSuggestions: [],
      reasonSummary: "Собирается только под заказ",
    };
  }

  const missingItems: CompositionMissingItem[] = [];
  const replacementSuggestions: CompositionReplacementSuggestion[] = [];
  const touchedStockItems: InventoryItem[] = [];

  for (const requirement of composition.requirements) {
    const stockItem = stockById.get(requirement.stockItemId);
    const requiredQuantity = resolveRequirementQuantity(requirement, sizeId);

    if (!stockItem || !stockItem.isActive) {
      missingItems.push({
        stockItemId: requirement.stockItemId,
        title: stockItem?.title ?? requirement.stockItemId,
        requiredQuantity,
        availableQuantity: 0,
        reason: "inactive",
      });
      continue;
    }

    touchedStockItems.push(stockItem);

    if (!isStockSeasonallyAvailable(stockItem, now)) {
      missingItems.push({
        stockItemId: stockItem.id,
        title: stockItem.title,
        requiredQuantity,
        availableQuantity: getAvailableStockQuantity(stockItem),
        reason: "seasonal_unavailable",
      });
      replacementSuggestions.push(
        ...buildReplacementSuggestions(stockItem.id, stockById),
      );
      continue;
    }

    const availableQuantity = getAvailableStockQuantity(stockItem);
    if (availableQuantity < requiredQuantity) {
      missingItems.push({
        stockItemId: stockItem.id,
        title: stockItem.title,
        requiredQuantity,
        availableQuantity,
        reason: availableQuantity === 0 ? "out_of_stock" : "reserved",
      });
      replacementSuggestions.push(
        ...buildReplacementSuggestions(stockItem.id, stockById),
      );
    }
  }

  const canAssemble = missingItems.length === 0;
  const status = resolveStatusFromComposition(
    canAssemble,
    missingItems,
    Boolean(composition.forceMadeToOrder),
    touchedStockItems,
  );

  const reasonSummary = canAssemble
    ? status === "low_stock"
      ? "Мало осталось на складе"
      : "Можно собрать по составу"
    : `Не хватает: ${missingItems.map((item) => item.title).join(", ")}`;

  const uniqueReplacements = replacementSuggestions.filter(
    (suggestion, index, list) =>
      list.findIndex(
        (entry) =>
          entry.replacementStockItemId === suggestion.replacementStockItemId,
      ) === index,
  );

  return {
    productId,
    sizeId,
    canAssemble,
    status,
    missingItems,
    replacementSuggestions: uniqueReplacements,
    reasonSummary,
  };
}

export function checkBouquetCompositionExample(): CompositionCheckResult {
  const exampleStock: InventoryItem[] = [
    {
      id: "white_rose",
      title: "Белая роза",
      type: "flower",
      quantity: 100,
      reservedQuantity: 0,
      lowStockThreshold: 20,
      isSeasonal: false,
      seasonMonths: [],
      replacementIds: ["eustoma"],
      isActive: true,
    },
    {
      id: "hydrangea",
      title: "Гортензия",
      type: "flower",
      quantity: 0,
      reservedQuantity: 0,
      lowStockThreshold: 10,
      isSeasonal: false,
      seasonMonths: [],
      replacementIds: ["eustoma"],
      isActive: true,
    },
    {
      id: "peony",
      title: "Пион",
      type: "flower",
      quantity: 30,
      reservedQuantity: 0,
      lowStockThreshold: 8,
      isSeasonal: true,
      seasonMonths: [4, 5, 6, 7],
      replacementIds: ["hydrangea"],
      isActive: true,
    },
    {
      id: "eustoma",
      title: "Эустома",
      type: "flower",
      quantity: 95,
      reservedQuantity: 0,
      lowStockThreshold: 15,
      isSeasonal: false,
      seasonMonths: [],
      replacementIds: [],
      isActive: true,
    },
    {
      id: "eucalyptus",
      title: "Эвкалипт",
      type: "flower",
      quantity: 140,
      reservedQuantity: 0,
      lowStockThreshold: 20,
      isSeasonal: false,
      seasonMonths: [],
      replacementIds: [],
      isActive: true,
    },
  ];

  return checkProductComposition("royal-collection", "S", exampleStock);
}
