// ==================================================
// SECTION: ORDER INTELLIGENCE
// РАЗДЕЛ: Order alerts foundation
// ==================================================
import type {
  Order,
  OrderAlert,
  OrderAlertKind,
} from "@/components/orderIntelligence/orderIntelligenceTypes";

const UNCONFIRMED_THRESHOLD_MS = 15 * 60 * 1000;
const COURIER_ASSIGNMENT_THRESHOLD_MS = 45 * 60 * 1000;
const DELIVERY_DELAY_THRESHOLD_MS = 20 * 60 * 1000;

function createAlert(
  order: Order,
  kind: OrderAlertKind,
  severity: OrderAlert["severity"],
  title: string,
  message: string,
): OrderAlert {
  return {
    id: `ALERT-${order.id}-${kind}`,
    orderId: order.id,
    kind,
    severity,
    title,
    message,
    createdAt: new Date().toISOString(),
  };
}

function isDeliveryDayToday(order: Order, now: Date): boolean {
  return order.delivery.deliveryDate === now.toISOString().slice(0, 10);
}

export function detectOrderAlerts(
  orders: Order[],
  now: Date = new Date(),
): OrderAlert[] {
  const alerts: OrderAlert[] = [];

  for (const order of orders) {
    const ageMs = now.getTime() - Date.parse(order.createdAt);

    if (order.status === "new") {
      alerts.push(
        createAlert(
          order,
          "new_order",
          "info",
          "Новый заказ",
          `Заказ ${order.id} ожидает обработки`,
        ),
      );

      if (ageMs >= UNCONFIRMED_THRESHOLD_MS) {
        alerts.push(
          createAlert(
            order,
            "unconfirmed_order",
            "warning",
            "Заказ долго не подтверждён",
            `Заказ ${order.id} создан более 15 минут назад и всё ещё не подтверждён`,
          ),
        );
      }
    }

    if (
      ["confirmed", "preparing", "ready"].includes(order.status) &&
      !order.delivery.courierId &&
      ageMs >= COURIER_ASSIGNMENT_THRESHOLD_MS
    ) {
      alerts.push(
        createAlert(
          order,
          "courier_not_assigned",
          "warning",
          "Курьер не назначен",
          `Для заказа ${order.id} ещё не назначен курьер`,
        ),
      );
    }

    if (
      order.status === "in_delivery" &&
      isDeliveryDayToday(order, now) &&
      ageMs >= DELIVERY_DELAY_THRESHOLD_MS
    ) {
      alerts.push(
        createAlert(
          order,
          "delivery_delayed",
          "critical",
          "Доставка опаздывает",
          `Заказ ${order.id} в доставке дольше ожидаемого времени`,
        ),
      );
    }
  }

  return alerts;
}

export function getOrderAlertsForOrder(
  orderId: string,
  orders: Order[],
  now: Date = new Date(),
): OrderAlert[] {
  return detectOrderAlerts(orders, now).filter((alert) => alert.orderId === orderId);
}

export function listActiveOrderAlerts(orders: Order[]): OrderAlert[] {
  return detectOrderAlerts(orders).filter((alert) => alert.severity !== "info");
}
