// ==================================================
// SECTION: DELIVERY ORCHESTRATION
// РАЗДЕЛ: Оркестрация доставки
//
// Purpose (EN): Logistics order lifecycle, courier assignment, and route planning.
//
// Назначение (RU): Жизненный цикл логистических заказов, назначение курьеров и маршруты.
// ==================================================
import type { DeliveryOrchestrationStatus } from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";

export const DELIVERY_ORCHESTRATION_STATUS_PIPELINE: DeliveryOrchestrationStatus[] =
  [
    "new",
    "accepted",
    "preparing",
    "ready_for_courier",
    "assigned_to_courier",
    "courier_on_the_way",
    "delivered",
    "cancelled",
  ];


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const TERMINAL_STATUSES = new Set<DeliveryOrchestrationStatus>([
  "delivered",
  "cancelled",
]);

const STATUS_TRANSITIONS: Record<
  DeliveryOrchestrationStatus,
  DeliveryOrchestrationStatus[]
> = {
  new: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready_for_courier", "cancelled"],
  ready_for_courier: ["assigned_to_courier", "cancelled"],
  assigned_to_courier: ["courier_on_the_way", "ready_for_courier", "cancelled"],
  courier_on_the_way: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function isDeliveryOrchestrationStatus(
  value: string,
): value is DeliveryOrchestrationStatus {
  return DELIVERY_ORCHESTRATION_STATUS_PIPELINE.includes(
    value as DeliveryOrchestrationStatus,
  );
}

export function canTransitionDeliveryStatus(
  from: DeliveryOrchestrationStatus,
  to: DeliveryOrchestrationStatus,
): boolean {
  if (from === to) {
    return true;
  }

  if (TERMINAL_STATUSES.has(from)) {
    return false;
  }

  return STATUS_TRANSITIONS[from].includes(to);
}

export function getNextDeliveryStatuses(
  status: DeliveryOrchestrationStatus,
): DeliveryOrchestrationStatus[] {
  return STATUS_TRANSITIONS[status];
}

export function getDeliveryStatusPipelineIndex(
  status: DeliveryOrchestrationStatus,
): number {
  return DELIVERY_ORCHESTRATION_STATUS_PIPELINE.indexOf(status);
}
