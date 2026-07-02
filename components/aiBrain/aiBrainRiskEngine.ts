// ==================================================
// SECTION: AI BRAIN
// РАЗДЕЛ: Risk engine
// ==================================================
import type {
  AiBrainRisk,
  AiBrainRiskKind,
  AiBrainSignal,
} from "@/components/aiBrain/aiBrainTypes";

let riskCounter = 0;

function nextRiskId(kind: AiBrainRiskKind): string {
  riskCounter += 1;
  return `risk-${kind}-${riskCounter}`;
}

function findSignals(
  signals: AiBrainSignal[],
  kinds: AiBrainSignal["kind"][],
): AiBrainSignal[] {
  return signals.filter((signal) => kinds.includes(signal.kind));
}

export function detectAiBrainRisks(signals: AiBrainSignal[]): AiBrainRisk[] {
  const risks: AiBrainRisk[] = [];
  const now = new Date().toISOString();

  const deliverySignals = findSignals(signals, ["delivery_delay_risk"]);
  if (deliverySignals.length > 0) {
    risks.push({
      id: nextRiskId("delivery_delay"),
      kind: "delivery_delay",
      priority: "high",
      title: "Риск задержки доставки",
      description:
        "Есть активные задачи доставки с высоким прогнозом задержки",
      moduleId: "deliveryIntelligence",
      relatedSignalIds: deliverySignals.map((signal) => signal.id),
      mitigationHints: [
        "Проверить интервал доставки",
        "Перераспределить задачи между курьерами",
      ],
      detectedAt: now,
    });
  }

  const inventorySignals = findSignals(signals, [
    "inventory_low_stock",
    "inventory_out_of_stock",
  ]);
  if (inventorySignals.length > 0) {
    risks.push({
      id: nextRiskId("flower_shortage"),
      kind: "flower_shortage",
      priority: inventorySignals.some((signal) => signal.kind === "inventory_out_of_stock")
        ? "critical"
        : "high",
      title: "Риск нехватки цветов",
      description: "Склад сигнализирует о низком остатке или отсутствии позиций",
      moduleId: "inventoryIntelligence",
      relatedSignalIds: inventorySignals.map((signal) => signal.id),
      mitigationHints: [
        "Пополнить склад",
        "Предложить замену цветов в заказах",
      ],
      detectedAt: now,
    });
  }

  const missedOrderSignals = findSignals(signals, [
    "order_not_confirmed",
    "order_volume_high",
  ]);
  if (missedOrderSignals.length > 0) {
    risks.push({
      id: nextRiskId("missed_order"),
      kind: "missed_order",
      priority: missedOrderSignals.some((signal) => signal.priority === "high")
        ? "high"
        : "normal",
      title: "Риск пропущенного заказа",
      description:
        "Есть неподтверждённые заказы или повышенный поток без обработки",
      moduleId: "orderIntelligence",
      relatedSignalIds: missedOrderSignals.map((signal) => signal.id),
      mitigationHints: [
        "Подтвердить новые заказы",
        "Проверить workflow ожидания admin confirmation",
      ],
      detectedAt: now,
    });
  }

  const courierSignals = findSignals(signals, ["courier_overloaded"]);
  if (courierSignals.length > 0) {
    risks.push({
      id: nextRiskId("courier_overload"),
      kind: "courier_overload",
      priority: "high",
      title: "Риск перегрузки курьера",
      description: "Один или несколько курьеров достигли лимита загрузки",
      moduleId: "courierIntelligence",
      relatedSignalIds: courierSignals.map((signal) => signal.id),
      mitigationHints: [
        "Назначить другого курьера",
        "Пересмотреть маршрут",
      ],
      detectedAt: now,
    });
  }

  const notificationSignals = findSignals(signals, ["notification_failed"]);
  if (notificationSignals.length > 0) {
    risks.push({
      id: nextRiskId("notification_error"),
      kind: "notification_error",
      priority: "high",
      title: "Риск ошибки уведомлений",
      description: "Уведомления не доставлены и требуют повторной отправки",
      moduleId: "notificationIntelligence",
      relatedSignalIds: notificationSignals.map((signal) => signal.id),
      mitigationHints: [
        "Повторить failed notifications",
        "Проверить канал Telegram/SMS",
      ],
      detectedAt: now,
    });
  }

  const conversionSignals = findSignals(signals, ["conversion_drop"]);
  if (conversionSignals.length > 0) {
    risks.push({
      id: nextRiskId("conversion_drop"),
      kind: "conversion_drop",
      priority: "normal",
      title: "Риск падения конверсии",
      description:
        "Доля недоступных товаров в каталоге может снижать конверсию",
      moduleId: "catalogEngine",
      relatedSignalIds: conversionSignals.map((signal) => signal.id),
      mitigationHints: [
        "Скрыть недоступные товары",
        "Поднять популярные доступные позиции",
      ],
      detectedAt: now,
    });
  }

  return risks;
}

export function resetAiBrainRiskCounter(): void {
  riskCounter = 0;
}

export const AI_BRAIN_RISK_KINDS: AiBrainRiskKind[] = [
  "delivery_delay",
  "flower_shortage",
  "missed_order",
  "courier_overload",
  "notification_error",
  "conversion_drop",
];
