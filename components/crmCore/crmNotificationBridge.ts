// ==================================================
// SECTION: CRM
// РАЗДЕЛ: CRM
//
// Purpose (EN): Customer relationship management engine, storage, and queue logic.
//
// Назначение (RU): Движок CRM, хранилище и логика очередей клиентов.
// ==================================================
import { getCrmConfig } from "@/components/crmCore/crmConfig";
import { upsertCrmOrderFromNotificationEvent } from "@/components/crmCore/crmCoreEngine";
import type { CrmOrder } from "@/components/crmCore/crmTypes";
import { findLogisticsOrderById } from "@/components/deliveryOrchestration/deliveryOrchestrationStorage";
import { getNotificationEventConfig } from "@/components/notificationEventBus/notificationEventConfig";
import type { NotificationEvent } from "@/components/notificationEventBus/notificationEventTypes";

export function processCrmNotificationEvent(
  event: NotificationEvent,
): CrmOrder | null {
  const crmConfig = getCrmConfig();
  const notificationConfig = getNotificationEventConfig();

  if (!crmConfig.enabled || !notificationConfig.crmEnabled) {
    return null;
  }

  if (!event.channelTargets.includes("crm")) {
    return null;
  }

  const logisticsOrder = event.logisticsOrderId
    ? findLogisticsOrderById(event.logisticsOrderId)
    : findLogisticsOrderById(event.orderId);

  return upsertCrmOrderFromNotificationEvent({
    orderId: event.orderId,
    logisticsOrderId: event.logisticsOrderId ?? logisticsOrder?.orderId ?? null,
    lifecycleOrderId: event.lifecycleOrderId,
    status: event.status,
    lastEventAt: event.createdAt,
    payload: {
      ...event.payload,
      customerName: logisticsOrder?.customerName ?? event.payload.customerName,
      customerPhone: logisticsOrder?.customerPhone ?? event.payload.customerPhone,
      deliveryAddress:
        logisticsOrder?.deliveryAddress ?? event.payload.deliveryAddress,
      deliveryZone: logisticsOrder?.deliveryZone ?? event.payload.deliveryZone,
      deliveryPrice: logisticsOrder?.deliveryPrice ?? event.payload.deliveryPrice,
      deliveryEta: logisticsOrder?.deliveryEta ?? event.payload.deliveryEta,
      orderTotal: logisticsOrder?.totalPriceRub ?? event.payload.orderTotal,
      notificationEventId: event.eventId,
      notificationEventType: event.eventType,
    },
  });
}
