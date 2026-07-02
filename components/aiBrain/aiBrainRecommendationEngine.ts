// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Recommendation engine
// ==================================================
import { buildSafeAiBrainAction } from "@/components/aiBrain/aiBrainActionSafety";
import type {
  AiBrainRecommendation,
  AiBrainRecommendationKind,
  AiBrainRisk,
  AiBrainSignal,
} from "@/components/aiBrain/aiBrainTypes";
import type { AiBrainBridgeSnapshots } from "@/components/aiBrain/aiBrainSignalEngine";

let recommendationCounter = 0;

function nextRecommendationId(kind: AiBrainRecommendationKind): string {
  recommendationCounter += 1;
  return `rec-${kind}-${recommendationCounter}`;
}

function findRisk(
  risks: AiBrainRisk[],
  kind: AiBrainRisk["kind"],
): AiBrainRisk | null {
  return risks.find((risk) => risk.kind === kind) ?? null;
}

function findSignal(
  signals: AiBrainSignal[],
  kind: AiBrainSignal["kind"],
): AiBrainSignal | null {
  return signals.find((signal) => signal.kind === kind) ?? null;
}

function buildRecommendation(
  input: Omit<AiBrainRecommendation, "id" | "createdAt" | "action"> & {
    action: Omit<
      AiBrainRecommendation["action"],
      "mode" | "id"
    > & {
      mode?: AiBrainRecommendation["action"]["mode"];
      id?: string;
    };
  },
): AiBrainRecommendation {
  const action = buildSafeAiBrainAction({
    id: `${input.kind}-action`,
    kind: input.kind,
    title: input.title,
    description: input.rationale,
    moduleId: input.action.moduleId,
    resourceType: input.action.resourceType,
    resourceId: input.action.resourceId,
    priority: input.priority,
    mode: input.action.mode,
  });

  return {
    id: nextRecommendationId(input.kind),
    kind: input.kind,
    priority: input.priority,
    title: input.title,
    rationale: input.rationale,
    action,
    relatedRiskIds: input.relatedRiskIds,
    relatedSignalIds: input.relatedSignalIds,
    createdAt: new Date().toISOString(),
  };
}

export function generateAiBrainRecommendations(
  snapshots: AiBrainBridgeSnapshots,
  signals: AiBrainSignal[],
  risks: AiBrainRisk[],
): AiBrainRecommendation[] {
  const recommendations: AiBrainRecommendation[] = [];

  const missedOrderRisk = findRisk(risks, "missed_order");
  const unconfirmedSignal = findSignal(signals, "order_not_confirmed");
  if (missedOrderRisk && snapshots.orders.unconfirmedOrderIds[0]) {
    recommendations.push(
      buildRecommendation({
        kind: "confirm_order",
        priority: "high",
        title: "Подтвердить заказ",
        rationale: "Есть неподтверждённые заказы — риск пропуска обработки",
        relatedRiskIds: [missedOrderRisk.id],
        relatedSignalIds: unconfirmedSignal ? [unconfirmedSignal.id] : [],
        action: {
          kind: "confirm_order",
          title: "Подтвердить заказ",
          description: "Перевести заказ из new в confirmed",
          moduleId: "orderIntelligence",
          resourceType: "order",
          resourceId: snapshots.orders.unconfirmedOrderIds[0],
          priority: "high",
        },
      }),
    );
  }

  const courierOverloadRisk = findRisk(risks, "courier_overload");
  const deliveryDelaySignal = findSignal(signals, "delivery_delay_risk");
  if (
    courierOverloadRisk ||
    (deliveryDelaySignal && snapshots.couriers.availableCourierIds[0])
  ) {
    recommendations.push(
      buildRecommendation({
        kind: "assign_courier",
        priority: "high",
        title: "Назначить курьера",
        rationale: "Доступен курьер для перераспределения нагрузки",
        relatedRiskIds: courierOverloadRisk ? [courierOverloadRisk.id] : [],
        relatedSignalIds: deliveryDelaySignal ? [deliveryDelaySignal.id] : [],
        action: {
          kind: "assign_courier",
          title: "Назначить курьера",
          description: "Назначить доступного курьера на задачу доставки",
          moduleId: "courierIntelligence",
          resourceType: "courier",
          resourceId: snapshots.couriers.availableCourierIds[0] ?? null,
          priority: "high",
        },
      }),
    );
  }

  const flowerShortageRisk = findRisk(risks, "flower_shortage");
  const lowStockSignal = findSignal(signals, "inventory_low_stock");
  const outOfStockSignal = findSignal(signals, "inventory_out_of_stock");
  if (flowerShortageRisk && snapshots.inventory.lowStockItemIds[0]) {
    recommendations.push(
      buildRecommendation({
        kind: "restock_inventory",
        priority: flowerShortageRisk.priority,
        title: "Пополнить склад",
        rationale: "Низкий остаток или out of stock по ключевым позициям",
        relatedRiskIds: [flowerShortageRisk.id],
        relatedSignalIds: [
          ...(lowStockSignal ? [lowStockSignal.id] : []),
          ...(outOfStockSignal ? [outOfStockSignal.id] : []),
        ],
        action: {
          kind: "restock_inventory",
          title: "Пополнить склад",
          description: "Увеличить остаток проблемной позиции",
          moduleId: "inventoryIntelligence",
          resourceType: "inventory_item",
          resourceId: snapshots.inventory.lowStockItemIds[0],
          priority: flowerShortageRisk.priority,
        },
      }),
    );

    recommendations.push(
      buildRecommendation({
        kind: "replace_flower",
        priority: "normal",
        title: "Заменить цветок",
        rationale: "Предложить замену при нехватке состава",
        relatedRiskIds: [flowerShortageRisk.id],
        relatedSignalIds: outOfStockSignal ? [outOfStockSignal.id] : [],
        action: {
          kind: "replace_flower",
          title: "Заменить цветок",
          description: "Подобрать replacement из catalog/inventory rules",
          moduleId: "inventoryIntelligence",
          resourceType: "inventory_item",
          resourceId: snapshots.inventory.outOfStockItemIds[0] ?? snapshots.inventory.lowStockItemIds[0],
          priority: "normal",
        },
      }),
    );
  }

  const notificationErrorRisk = findRisk(risks, "notification_error");
  const notificationFailedSignal = findSignal(signals, "notification_failed");
  if (notificationErrorRisk && snapshots.notifications.failedNotificationIds[0]) {
    recommendations.push(
      buildRecommendation({
        kind: "retry_notification",
        priority: "high",
        title: "Повторить уведомление",
        rationale: "Failed notifications требуют retry",
        relatedRiskIds: [notificationErrorRisk.id],
        relatedSignalIds: notificationFailedSignal
          ? [notificationFailedSignal.id]
          : [],
        action: {
          kind: "retry_notification",
          title: "Повторить уведомление",
          description: "Поставить failed notification в retry queue",
          moduleId: "notificationIntelligence",
          resourceType: "notification",
          resourceId: snapshots.notifications.failedNotificationIds[0],
          priority: "high",
        },
      }),
    );
  }

  const deliveryDelayRisk = findRisk(risks, "delivery_delay");
  if (deliveryDelayRisk && snapshots.delivery.delayedTaskIds[0]) {
    recommendations.push(
      buildRecommendation({
        kind: "change_delivery_window",
        priority: "high",
        title: "Изменить интервал доставки",
        rationale: "Высокий риск задержки — предложить другой интервал",
        relatedRiskIds: [deliveryDelayRisk.id],
        relatedSignalIds: deliveryDelaySignal ? [deliveryDelaySignal.id] : [],
        action: {
          kind: "change_delivery_window",
          title: "Изменить интервал доставки",
          description: "Пересмотреть delivery window для задачи",
          moduleId: "deliveryIntelligence",
          resourceType: "delivery_task",
          resourceId: snapshots.delivery.delayedTaskIds[0],
          priority: "high",
        },
      }),
    );
  }

  const demandSignal = findSignal(signals, "product_demand_high");
  if (demandSignal && snapshots.catalog.topPublishedProductIds[0]) {
    recommendations.push(
      buildRecommendation({
        kind: "promote_popular_product",
        priority: "normal",
        title: "Поднять популярный товар",
        rationale: "Высокий спрос — усилить видимость доступных позиций",
        relatedRiskIds: [],
        relatedSignalIds: [demandSignal.id],
        action: {
          kind: "promote_popular_product",
          title: "Поднять популярный товар",
          description: "Рекомендация для merchandising / homepage",
          moduleId: "catalogEngine",
          resourceType: "catalog_product",
          resourceId: snapshots.catalog.topPublishedProductIds[0],
          priority: "normal",
        },
      }),
    );
  }

  const conversionRisk = findRisk(risks, "conversion_drop");
  if (conversionRisk && snapshots.catalog.unavailableProductIds[0]) {
    recommendations.push(
      buildRecommendation({
        kind: "hide_unavailable_product",
        priority: "normal",
        title: "Скрыть недоступный товар",
        rationale: "Недоступные позиции могут снижать конверсию",
        relatedRiskIds: [conversionRisk.id],
        relatedSignalIds: findSignal(signals, "conversion_drop")
          ? [findSignal(signals, "conversion_drop")!.id]
          : [],
        action: {
          kind: "hide_unavailable_product",
          title: "Скрыть недоступный товар",
          description: "Снять с публикации или скрыть из витрины",
          moduleId: "catalogEngine",
          resourceType: "catalog_product",
          resourceId: snapshots.catalog.unavailableProductIds[0],
          priority: "normal",
        },
      }),
    );
  }

  const workflowFailedSignal = findSignal(signals, "workflow_failed");
  if (workflowFailedSignal && snapshots.workflow.failedWorkflowIds[0]) {
    recommendations.push(
      buildRecommendation({
        kind: "review_workflow",
        priority: "critical",
        title: "Проверить проблемный workflow",
        rationale: "Workflow завершился с ошибкой и требует review",
        relatedRiskIds: [],
        relatedSignalIds: [workflowFailedSignal.id],
        action: {
          kind: "review_workflow",
          title: "Проверить workflow",
          description: "Открыть failed workflow для manual review / retry",
          moduleId: "workflowIntelligence",
          resourceType: "workflow",
          resourceId: snapshots.workflow.failedWorkflowIds[0],
          priority: "critical",
        },
      }),
    );
  }

  return recommendations;
}

export function resetAiBrainRecommendationCounter(): void {
  recommendationCounter = 0;
}

export const AI_BRAIN_RECOMMENDATION_KINDS: AiBrainRecommendationKind[] = [
  "confirm_order",
  "assign_courier",
  "restock_inventory",
  "replace_flower",
  "retry_notification",
  "change_delivery_window",
  "promote_popular_product",
  "hide_unavailable_product",
  "review_workflow",
];
