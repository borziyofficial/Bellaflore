// ==================================================
// SECTION: ORDER INTELLIGENCE
// РАЗДЕЛ: Inventory integration bridge
// ==================================================
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";
import {
  confirmStockUsage,
  releaseStockReservation,
  reserveStockForOrder,
} from "@/components/inventoryIntelligence/inventoryReservationEngine";
import type {
  Order,
  OrderInventoryIntegrationPlan,
} from "@/components/orderIntelligence/orderIntelligenceTypes";
import { patchOrder } from "@/components/orderIntelligence/orderStoreEngine";

export const DEFAULT_ORDER_INVENTORY_PLAN: OrderInventoryIntegrationPlan = {
  reserveOnCreate: false,
  releaseOnCancel: true,
  confirmOnDeliver: true,
};

export function buildInventoryReservationItems(order: Order) {
  return order.items.flatMap((item) => ({
    productId: item.productId,
    sizeId: (item.sizeId ?? "S") as CatalogProductSizeId,
    quantity: item.quantity,
    addOnIds: item.addOnIds ?? [],
  }));
}

export function reserveInventoryForOrder(
  order: Order,
  plan: OrderInventoryIntegrationPlan = DEFAULT_ORDER_INVENTORY_PLAN,
): Order {
  if (!plan.reserveOnCreate) {
    return order;
  }

  try {
    reserveStockForOrder(order.id, buildInventoryReservationItems(order));
    return patchOrder(order.id, {
      inventoryReservationId: order.id,
    }) ?? order;
  } catch {
    return order;
  }
}

export function releaseInventoryForOrder(
  orderId: string,
  plan: OrderInventoryIntegrationPlan = DEFAULT_ORDER_INVENTORY_PLAN,
): void {
  if (!plan.releaseOnCancel) {
    return;
  }

  releaseStockReservation(orderId);
}

export function confirmInventoryForDeliveredOrder(
  orderId: string,
  plan: OrderInventoryIntegrationPlan = DEFAULT_ORDER_INVENTORY_PLAN,
): void {
  if (!plan.confirmOnDeliver) {
    return;
  }

  confirmStockUsage(orderId);
}

export function handleOrderInventoryOnCreate(
  order: Order,
  plan?: OrderInventoryIntegrationPlan,
): Order {
  return reserveInventoryForOrder(order, plan);
}

export function handleOrderInventoryOnCancel(
  orderId: string,
  plan?: OrderInventoryIntegrationPlan,
): void {
  releaseInventoryForOrder(orderId, plan);
}

export function handleOrderInventoryOnDelivered(
  orderId: string,
  plan?: OrderInventoryIntegrationPlan,
): void {
  confirmInventoryForDeliveredOrder(orderId, plan);
}
