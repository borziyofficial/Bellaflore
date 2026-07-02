// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for deliveryOrchestration.
//
// Назначение (RU): Определения типов для deliveryOrchestration.
// ==================================================
import type { DeliveryConfidenceResult } from "@/components/deliveryConfidence/deliveryConfidenceTypes";

export type DeliveryOrchestrationStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready_for_courier"
  | "assigned_to_courier"
  | "courier_on_the_way"
  | "delivered"
  | "cancelled";

export type CourierOrchestrationStatus =
  | "unassigned"
  | "assigned"
  | "on_the_way"
  | "delivered"
  | "unavailable";

export type CourierAssignmentMode = "manual" | "auto";

export type LogisticsDeliveryConfidenceSnapshot = {
  status: DeliveryConfidenceResult["status"];
  engineEnabled: boolean;
  freeDeliveryApplied: boolean;
  effectiveDeliveryPriceRub: number | null;
  baseDeliveryPriceRub: number | null;
  zoneEstimatedDeliveryLabel: string | null;
  zoneEstimatedDeliveryMinutesMin: number | null;
  zoneEstimatedDeliveryMinutesMax: number | null;
  sameDayDeliveryAvailable: boolean;
  scheduleMessage: string | null;
  rulesVersion: string;
};

export type LogisticsOrder = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryZone: string | null;
  deliveryZoneId: string | null;
  deliveryPrice: number | null;
  deliveryEta: string | null;
  deliveryEtaMinutesMin: number | null;
  deliveryEtaMinutesMax: number | null;
  deliveryDate: string;
  deliveryInterval: string;
  courierId: string | null;
  courierName: string | null;
  courierPhone: string | null;
  courierStatus: CourierOrchestrationStatus;
  deliveryStatus: DeliveryOrchestrationStatus;
  totalPriceRub: number;
  deliveryConfidence: LogisticsDeliveryConfidenceSnapshot;
  routeId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LogisticsOrderQueueBuckets = {
  newOrders: LogisticsOrder[];
  activeOrders: LogisticsOrder[];
  completedOrders: LogisticsOrder[];
  cancelledOrders: LogisticsOrder[];
};

export type DeliveryRouteStatus =
  | "draft"
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type DeliveryRoutePlan = {
  routeId: string;
  courierId: string;
  orderIds: string[];
  estimatedRouteTimeMinutes: number | null;
  routeStatus: DeliveryRouteStatus;
  createdAt: string;
  updatedAt: string;
};

export type DeliveryOrchestrationConfig = {
  enabled: boolean;
  manualAssignmentEnabled: boolean;
  autoAssignmentEnabled: boolean;
  routePlannerEnabled: boolean;
  etaRecalculationEnabled: boolean;
};

export type RecalculateLogisticsEtaInput = {
  deliveryInterval?: string;
  deliveryStatus?: DeliveryOrchestrationStatus;
  courierAssigned?: boolean;
  deliveryConfidence?: LogisticsDeliveryConfidenceSnapshot | DeliveryConfidenceResult;
};

export type AssignLogisticsCourierInput = {
  courierId: string;
  courierName: string;
  courierPhone: string;
  assignmentMode?: CourierAssignmentMode;
};
