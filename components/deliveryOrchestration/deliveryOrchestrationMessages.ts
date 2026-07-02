// ==================================================
// SECTION: MESSAGES
// РАЗДЕЛ: Сообщения
//
// Purpose (EN): User-facing and log message strings for deliveryOrchestration.
//
// Назначение (RU): Пользовательские и служебные сообщения для deliveryOrchestration.
// ==================================================
import type {
  CourierOrchestrationStatus,
  DeliveryOrchestrationStatus,
  DeliveryRouteStatus,
} from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getDeliveryOrchestrationStatusLabel(
  status: DeliveryOrchestrationStatus,
): string {
  switch (status) {
    case "new":
      return "Новый заказ";
    case "accepted":
      return "Принят";
    case "preparing":
      return "Сборка";
    case "ready_for_courier":
      return "Готов к передаче курьеру";
    case "assigned_to_courier":
      return "Курьер назначен";
    case "courier_on_the_way":
      return "Курьер в пути";
    case "delivered":
      return "Доставлен";
    case "cancelled":
    default:
      return "Отменён";
  }
}

export function getCourierOrchestrationStatusLabel(
  status: CourierOrchestrationStatus,
): string {
  switch (status) {
    case "assigned":
      return "Назначен";
    case "on_the_way":
      return "В пути";
    case "delivered":
      return "Доставил заказ";
    case "unavailable":
      return "Недоступен";
    case "unassigned":
    default:
      return "Не назначен";
  }
}

export function getDeliveryRouteStatusLabel(status: DeliveryRouteStatus): string {
  switch (status) {
    case "planned":
      return "Маршрут запланирован";
    case "in_progress":
      return "Маршрут выполняется";
    case "completed":
      return "Маршрут завершён";
    case "cancelled":
      return "Маршрут отменён";
    case "draft":
    default:
      return "Черновик маршрута";
  }
}

export function getDeliveryOrchestrationCustomerMessage(
  status: DeliveryOrchestrationStatus,
): string {
  switch (status) {
    case "new":
      return "Заказ принят в обработку";
    case "accepted":
      return "Заказ подтверждён";
    case "preparing":
      return "Букет собирается";
    case "ready_for_courier":
      return "Заказ готов к передаче курьеру";
    case "assigned_to_courier":
      return "Курьер назначен";
    case "courier_on_the_way":
      return "Курьер уже в пути";
    case "delivered":
      return "Заказ доставлен";
    case "cancelled":
    default:
      return "Заказ отменён";
  }
}

export function getDeliveryOrchestrationCourierMessage(
  status: DeliveryOrchestrationStatus,
): string {
  switch (status) {
    case "ready_for_courier":
      return "Заказ готов к получению";
    case "assigned_to_courier":
      return "Назначен новый заказ";
    case "courier_on_the_way":
      return "Доставьте заказ клиенту";
    case "delivered":
      return "Заказ успешно доставлен";
    case "cancelled":
      return "Заказ отменён";
    default:
      return "Ожидайте назначения заказа";
  }
}

export function getDeliveryOrchestrationAdminMessage(
  status: DeliveryOrchestrationStatus,
): string {
  switch (status) {
    case "new":
      return "Новый заказ в очереди логистики";
    case "accepted":
      return "Заказ принят в работу";
    case "preparing":
      return "Заказ на этапе сборки";
    case "ready_for_courier":
      return "Можно назначить курьера";
    case "assigned_to_courier":
      return "Курьер назначен вручную";
    case "courier_on_the_way":
      return "Курьер в пути к клиенту";
    case "delivered":
      return "Заказ завершён";
    case "cancelled":
    default:
      return "Заказ отменён";
  }
}

export function getLogisticsAssignmentMessage(
  courierName: string,
  mode: "manual" | "auto",
): string {
  if (mode === "auto") {
    return `Курьер ${courierName} назначен автоматически`;
  }

  return `Курьер ${courierName} назначен вручную`;
}

export function getLogisticsUnassignmentMessage(): string {
  return "Курьер снят с заказа";
}

export function getLogisticsEtaRecalculatedMessage(etaLabel: string | null): string {
  return etaLabel
    ? `ETA пересчитан: ${etaLabel}`
    : "ETA пересчитан";
}
