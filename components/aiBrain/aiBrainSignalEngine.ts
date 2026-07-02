// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Signal engine
// ==================================================
import type {
  AiBrainSignal,
  AiBrainSignalKind,
} from "@/components/aiBrain/aiBrainTypes";
import type { AiOrderBridgeSnapshot } from "@/components/aiBrain/aiOrderBridge";
import type { AiInventoryBridgeSnapshot } from "@/components/aiBrain/aiInventoryBridge";
import type { AiCourierBridgeSnapshot } from "@/components/aiBrain/aiCourierBridge";
import type { AiDeliveryBridgeSnapshot } from "@/components/aiBrain/aiDeliveryBridge";
import type { AiNotificationBridgeSnapshot } from "@/components/aiBrain/aiNotificationBridge";
import type { AiWorkflowBridgeSnapshot } from "@/components/aiBrain/aiWorkflowBridge";
import type { AiAdminBridgeSnapshot } from "@/components/aiBrain/aiAdminBridge";
import type { AiCatalogBridgeSnapshot } from "@/components/aiBrain/aiCatalogBridge";

export type AiBrainBridgeSnapshots = {
  orders: AiOrderBridgeSnapshot;
  inventory: AiInventoryBridgeSnapshot;
  couriers: AiCourierBridgeSnapshot;
  delivery: AiDeliveryBridgeSnapshot;
  notifications: AiNotificationBridgeSnapshot;
  workflow: AiWorkflowBridgeSnapshot;
  admin: AiAdminBridgeSnapshot;
  catalog: AiCatalogBridgeSnapshot;
};

let signalCounter = 0;

function nextSignalId(kind: AiBrainSignalKind): string {
  signalCounter += 1;
  return `signal-${kind}-${signalCounter}`;
}

function buildSignal(
  input: Omit<AiBrainSignal, "id">,
): AiBrainSignal {
  return {
    id: nextSignalId(input.kind),
    ...input,
  };
}

export function detectAiBrainSignals(
  snapshots: AiBrainBridgeSnapshots,
): AiBrainSignal[] {
  const signals: AiBrainSignal[] = [];
  const now = new Date().toISOString();

  if (snapshots.orders.summary.newOrders >= 3) {
    signals.push(
      buildSignal({
        kind: "order_volume_high",
        moduleId: "orderIntelligence",
        priority: snapshots.orders.summary.newOrders >= 6 ? "high" : "normal",
        title: "Повышенный поток заказов",
        message: `Новых заказов: ${snapshots.orders.summary.newOrders}`,
        resourceType: null,
        resourceId: null,
        detectedAt: now,
        metadata: { newOrders: snapshots.orders.summary.newOrders },
      }),
    );
  }

  if (snapshots.orders.unconfirmedOrderIds.length > 0) {
    signals.push(
      buildSignal({
        kind: "order_not_confirmed",
        moduleId: "orderIntelligence",
        priority:
          snapshots.orders.unconfirmedOrderIds.length >= 3 ? "high" : "normal",
        title: "Заказы без подтверждения",
        message: `Ожидают подтверждения: ${snapshots.orders.unconfirmedOrderIds.length}`,
        resourceType: "order",
        resourceId: snapshots.orders.unconfirmedOrderIds[0] ?? null,
        detectedAt: now,
        metadata: { orderIds: snapshots.orders.unconfirmedOrderIds },
      }),
    );
  }

  if (snapshots.inventory.summary.lowStockItems > 0) {
    signals.push(
      buildSignal({
        kind: "inventory_low_stock",
        moduleId: "inventoryIntelligence",
        priority: snapshots.inventory.summary.lowStockItems >= 3 ? "high" : "normal",
        title: "Низкий остаток на складе",
        message: `Позиций с низким остатком: ${snapshots.inventory.summary.lowStockItems}`,
        resourceType: "inventory_item",
        resourceId: snapshots.inventory.lowStockItemIds[0] ?? null,
        detectedAt: now,
        metadata: { itemIds: snapshots.inventory.lowStockItemIds },
      }),
    );
  }

  if (snapshots.inventory.outOfStockItemIds.length > 0) {
    signals.push(
      buildSignal({
        kind: "inventory_out_of_stock",
        moduleId: "inventoryIntelligence",
        priority: "critical",
        title: "Нет в наличии",
        message: `Позиций out of stock: ${snapshots.inventory.outOfStockItemIds.length}`,
        resourceType: "inventory_item",
        resourceId: snapshots.inventory.outOfStockItemIds[0] ?? null,
        detectedAt: now,
        metadata: { itemIds: snapshots.inventory.outOfStockItemIds },
      }),
    );
  }

  if (snapshots.couriers.overloadedCourierIds.length > 0) {
    signals.push(
      buildSignal({
        kind: "courier_overloaded",
        moduleId: "courierIntelligence",
        priority: "high",
        title: "Перегрузка курьеров",
        message: `Перегружено курьеров: ${snapshots.couriers.overloadedCourierIds.length}`,
        resourceType: "courier",
        resourceId: snapshots.couriers.overloadedCourierIds[0] ?? null,
        detectedAt: now,
        metadata: { courierIds: snapshots.couriers.overloadedCourierIds },
      }),
    );
  }

  if (snapshots.delivery.delayedTaskIds.length > 0) {
    signals.push(
      buildSignal({
        kind: "delivery_delay_risk",
        moduleId: "deliveryIntelligence",
        priority: "high",
        title: "Риск задержки доставки",
        message: `Задач с высоким риском: ${snapshots.delivery.delayedTaskIds.length}`,
        resourceType: "delivery_task",
        resourceId: snapshots.delivery.delayedTaskIds[0] ?? null,
        detectedAt: now,
        metadata: { taskIds: snapshots.delivery.delayedTaskIds },
      }),
    );
  }

  if (snapshots.notifications.failedNotificationIds.length > 0) {
    signals.push(
      buildSignal({
        kind: "notification_failed",
        moduleId: "notificationIntelligence",
        priority: "high",
        title: "Ошибки уведомлений",
        message: `Failed notifications: ${snapshots.notifications.failedNotificationIds.length}`,
        resourceType: "notification",
        resourceId: snapshots.notifications.failedNotificationIds[0] ?? null,
        detectedAt: now,
        metadata: {
          notificationIds: snapshots.notifications.failedNotificationIds,
        },
      }),
    );
  }

  if (snapshots.workflow.failedWorkflowIds.length > 0) {
    signals.push(
      buildSignal({
        kind: "workflow_failed",
        moduleId: "workflowIntelligence",
        priority: "critical",
        title: "Workflow завершились с ошибкой",
        message: `Failed workflows: ${snapshots.workflow.failedWorkflowIds.length}`,
        resourceType: "workflow",
        resourceId: snapshots.workflow.failedWorkflowIds[0] ?? null,
        detectedAt: now,
        metadata: { workflowIds: snapshots.workflow.failedWorkflowIds },
      }),
    );
  }

  if (snapshots.orders.summary.inProgressOrders >= 5) {
    signals.push(
      buildSignal({
        kind: "product_demand_high",
        moduleId: "catalogEngine",
        priority: "normal",
        title: "Высокий спрос на продукты",
        message: `Заказов в работе: ${snapshots.orders.summary.inProgressOrders}`,
        resourceType: null,
        resourceId: null,
        detectedAt: now,
        metadata: {
          inProgressOrders: snapshots.orders.summary.inProgressOrders,
          topProducts: snapshots.catalog.topPublishedProductIds,
        },
      }),
    );
  }

  if (
    snapshots.catalog.unavailableProductIds.length > 0 &&
    snapshots.catalog.publishedProducts > 0
  ) {
    const unavailableRatio =
      snapshots.catalog.unavailableProductIds.length /
      snapshots.catalog.publishedProducts;

    if (unavailableRatio >= 0.2) {
      signals.push(
        buildSignal({
          kind: "conversion_drop",
          moduleId: "catalogEngine",
          priority: unavailableRatio >= 0.4 ? "high" : "normal",
          title: "Риск падения конверсии",
          message: `Недоступных товаров: ${Math.round(unavailableRatio * 100)}% каталога`,
          resourceType: "catalog_product",
          resourceId: snapshots.catalog.unavailableProductIds[0] ?? null,
          detectedAt: now,
          metadata: {
            unavailableRatio,
            unavailableProductIds: snapshots.catalog.unavailableProductIds,
          },
        }),
      );
    }
  }

  if (snapshots.admin.attentionItemsCount >= 5) {
    signals.push(
      buildSignal({
        kind: "system_health_warning",
        moduleId: "adminIntelligence",
        priority: snapshots.admin.attentionItemsCount >= 10 ? "critical" : "high",
        title: "Системное предупреждение",
        message: `Attention items: ${snapshots.admin.attentionItemsCount}`,
        resourceType: null,
        resourceId: null,
        detectedAt: now,
        metadata: {
          attentionItemsCount: snapshots.admin.attentionItemsCount,
        },
      }),
    );
  }

  return signals;
}

export function resetAiBrainSignalCounter(): void {
  signalCounter = 0;
}

export const AI_BRAIN_SIGNAL_KINDS: AiBrainSignalKind[] = [
  "order_volume_high",
  "order_not_confirmed",
  "inventory_low_stock",
  "inventory_out_of_stock",
  "courier_overloaded",
  "delivery_delay_risk",
  "notification_failed",
  "workflow_failed",
  "product_demand_high",
  "conversion_drop",
  "system_health_warning",
];
