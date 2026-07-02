// ==================================================
// SECTION: INVENTORY INTELLIGENCE
// РАЗДЕЛ: Admin overrides store
// ==================================================
import { INVENTORY_STOCK_CATALOG_SEED } from "@/components/inventoryIntelligence/inventoryStockCatalog";
import type {
  InventoryAdminOverride,
  InventoryItem,
} from "@/components/inventoryIntelligence/inventoryIntelligenceTypes";

export const INVENTORY_ADMIN_STORAGE_KEY = "bellaflore_inventory_admin_v1";

export const DEFAULT_INVENTORY_ADMIN_OVERRIDE: InventoryAdminOverride = {
  stockOverrides: {},
  disabledStockItemIds: [],
  rulesVersion: "bellaflore_inventory_admin_v1",
  updatedAt: new Date().toISOString(),
};

export function readInventoryAdminOverride(): InventoryAdminOverride {
  if (typeof window === "undefined") {
    return DEFAULT_INVENTORY_ADMIN_OVERRIDE;
  }

  try {
    const raw = window.localStorage.getItem(INVENTORY_ADMIN_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_INVENTORY_ADMIN_OVERRIDE;
    }

    const parsed = JSON.parse(raw) as Partial<InventoryAdminOverride>;
    return {
      ...DEFAULT_INVENTORY_ADMIN_OVERRIDE,
      ...parsed,
      stockOverrides: parsed.stockOverrides ?? {},
      disabledStockItemIds: parsed.disabledStockItemIds ?? [],
    };
  } catch {
    return DEFAULT_INVENTORY_ADMIN_OVERRIDE;
  }
}

export function writeInventoryAdminOverride(
  override: InventoryAdminOverride,
): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(INVENTORY_ADMIN_STORAGE_KEY, JSON.stringify(override));
  } catch {
    // Optional admin storage.
  }
}

export function mergeInventoryStockWithAdmin(
  adminOverride: InventoryAdminOverride = readInventoryAdminOverride(),
): InventoryItem[] {
  const disabled = new Set(adminOverride.disabledStockItemIds);

  return INVENTORY_STOCK_CATALOG_SEED.map((seedItem) => {
    const override = adminOverride.stockOverrides[seedItem.id] ?? {};
    const merged: InventoryItem = {
      ...seedItem,
      ...override,
      id: seedItem.id,
      title: seedItem.title,
      type: seedItem.type,
      isActive: disabled.has(seedItem.id)
        ? false
        : (override.isActive ?? seedItem.isActive),
    };

    return merged;
  });
}

export function upsertInventoryStockOverride(
  stockItemId: string,
  patch: InventoryAdminOverride["stockOverrides"][string],
): InventoryAdminOverride {
  const current = readInventoryAdminOverride();
  const next: InventoryAdminOverride = {
    ...current,
    stockOverrides: {
      ...current.stockOverrides,
      [stockItemId]: {
        ...current.stockOverrides[stockItemId],
        ...patch,
      },
    },
    updatedAt: new Date().toISOString(),
  };

  writeInventoryAdminOverride(next);
  return next;
}
