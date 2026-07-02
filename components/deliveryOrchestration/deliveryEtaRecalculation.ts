// ==================================================
// SECTION: DELIVERY ORCHESTRATION
// РАЗДЕЛ: Оркестрация доставки
//
// Purpose (EN): Logistics order lifecycle, courier assignment, and route planning.
//
// Назначение (RU): Жизненный цикл логистических заказов, назначение курьеров и маршруты.
// ==================================================
import { getDeliveryOrchestrationConfig } from "@/components/deliveryOrchestration/deliveryOrchestrationConfig";
import type { DeliveryConfidenceResult } from "@/components/deliveryConfidence/deliveryConfidenceTypes";
import type {
  DeliveryOrchestrationStatus,
  LogisticsDeliveryConfidenceSnapshot,
  LogisticsOrder,
  RecalculateLogisticsEtaInput,
} from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const EN_ROUTE_STATUSES = new Set<DeliveryOrchestrationStatus>([
  "assigned_to_courier",
  "courier_on_the_way",
]);

function isDeliveryConfidenceResult(
  confidence:
    | LogisticsDeliveryConfidenceSnapshot
    | DeliveryConfidenceResult
    | undefined,
): confidence is DeliveryConfidenceResult {
  return (
    Boolean(confidence) &&
    typeof confidence === "object" &&
    "calculatedAt" in confidence
  );
}

function toConfidenceSnapshot(
  confidence:
    | LogisticsDeliveryConfidenceSnapshot
    | DeliveryConfidenceResult
    | undefined,
): LogisticsDeliveryConfidenceSnapshot | null {
  if (!confidence) {
    return null;
  }

  if (isDeliveryConfidenceResult(confidence)) {
    return {
      status: confidence.status,
      engineEnabled: confidence.engineEnabled,
      freeDeliveryApplied: confidence.freeDeliveryApplied,
      effectiveDeliveryPriceRub: confidence.effectiveDeliveryPriceRub,
      baseDeliveryPriceRub: confidence.baseDeliveryPriceRub,
      zoneEstimatedDeliveryLabel: confidence.zoneEstimatedDeliveryLabel,
      zoneEstimatedDeliveryMinutesMin:
        confidence.zoneEstimatedDeliveryMinutesMin,
      zoneEstimatedDeliveryMinutesMax:
        confidence.zoneEstimatedDeliveryMinutesMax,
      sameDayDeliveryAvailable: confidence.sameDayDeliveryAvailable,
      scheduleMessage: confidence.scheduleMessage,
      rulesVersion: confidence.rulesVersion,
    };
  }

  return confidence;
}

function formatEtaLabel(minutesMin: number, minutesMax: number): string {
  if (minutesMax >= 60) {
    const minHours = Math.round((minutesMin / 60) * 10) / 10;
    const maxHours = Math.round((minutesMax / 60) * 10) / 10;
    return `${minHours}–${maxHours} ч`;
  }

  return `${minutesMin}–${minutesMax} мин`;
}

function applyCourierEtaAdjustment(
  minutesMin: number | null,
  minutesMax: number | null,
  courierAssigned: boolean,
  deliveryStatus?: DeliveryOrchestrationStatus,
): { min: number | null; max: number | null; label: string | null } {
  if (minutesMin === null || minutesMax === null) {
    return { min: minutesMin, max: minutesMax, label: null };
  }

  let adjustedMin = minutesMin;
  let adjustedMax = minutesMax;

  if (courierAssigned) {
    adjustedMin = Math.max(15, minutesMin - 10);
    adjustedMax = Math.max(adjustedMin + 15, minutesMax - 10);
  }

  if (deliveryStatus && EN_ROUTE_STATUSES.has(deliveryStatus)) {
    adjustedMin = Math.max(10, adjustedMin - 15);
    adjustedMax = Math.max(adjustedMin + 10, adjustedMax - 20);
  }

  return {
    min: adjustedMin,
    max: adjustedMax,
    label: formatEtaLabel(adjustedMin, adjustedMax),
  };
}

function applyIntervalEtaAdjustment(
  intervalLabel: string | undefined,
  minutesMin: number | null,
  minutesMax: number | null,
): { min: number | null; max: number | null } {
  if (!intervalLabel || minutesMin === null || minutesMax === null) {
    return { min: minutesMin, max: minutesMax };
  }

  return {
    min: minutesMin,
    max: minutesMax + 15,
  };
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function recalculateLogisticsOrderEta(
  order: LogisticsOrder,
  input: RecalculateLogisticsEtaInput = {},
): LogisticsOrder {
  const config = getDeliveryOrchestrationConfig();

  if (!config.enabled || !config.etaRecalculationEnabled) {
    return order;
  }

  const confidenceSnapshot =
    toConfidenceSnapshot(input.deliveryConfidence) ?? order.deliveryConfidence;

  const deliveryStatus = input.deliveryStatus ?? order.deliveryStatus;
  const courierAssigned =
    input.courierAssigned ?? Boolean(order.courierId);

  let minutesMin = confidenceSnapshot.zoneEstimatedDeliveryMinutesMin;
  let minutesMax = confidenceSnapshot.zoneEstimatedDeliveryMinutesMax;

  const intervalAdjustment = applyIntervalEtaAdjustment(
    input.deliveryInterval ?? order.deliveryInterval,
    minutesMin,
    minutesMax,
  );
  minutesMin = intervalAdjustment.min;
  minutesMax = intervalAdjustment.max;

  const courierAdjustment = applyCourierEtaAdjustment(
    minutesMin,
    minutesMax,
    courierAssigned,
    deliveryStatus,
  );

  return {
    ...order,
    deliveryEta: courierAdjustment.label ?? order.deliveryEta,
    deliveryEtaMinutesMin: courierAdjustment.min,
    deliveryEtaMinutesMax: courierAdjustment.max,
    deliveryConfidence: confidenceSnapshot,
    updatedAt: new Date().toISOString(),
  };
}
