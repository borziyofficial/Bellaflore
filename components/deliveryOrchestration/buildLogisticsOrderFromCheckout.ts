// ==================================================
// SECTION: DELIVERY ORCHESTRATION
// РАЗДЕЛ: Оркестрация доставки
//
// Purpose (EN): Logistics order lifecycle, courier assignment, and route planning.
//
// Назначение (RU): Жизненный цикл логистических заказов, назначение курьеров и маршруты.
// ==================================================
import type { DeliveryConfidenceResult } from "@/components/deliveryConfidence/deliveryConfidenceTypes";
import type { CheckoutOrderPayload } from "@/components/checkout/checkoutTypes";
import type {
  LogisticsDeliveryConfidenceSnapshot,
  LogisticsOrder,
} from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type BuildLogisticsOrderInput = {
  orderId: string;
  payload: CheckoutOrderPayload;
  totalPriceRub: number;
  deliveryConfidenceResult?: DeliveryConfidenceResult | null;
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildDeliveryConfidenceSnapshot(
  deliveryConfidenceResult?: DeliveryConfidenceResult | null,
): LogisticsDeliveryConfidenceSnapshot {
  if (!deliveryConfidenceResult) {
    return {
      status: "unknown",
      engineEnabled: false,
      freeDeliveryApplied: false,
      effectiveDeliveryPriceRub: null,
      baseDeliveryPriceRub: null,
      zoneEstimatedDeliveryLabel: null,
      zoneEstimatedDeliveryMinutesMin: null,
      zoneEstimatedDeliveryMinutesMax: null,
      sameDayDeliveryAvailable: false,
      scheduleMessage: null,
      rulesVersion: "none",
    };
  }

  return {
    status: deliveryConfidenceResult.status,
    engineEnabled: deliveryConfidenceResult.engineEnabled,
    freeDeliveryApplied: deliveryConfidenceResult.freeDeliveryApplied,
    effectiveDeliveryPriceRub:
      deliveryConfidenceResult.effectiveDeliveryPriceRub,
    baseDeliveryPriceRub: deliveryConfidenceResult.baseDeliveryPriceRub,
    zoneEstimatedDeliveryLabel:
      deliveryConfidenceResult.zoneEstimatedDeliveryLabel,
    zoneEstimatedDeliveryMinutesMin:
      deliveryConfidenceResult.zoneEstimatedDeliveryMinutesMin,
    zoneEstimatedDeliveryMinutesMax:
      deliveryConfidenceResult.zoneEstimatedDeliveryMinutesMax,
    sameDayDeliveryAvailable:
      deliveryConfidenceResult.sameDayDeliveryAvailable,
    scheduleMessage: deliveryConfidenceResult.scheduleMessage,
    rulesVersion: deliveryConfidenceResult.rulesVersion,
  };
}

export function buildLogisticsOrderFromCheckout(
  input: BuildLogisticsOrderInput,
): LogisticsOrder {
  const now = new Date().toISOString();
  const deliveryConfidence = buildDeliveryConfidenceSnapshot(
    input.deliveryConfidenceResult,
  );

  const deliveryPrice =
    deliveryConfidence.effectiveDeliveryPriceRub ??
    input.payload.deliveryZonePriceRub ??
    null;

  return {
    orderId: input.orderId,
    customerName: input.payload.customerName,
    customerPhone: input.payload.phone,
    deliveryAddress: input.payload.deliveryAddress,
    deliveryZone: input.payload.deliveryZoneLabel ?? null,
    deliveryZoneId: input.payload.deliveryZoneId ?? null,
    deliveryPrice,
    deliveryEta: deliveryConfidence.zoneEstimatedDeliveryLabel,
    deliveryEtaMinutesMin: deliveryConfidence.zoneEstimatedDeliveryMinutesMin,
    deliveryEtaMinutesMax: deliveryConfidence.zoneEstimatedDeliveryMinutesMax,
    deliveryDate: input.payload.deliveryDate,
    deliveryInterval: input.payload.deliveryInterval,
    courierId: null,
    courierName: null,
    courierPhone: null,
    courierStatus: "unassigned",
    deliveryStatus: "new",
    totalPriceRub: input.totalPriceRub,
    deliveryConfidence,
    routeId: null,
    createdAt: now,
    updatedAt: now,
  };
}
