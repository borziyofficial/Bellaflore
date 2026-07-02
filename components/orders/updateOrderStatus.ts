// ==================================================
// SECTION: ORDERS
// РАЗДЕЛ: Заказы
//
// Purpose (EN):
// Order status transition helpers and validation for admin updates.
//
// Назначение (RU):
// Хелперы переходов статуса заказа и валидация обновлений админки.
// ==================================================
import { getOrderStatus, type OrderStatusId } from "@/components/orders/orderStatus";
import {
  appendTimelineEvent,
  createTimelineEvent,
  type OrderTimelineEvent,
  type OrderTimelineSource,
} from "@/components/orders/orderTimeline";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN):
// Exported type and interface definitions.
//
// Назначение (RU):
// Экспортируемые типы и интерфейсы.
// ==================================================
export type UpdateOrderStatusSource = Extract<
  OrderTimelineSource,
  "admin" | "courier" | "system" | "robot"
>;

export type UpdateOrderStatusOptions = {
  updatedBy: string;
  source: UpdateOrderStatusSource;
  note?: string;
  visibleToCustomer?: boolean;
  updatedAt?: string | Date;
};

export type UpdatableOrder = {
  status: string;
  timeline?: OrderTimelineEvent[];
  updatedAt?: string;
};

export type UpdateOrderStatusResult<T extends UpdatableOrder> =
  | {
      ok: true;
      order: T;
    }
  | {
      ok: false;
      order: T;
      error: string;
    };


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
function normalizeUpdatedAt(updatedAt: string | Date = new Date()): string {
  const timestamp =
    updatedAt instanceof Date ? updatedAt : new Date(updatedAt);

  if (Number.isNaN(timestamp.getTime())) {
    return new Date().toISOString();
  }

  return timestamp.toISOString();
}

function toStoredOrderStatus(statusId: OrderStatusId): string {
  return statusId === "CREATED" ? "NEW" : statusId;
}

export function updateOrderStatus<T extends UpdatableOrder>(
  order: T,
  nextStatus: string,
  options: UpdateOrderStatusOptions,
): UpdateOrderStatusResult<T> {
  const statusDefinition = getOrderStatus(nextStatus);

  if (!statusDefinition) {
    return {
      ok: false,
      order,
      error: "Invalid order status.",
    };
  }

  const updatedBy = options.updatedBy.trim();

  if (!updatedBy) {
    return {
      ok: false,
      order,
      error: "updatedBy is required.",
    };
  }

  const timelineEvent = createTimelineEvent({
    status: statusDefinition.id,
    updatedBy,
    source: options.source,
    note: options.note,
    visibleToCustomer: options.visibleToCustomer,
    createdAt: options.updatedAt,
  });

  if (!timelineEvent) {
    return {
      ok: false,
      order,
      error: "Unable to create timeline event.",
    };
  }

  return {
    ok: true,
    order: {
      ...order,
      status: toStoredOrderStatus(statusDefinition.id),
      timeline: appendTimelineEvent(order.timeline ?? [], timelineEvent),
      updatedAt: normalizeUpdatedAt(options.updatedAt),
    },
  };
}
