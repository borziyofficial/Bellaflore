// ==================================================
// SECTION: ADMIN INTELLIGENCE
// РАЗДЕЛ: Inventory bridge (read-only)
// ==================================================
import {
  getAvailableStockQuantity,
  isStockSeasonallyAvailable,
} from "@/components/inventoryIntelligence/compositionCheckerEngine";
import { mergeInventoryStockWithAdmin } from "@/components/inventoryIntelligence/inventoryAdminStore";
import { listStockReservations } from "@/components/inventoryIntelligence/inventoryReservationEngine";

export type AdminInventoryBridgeItem = {
  id: string;
  name: string;
  availableQuantity: number;
  isSeasonallyAvailable: boolean;
  isLowStock: boolean;
};

export type AdminInventoryBridgeSummary = {
  totalItems: number;
  lowStockItems: number;
  activeReservations: number;
  items: AdminInventoryBridgeItem[];
  generatedAt: string;
};

const LOW_STOCK_THRESHOLD = 5;

export function buildAdminInventorySummary(
  limit = 10,
): AdminInventoryBridgeSummary {
  const stockItems = mergeInventoryStockWithAdmin();
  const reservations = listStockReservations();

  const items: AdminInventoryBridgeItem[] = stockItems
    .map((item) => {
      const availableQuantity = getAvailableStockQuantity(item);
      return {
        id: item.id,
        name: item.title,
        availableQuantity,
        isSeasonallyAvailable: isStockSeasonallyAvailable(item),
        isLowStock: availableQuantity <= LOW_STOCK_THRESHOLD,
      };
    })
    .slice(0, limit);

  const lowStockItems = stockItems.filter(
    (item) => getAvailableStockQuantity(item) <= LOW_STOCK_THRESHOLD,
  ).length;

  return {
    totalItems: stockItems.length,
    lowStockItems,
    activeReservations: reservations.filter(
      (reservation) => reservation.status === "reserved",
    ).length,
    items,
    generatedAt: new Date().toISOString(),
  };
}

export function getAdminInventoryAttentionCount(): number {
  return buildAdminInventorySummary(0).lowStockItems;
}
