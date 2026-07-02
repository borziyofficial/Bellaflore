// ==================================================
// SECTION: NOTIFICATION INTELLIGENCE
// РАЗДЕЛ: Inventory notification bridge
// ==================================================
import { mergeInventoryStockWithAdmin } from "@/components/inventoryIntelligence/inventoryAdminStore";
import { getAvailableStockQuantity } from "@/components/inventoryIntelligence/compositionCheckerEngine";
import type {
  NotificationEvent,
  NotificationSourceEventKind,
} from "@/components/notificationIntelligence/notificationIntelligenceTypes";

export function buildInventoryNotificationEvent(
  kind: NotificationSourceEventKind,
  stockItemId: string,
): NotificationEvent | null {
  const stockItem = mergeInventoryStockWithAdmin().find(
    (item) => item.id === stockItemId,
  );

  if (!stockItem) {
    return null;
  }

  const now = new Date().toISOString();
  const available = getAvailableStockQuantity(stockItem);

  return {
    id: `NEI-INV-${kind}-${stockItemId}-${Date.parse(now)}`,
    kind,
    source: "inventory",
    title: kind,
    payload: {
      stockItemId,
      stockItemTitle: stockItem.title,
      stockQuantity: available,
      lowStockThreshold: stockItem.lowStockThreshold,
    },
    occurredAt: now,
    stockItemId,
  };
}

export function buildLowStockNotificationEvent(
  stockItemId: string,
): NotificationEvent | null {
  return buildInventoryNotificationEvent("low_stock", stockItemId);
}

export function buildOutOfStockNotificationEvent(
  stockItemId: string,
): NotificationEvent | null {
  return buildInventoryNotificationEvent("out_of_stock", stockItemId);
}

export function buildReplacementNeededNotificationEvent(
  stockItemId: string,
): NotificationEvent | null {
  return buildInventoryNotificationEvent("replacement_needed", stockItemId);
}

export function scanInventoryForNotificationEvents(): NotificationEvent[] {
  const events: NotificationEvent[] = [];

  for (const item of mergeInventoryStockWithAdmin()) {
    const available = getAvailableStockQuantity(item);

    if (available <= 0) {
      const outOfStock = buildOutOfStockNotificationEvent(item.id);
      if (outOfStock) {
        events.push(outOfStock);
      }
      continue;
    }

    if (available <= item.lowStockThreshold) {
      const lowStock = buildLowStockNotificationEvent(item.id);
      if (lowStock) {
        events.push(lowStock);
      }
    }
  }

  return events;
}
