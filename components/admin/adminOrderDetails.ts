// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админка
//
// Purpose (EN): Dashboard metrics, order management, dispatch, and route planning UI logic.
//
// Назначение (RU): Метрики, управление заказами, диспетчеризация и планирование маршрутов.
// ==================================================
import {
  findOrderById,
  type AdminOrderRecord,
} from "@/components/admin/adminOrderList";
import {
  getOrderStatusLabel,
  type OrderStatusId,
} from "@/components/orders/orderStatus";
import {
  createTimelineEvent,
  getLatestTimelineStatus,
  sortTimelineEvents,
  type OrderTimelineEvent,
} from "@/components/orders/orderTimeline";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type AdminOrderDetails = {
  orderId: string;
  currentStatus: OrderStatusId;
  currentStatusLabel: string;
  timeline: OrderTimelineEvent[];
  bouquet: string;
  quantity: number;
  priceRub: number;
  totalPriceRub: number;
  customer: string;
  phone: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryInterval: string;
  deliveryZoneId: string | null;
  deliveryZoneLabel: string | null;
  deliveryZonePriceRub: number | null;
  deliveryZoneDistanceKm: number | null;
  deliveryZoneRoadDistanceKm: number | null;
  deliveryZoneRoadDurationMinutes: number | null;
  deliveryZoneStatus: string | null;
  deliveryZoneDetectionMode: string | null;
  validationStatus: string | null;
  validationWarnings: string[];
  validationVersion: string | null;
  validatedAt: string | null;
  bouquetsTotalRub: number;
  comment: string;
  createdAt: string;
  createdAtDisplay?: string;
  updatedAt: string | null;
  assignedCourierName: string | null;
  assignedCourierPhone: string | null;
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function resolveAdminOrderComment(order: AdminOrderRecord): string {
  return order.customerComment?.trim() || order.comment.trim();
}

function resolveAdminOrderTimeline(order: AdminOrderRecord): OrderTimelineEvent[] {
  if (order.timeline && order.timeline.length > 0) {
    return sortTimelineEvents(order.timeline);
  }

  const defaultEvent = createTimelineEvent({
    status: order.status,
    updatedBy: "BellaFlore",
    source: "system",
    visibleToCustomer: true,
    createdAt: order.createdAt,
  });

  return defaultEvent ? [defaultEvent] : [];
}

function buildAdminOrderDetails(order: AdminOrderRecord): AdminOrderDetails {
  const timeline = resolveAdminOrderTimeline(order);
  const primaryItem = order.items[0];
  const currentStatus = getLatestTimelineStatus(timeline) ?? order.status;
  const bouquetsTotalRub = order.items.reduce(
    (total, item) => total + item.lineTotalRub,
    0,
  );

  return {
    orderId: order.orderId,
    currentStatus,
    currentStatusLabel: getOrderStatusLabel(currentStatus),
    timeline,
    bouquet: primaryItem?.bouquetName ?? "",
    quantity: primaryItem?.quantity ?? 0,
    priceRub: primaryItem?.priceRub ?? 0,
    totalPriceRub: order.totalPriceRub,
    customer: order.customerName,
    phone: order.customerPhone,
    deliveryAddress: order.deliveryAddress,
    deliveryDate: order.deliveryDate,
    deliveryInterval: order.deliveryTime,
    deliveryZoneId: order.deliveryZoneId ?? null,
    deliveryZoneLabel: order.deliveryZoneLabel ?? null,
    deliveryZonePriceRub:
      typeof order.deliveryZonePriceRub === "number"
        ? order.deliveryZonePriceRub
        : null,
    deliveryZoneDistanceKm:
      typeof order.deliveryZoneDistanceKm === "number"
        ? order.deliveryZoneDistanceKm
        : null,
    deliveryZoneRoadDistanceKm:
      typeof order.deliveryZoneRoadDistanceKm === "number"
        ? order.deliveryZoneRoadDistanceKm
        : null,
    deliveryZoneRoadDurationMinutes:
      typeof order.deliveryZoneRoadDurationMinutes === "number"
        ? order.deliveryZoneRoadDurationMinutes
        : null,
    deliveryZoneStatus: order.deliveryZoneStatus ?? null,
    deliveryZoneDetectionMode: order.deliveryZoneDetectionMode ?? null,
    validationStatus: order.validationStatus ?? null,
    validationWarnings: order.validationWarnings ?? [],
    validationVersion: order.validationVersion ?? null,
    validatedAt: order.validatedAt ?? null,
    bouquetsTotalRub,
    comment: resolveAdminOrderComment(order),
    createdAt: order.createdAt,
    createdAtDisplay: order.createdAtDisplay,
    updatedAt: order.updatedAt ?? null,
    assignedCourierName: order.assignedCourierName?.trim() || null,
    assignedCourierPhone: order.assignedCourierPhone?.trim() || null,
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
export function getOrderDetails(
  orderId: string,
  orders?: AdminOrderRecord[],
): AdminOrderDetails | null {
  const order = findOrderById(orderId, orders);

  if (!order) {
    return null;
  }

  return buildAdminOrderDetails(order);
}
