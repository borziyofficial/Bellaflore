// ==================================================
// SECTION: DELIVERY CONFIDENCE
// РАЗДЕЛ: Уверенность доставки
//
// Purpose (EN):
// Delivery confidence score and status type definitions.
//
// Назначение (RU):
// Типы оценки и статуса уверенности доставки.
// ==================================================
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";

export type DeliveryZoneRule = {
  deliveryPrice: number;
  freeDeliveryEnabled: boolean;
  freeDeliveryFromAmount: number | null;
};

export type ZoneEstimatedDeliveryTime = {
  label: string;
  minMinutes: number;
  maxMinutes: number;
};

export type DeliveryWorkingHours = {
  startTime: string;
  endTime: string;
};

export type HolidayRule = {
  id: string;
  date: string;
  label: string;
  deliveryAvailable: boolean;
  message?: string;
};

export type HolidayRulesConfig = {
  enabled: boolean;
  holidays: HolidayRule[];
};

export type DeliveryRulesConfig = {
  enabled: boolean;
  freeDeliveryEnabled: boolean;
  defaultFreeDeliveryFromAmount: number | null;
  freeDeliveryMessage: string;
  minimumOrderAmount: number;
  maxDeliveryDistanceKm: number;
  allowOutsideZone: boolean;
  deliveryPriceByZone: Partial<Record<DeliveryZoneId, number>>;
  estimatedDeliveryTimeByZone: Partial<
    Record<DeliveryZoneId, ZoneEstimatedDeliveryTime>
  >;
  workingHours: DeliveryWorkingHours;
  sameDayCutoffTime: string;
  holidayRules: HolidayRulesConfig;
  zones: Partial<Record<DeliveryZoneId, DeliveryZoneRule>>;
  rulesVersion: string;
  updatedAt: string;
};

export type DeliveryConfidenceScheduleInput = {
  deliveryDate: string;
  deliveryInterval: string;
  now?: Date;
};

export type DeliveryConfidenceStatus =
  | "ready"
  | "unknown"
  | "outside_delivery_area"
  | "error"
  | "disabled"
  | "minimum_order_not_met";

export type DeliveryConfidenceResult = {
  status: DeliveryConfidenceStatus;
  engineEnabled: boolean;
  deliveryZoneId: DeliveryZoneId | null;
  deliveryZoneLabel: string | null;
  baseDeliveryPriceRub: number | null;
  effectiveDeliveryPriceRub: number | null;
  freeDeliveryApplied: boolean;
  freeDeliveryRuleActive: boolean;
  freeDeliveryFromAmount: number | null;
  freeDeliveryMessage: string;
  amountUntilFreeDelivery: number | null;
  minimumOrderAmount: number | null;
  amountUntilMinimumOrder: number | null;
  maxDeliveryDistanceKm: number | null;
  distanceFromBaseKm: number | null;
  restrictionMessage: string | null;
  zoneEstimatedDeliveryLabel: string | null;
  zoneEstimatedDeliveryMinutesMin: number | null;
  zoneEstimatedDeliveryMinutesMax: number | null;
  sameDayDeliveryAvailable: boolean;
  sameDayCutoffTime: string;
  selectedIntervalWithinWorkingHours: boolean;
  nearestAvailableInterval: string | null;
  scheduleMessage: string | null;
  bouquetsTotalRub: number;
  rulesVersion: string;
  calculatedAt: string;
};

export type DeliveryConfidenceScheduleResult = Pick<
  DeliveryConfidenceResult,
  | "zoneEstimatedDeliveryLabel"
  | "zoneEstimatedDeliveryMinutesMin"
  | "zoneEstimatedDeliveryMinutesMax"
  | "sameDayDeliveryAvailable"
  | "sameDayCutoffTime"
  | "selectedIntervalWithinWorkingHours"
  | "nearestAvailableInterval"
  | "scheduleMessage"
>;
