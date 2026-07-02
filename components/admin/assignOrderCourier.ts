// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админка
//
// Purpose (EN): Dashboard metrics, order management, dispatch, and route planning UI logic.
//
// Назначение (RU): Метрики, управление заказами, диспетчеризация и планирование маршрутов.
// ==================================================
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import {
  findCourierById,
  type Courier,
} from "@/components/couriers/courierModel";
import { appendTimelineEvent } from "@/components/orders/orderTimeline";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type AssignOrderCourierResult =
  | {
      ok: true;
      order: AdminOrderRecord;
    }
  | {
      ok: false;
      order: AdminOrderRecord;
      error: string;
    };


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function assignOrderCourier(
  order: AdminOrderRecord,
  courierId: string,
): AssignOrderCourierResult {
  const courier = findCourierById(courierId);

  if (!courier) {
    return {
      ok: false,
      order,
      error: "Courier not found.",
    };
  }

  if (!courier.isAvailable) {
    return {
      ok: false,
      order,
      error: "Courier is not available.",
    };
  }

  return assignOrderCourierRecord(order, courier);
}

export function assignOrderCourierRecord(
  order: AdminOrderRecord,
  courier: Courier,
): AssignOrderCourierResult {
  const timeline = appendTimelineEvent(order.timeline ?? [], {
    status: order.status,
    updatedBy: "Admin",
    source: "admin",
    note: `Courier ${courier.fullName} assigned`,
    visibleToCustomer: true,
  });

  return {
    ok: true,
    order: {
      ...order,
      assignedCourierId: courier.id,
      assignedCourierName: courier.fullName,
      assignedCourierPhone: courier.phone,
      timeline,
      updatedAt: new Date().toISOString(),
    },
  };
}
