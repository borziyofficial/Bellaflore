// ==================================================
// SECTION: DELIVERY CONFIDENCE
// РАЗДЕЛ: Уверенность доставки
//
// Purpose (EN):
// Evaluates delivery feasibility from schedule, zones, and validation signals.
//
// Назначение (RU):
// Оценка выполнимости доставки по расписанию, зонам и валидации.
// ==================================================
import type { DeliveryPriceResult } from "@/components/deliveryZones/deliveryPriceTypes";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";
import {
  createEmptyDeliveryConfidenceScheduleResult,
  resolveDeliveryConfidenceSchedule,
} from "@/components/deliveryConfidence/deliveryConfidenceSchedule";
import {
  getDeliveryRulesConfig,
  resolveZoneDeliveryPriceFromRules,
  resolveZoneDeliveryRule,
} from "@/components/deliveryConfidence/deliveryRulesConfig";
import type {
  DeliveryConfidenceResult,
  DeliveryConfidenceScheduleInput,
  DeliveryConfidenceStatus,
  DeliveryRulesConfig,
} from "@/components/deliveryConfidence/deliveryConfidenceTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN):
// Private helper functions used within this module.
//
// Назначение (RU):
// Приватные вспомогательные функции модуля.
// ==================================================
function mapPriceStatusToConfidenceStatus(
  status: DeliveryPriceResult["status"],
): DeliveryConfidenceStatus {
  switch (status) {
    case "ready":
      return "ready";
    case "outside_delivery_area":
      return "outside_delivery_area";
    case "error":
      return "error";
    case "unknown":
    default:
      return "unknown";
  }
}

function buildConfidenceResult(
  rules: DeliveryRulesConfig,
  partial: Partial<Omit<DeliveryConfidenceResult, "calculatedAt">>,
): DeliveryConfidenceResult {
  return {
    status: "unknown",
    engineEnabled: false,
    deliveryZoneId: null,
    deliveryZoneLabel: null,
    baseDeliveryPriceRub: null,
    effectiveDeliveryPriceRub: null,
    freeDeliveryApplied: false,
    freeDeliveryRuleActive: false,
    freeDeliveryFromAmount: null,
    freeDeliveryMessage: rules.freeDeliveryMessage,
    amountUntilFreeDelivery: null,
    minimumOrderAmount: rules.minimumOrderAmount,
    amountUntilMinimumOrder: null,
    maxDeliveryDistanceKm: rules.maxDeliveryDistanceKm,
    distanceFromBaseKm: null,
    restrictionMessage: null,
    bouquetsTotalRub: 0,
    rulesVersion: rules.rulesVersion,
    ...createEmptyDeliveryConfidenceScheduleResult(rules.sameDayCutoffTime),
    ...partial,
    calculatedAt: new Date().toISOString(),
  };
}

function finalizeConfidenceResult(
  rules: DeliveryRulesConfig,
  partial: Partial<Omit<DeliveryConfidenceResult, "calculatedAt">> &
    Pick<DeliveryConfidenceResult, "status" | "engineEnabled" | "bouquetsTotalRub" | "rulesVersion">,
  scheduleInput?: DeliveryConfidenceScheduleInput,
): DeliveryConfidenceResult {
  const baseResult = buildConfidenceResult(rules, partial);

  if (
    !scheduleInput ||
    !baseResult.engineEnabled ||
    !baseResult.deliveryZoneId
  ) {
    return baseResult;
  }

  const schedule = resolveDeliveryConfidenceSchedule(
    rules,
    baseResult.deliveryZoneId,
    scheduleInput,
  );

  return buildConfidenceResult(rules, {
    ...baseResult,
    ...schedule,
  });
}

function buildDisabledPassthroughResult(
  bouquetsTotalRub: number,
  deliveryPriceResult: DeliveryPriceResult,
  rules: DeliveryRulesConfig,
  scheduleInput?: DeliveryConfidenceScheduleInput,
): DeliveryConfidenceResult {
  const status = mapPriceStatusToConfidenceStatus(deliveryPriceResult.status);
  const baseDeliveryPriceRub = deliveryPriceResult.deliveryPriceRub;

  return finalizeConfidenceResult(
    rules,
    {
      status: status === "ready" ? "disabled" : status,
      engineEnabled: false,
      deliveryZoneId: deliveryPriceResult.deliveryZoneId,
      deliveryZoneLabel: deliveryPriceResult.deliveryZoneLabel,
      baseDeliveryPriceRub,
      effectiveDeliveryPriceRub:
        status === "ready" ? baseDeliveryPriceRub : null,
      freeDeliveryApplied: false,
      freeDeliveryRuleActive: false,
      freeDeliveryFromAmount: null,
      freeDeliveryMessage: rules.freeDeliveryMessage,
      amountUntilFreeDelivery: null,
      minimumOrderAmount: rules.minimumOrderAmount,
      amountUntilMinimumOrder: null,
      maxDeliveryDistanceKm: rules.maxDeliveryDistanceKm,
      distanceFromBaseKm: deliveryPriceResult.distanceFromBaseKm,
      restrictionMessage: null,
      bouquetsTotalRub,
      rulesVersion: rules.rulesVersion,
    },
    scheduleInput,
  );
}

function resolveFreeDeliveryThreshold(
  rules: DeliveryRulesConfig,
  zoneId: DeliveryZoneId,
): number | null {
  const zoneRule = resolveZoneDeliveryRule(rules, zoneId);
  if (zoneRule?.freeDeliveryFromAmount !== undefined) {
    return zoneRule.freeDeliveryFromAmount;
  }

  return rules.defaultFreeDeliveryFromAmount;
}

function isFreeDeliveryAllowedForZone(
  rules: DeliveryRulesConfig,
  zoneId: DeliveryZoneId,
): boolean {
  if (!rules.freeDeliveryEnabled) {
    return false;
  }

  const zoneRule = resolveZoneDeliveryRule(rules, zoneId);
  if (zoneRule && zoneRule.freeDeliveryEnabled === false) {
    return false;
  }

  return zoneRule?.freeDeliveryEnabled ?? rules.freeDeliveryEnabled;
}

function isDistanceBlockedByRules(
  rules: DeliveryRulesConfig,
  distanceFromBaseKm: number | null,
): boolean {
  if (rules.allowOutsideZone) {
    return false;
  }

  if (distanceFromBaseKm === null || !Number.isFinite(distanceFromBaseKm)) {
    return false;
  }

  return distanceFromBaseKm > rules.maxDeliveryDistanceKm;
}

function resolveConfiguredZoneDeliveryPrice(
  rules: DeliveryRulesConfig,
  zoneId: DeliveryZoneId,
  fallbackPrice: number | null,
): number | null {
  return resolveZoneDeliveryPriceFromRules(rules, zoneId) ?? fallbackPrice;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export function resolveDeliveryConfidence(
  bouquetsTotalRub: number,
  deliveryPriceResult: DeliveryPriceResult,
  rules: DeliveryRulesConfig = getDeliveryRulesConfig(),
  scheduleInput?: DeliveryConfidenceScheduleInput,
): DeliveryConfidenceResult {
  if (!rules.enabled) {
    return buildDisabledPassthroughResult(
      bouquetsTotalRub,
      deliveryPriceResult,
      rules,
      scheduleInput,
    );
  }

  const status = mapPriceStatusToConfidenceStatus(deliveryPriceResult.status);
  const zoneId = deliveryPriceResult.deliveryZoneId;
  const baseDeliveryPriceRub =
    zoneId !== null
      ? resolveConfiguredZoneDeliveryPrice(
          rules,
          zoneId,
          deliveryPriceResult.deliveryPriceRub,
        )
      : deliveryPriceResult.deliveryPriceRub;

  const sharedFields = {
    engineEnabled: true,
    freeDeliveryMessage: rules.freeDeliveryMessage,
    minimumOrderAmount: rules.minimumOrderAmount,
    maxDeliveryDistanceKm: rules.maxDeliveryDistanceKm,
    distanceFromBaseKm: deliveryPriceResult.distanceFromBaseKm,
    bouquetsTotalRub,
    rulesVersion: rules.rulesVersion,
  };

  if (status !== "ready" || !zoneId || baseDeliveryPriceRub === null) {
    return finalizeConfidenceResult(
      rules,
      {
        status,
        deliveryZoneId: zoneId,
        deliveryZoneLabel: deliveryPriceResult.deliveryZoneLabel,
        baseDeliveryPriceRub,
        effectiveDeliveryPriceRub: null,
        freeDeliveryApplied: false,
        freeDeliveryRuleActive: false,
        freeDeliveryFromAmount: null,
        amountUntilFreeDelivery: null,
        amountUntilMinimumOrder: null,
        restrictionMessage: null,
        ...sharedFields,
      },
      scheduleInput,
    );
  }

  if (isDistanceBlockedByRules(rules, deliveryPriceResult.distanceFromBaseKm)) {
    return finalizeConfidenceResult(
      rules,
      {
        status: "outside_delivery_area",
        deliveryZoneId: zoneId,
        deliveryZoneLabel: deliveryPriceResult.deliveryZoneLabel,
        baseDeliveryPriceRub,
        effectiveDeliveryPriceRub: null,
        freeDeliveryApplied: false,
        freeDeliveryRuleActive: false,
        freeDeliveryFromAmount: null,
        amountUntilFreeDelivery: null,
        amountUntilMinimumOrder: null,
        restrictionMessage: `Доставка недоступна — расстояние превышает ${rules.maxDeliveryDistanceKm} км`,
        ...sharedFields,
      },
      scheduleInput,
    );
  }

  if (bouquetsTotalRub < rules.minimumOrderAmount) {
    const amountUntilMinimumOrder = rules.minimumOrderAmount - bouquetsTotalRub;

    return finalizeConfidenceResult(
      rules,
      {
        status: "minimum_order_not_met",
        deliveryZoneId: zoneId,
        deliveryZoneLabel: deliveryPriceResult.deliveryZoneLabel,
        baseDeliveryPriceRub,
        effectiveDeliveryPriceRub: baseDeliveryPriceRub,
        freeDeliveryApplied: false,
        freeDeliveryRuleActive: false,
        freeDeliveryFromAmount: null,
        amountUntilFreeDelivery: null,
        amountUntilMinimumOrder,
        restrictionMessage: `Минимальный заказ от ${rules.minimumOrderAmount.toLocaleString("ru-RU")} ₽ · осталось ${amountUntilMinimumOrder.toLocaleString("ru-RU")} ₽`,
        ...sharedFields,
      },
      scheduleInput,
    );
  }

  const freeDeliveryRuleActive = isFreeDeliveryAllowedForZone(rules, zoneId);
  const freeDeliveryFromAmount = resolveFreeDeliveryThreshold(rules, zoneId);

  if (!freeDeliveryRuleActive || freeDeliveryFromAmount === null) {
    return finalizeConfidenceResult(
      rules,
      {
        status: "ready",
        deliveryZoneId: zoneId,
        deliveryZoneLabel: deliveryPriceResult.deliveryZoneLabel,
        baseDeliveryPriceRub,
        effectiveDeliveryPriceRub: baseDeliveryPriceRub,
        freeDeliveryApplied: false,
        freeDeliveryRuleActive: false,
        freeDeliveryFromAmount: null,
        amountUntilFreeDelivery: null,
        amountUntilMinimumOrder: null,
        restrictionMessage: null,
        ...sharedFields,
      },
      scheduleInput,
    );
  }

  if (bouquetsTotalRub >= freeDeliveryFromAmount) {
    return finalizeConfidenceResult(
      rules,
      {
        status: "ready",
        deliveryZoneId: zoneId,
        deliveryZoneLabel: deliveryPriceResult.deliveryZoneLabel,
        baseDeliveryPriceRub,
        effectiveDeliveryPriceRub: 0,
        freeDeliveryApplied: true,
        freeDeliveryRuleActive: true,
        freeDeliveryFromAmount,
        amountUntilFreeDelivery: 0,
        amountUntilMinimumOrder: null,
        restrictionMessage: null,
        ...sharedFields,
      },
      scheduleInput,
    );
  }

  return finalizeConfidenceResult(
    rules,
    {
      status: "ready",
      deliveryZoneId: zoneId,
      deliveryZoneLabel: deliveryPriceResult.deliveryZoneLabel,
      baseDeliveryPriceRub,
      effectiveDeliveryPriceRub: baseDeliveryPriceRub,
      freeDeliveryApplied: false,
      freeDeliveryRuleActive: true,
      freeDeliveryFromAmount,
      amountUntilFreeDelivery: freeDeliveryFromAmount - bouquetsTotalRub,
      amountUntilMinimumOrder: null,
      restrictionMessage: null,
      ...sharedFields,
    },
    scheduleInput,
  );
}

export function calculateCheckoutGrandTotalWithConfidence(
  bouquetsTotalRub: number,
  deliveryPriceResult: DeliveryPriceResult,
  rules?: DeliveryRulesConfig,
  scheduleInput?: DeliveryConfidenceScheduleInput,
): number {
  const confidence = resolveDeliveryConfidence(
    bouquetsTotalRub,
    deliveryPriceResult,
    rules,
    scheduleInput,
  );

  if (
    confidence.status === "outside_delivery_area" ||
    confidence.effectiveDeliveryPriceRub === null
  ) {
    return bouquetsTotalRub;
  }

  if (confidence.status === "disabled") {
    return bouquetsTotalRub + (confidence.baseDeliveryPriceRub ?? 0);
  }

  if (
    confidence.status !== "ready" &&
    confidence.status !== "minimum_order_not_met"
  ) {
    return bouquetsTotalRub;
  }

  return bouquetsTotalRub + confidence.effectiveDeliveryPriceRub;
}

export function getEffectiveDeliveryPriceRub(
  confidence: DeliveryConfidenceResult,
): number | null {
  if (!confidence.engineEnabled && confidence.status === "disabled") {
    return confidence.baseDeliveryPriceRub;
  }

  return confidence.effectiveDeliveryPriceRub;
}

export function isDeliveryConfidenceUiActive(
  confidence: DeliveryConfidenceResult,
): boolean {
  return confidence.engineEnabled && confidence.status !== "disabled";
}
