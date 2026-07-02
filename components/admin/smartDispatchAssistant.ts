// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админка
//
// Purpose (EN): Dashboard metrics, order management, dispatch, and route planning UI logic.
//
// Назначение (RU): Метрики, управление заказами, диспетчеризация и планирование маршрутов.
// ==================================================
import {
  getAdminOrderDeliveryDayTimestamp,
  resolveDeliveryPlannerInterval,
} from "@/components/admin/adminDeliveryPlanner";
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import { getDemoCouriers, type Courier } from "@/components/couriers/courierModel";
import { getOrderStatus } from "@/components/orders/orderStatus";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type SmartDispatchWorkloadEntry = {
  courierId: string;
  courierName: string;
  deliveryCount: number;
};

export type SmartDispatchRecommendation = {
  courierId: string;
  courierName: string;
  reasons: string[];
  workloadSummary: SmartDispatchWorkloadEntry[];
  conflictWarnings: string[];
};

type CourierCandidateScore = {
  courier: Courier;
  deliveryCount: number;
  hasIntervalConflict: boolean;
  score: number;
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function isActiveDispatchOrder(order: AdminOrderRecord): boolean {
  const statusId = getOrderStatus(order.status)?.id;

  return statusId !== "CANCELLED" && statusId !== "DELIVERED";
}

function countCourierDeliveriesOnDay(
  courierId: string,
  deliveryDay: number,
  orders: AdminOrderRecord[],
  excludeOrderId?: string,
): number {
  return orders.filter((order) => {
    if (excludeOrderId && order.orderId === excludeOrderId) {
      return false;
    }

    if (!isActiveDispatchOrder(order)) {
      return false;
    }

    if (order.assignedCourierId?.trim() !== courierId) {
      return false;
    }

    return getAdminOrderDeliveryDayTimestamp(order) === deliveryDay;
  }).length;
}

function courierHasIntervalConflict(
  courierId: string,
  deliveryDay: number,
  intervalLabel: string,
  orders: AdminOrderRecord[],
  excludeOrderId: string,
): boolean {
  return orders.some((order) => {
    if (order.orderId === excludeOrderId) {
      return false;
    }

    if (!isActiveDispatchOrder(order)) {
      return false;
    }

    if (order.assignedCourierId?.trim() !== courierId) {
      return false;
    }

    if (getAdminOrderDeliveryDayTimestamp(order) !== deliveryDay) {
      return false;
    }

    return resolveDeliveryPlannerInterval(order.deliveryTime) === intervalLabel;
  });
}

function buildWorkloadSummary(
  deliveryDay: number,
  orders: AdminOrderRecord[],
  excludeOrderId: string,
): SmartDispatchWorkloadEntry[] {
  return getDemoCouriers().map((courier) => ({
    courierId: courier.id,
    courierName: courier.fullName,
    deliveryCount: countCourierDeliveriesOnDay(
      courier.id,
      deliveryDay,
      orders,
      excludeOrderId,
    ),
  }));
}

function buildConflictWarnings(
  deliveryDay: number,
  intervalLabel: string | null,
  orders: AdminOrderRecord[],
  excludeOrderId: string,
): string[] {
  if (!intervalLabel) {
    return [];
  }

  return getDemoCouriers()
    .filter((courier) =>
      courierHasIntervalConflict(
        courier.id,
        deliveryDay,
        intervalLabel,
        orders,
        excludeOrderId,
      ),
    )
    .map(
      (courier) =>
        `⚠ ${courier.fullName} already has delivery at ${intervalLabel}`,
    );
}

function buildRecommendationReasons(
  candidate: CourierCandidateScore,
  intervalLabel: string | null,
  isLowestWorkload: boolean,
  referenceDate: Date,
  deliveryDay: number,
): string[] {
  const reasons = [`${candidate.deliveryCount} active deliveries`];

  if (candidate.hasIntervalConflict) {
    reasons.push(`Interval conflict at ${intervalLabel ?? "selected time"}`);
  } else {
    reasons.push("No interval conflict");
  }

  if (intervalLabel) {
    reasons.push(`Available ${intervalLabel}`);
  }

  const todayTimestamp = Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const workloadLabel =
    deliveryDay === todayTimestamp ? "today" : "on delivery date";

  if (isLowestWorkload) {
    reasons.push(`Lowest workload ${workloadLabel}`);
  }

  return reasons;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildSmartDispatchRecommendation(
  order: AdminOrderRecord,
  orders: AdminOrderRecord[],
  referenceDate: Date = new Date(),
): SmartDispatchRecommendation | null {
  if (order.assignedCourierId?.trim()) {
    return null;
  }

  const deliveryDay = getAdminOrderDeliveryDayTimestamp(order);

  if (deliveryDay === null) {
    return null;
  }

  const intervalLabel = resolveDeliveryPlannerInterval(order.deliveryTime);
  const workloadSummary = buildWorkloadSummary(
    deliveryDay,
    orders,
    order.orderId,
  );
  const conflictWarnings = buildConflictWarnings(
    deliveryDay,
    intervalLabel,
    orders,
    order.orderId,
  );

  const candidates = getDemoCouriers()
    .filter((courier) => courier.isAvailable)
    .map((courier) => {
      const deliveryCount = countCourierDeliveriesOnDay(
        courier.id,
        deliveryDay,
        orders,
        order.orderId,
      );
      const hasIntervalConflict = intervalLabel
        ? courierHasIntervalConflict(
            courier.id,
            deliveryDay,
            intervalLabel,
            orders,
            order.orderId,
          )
        : false;
      const score = deliveryCount * 10 + (hasIntervalConflict ? 100 : 0);

      return {
        courier,
        deliveryCount,
        hasIntervalConflict,
        score,
      };
    })
    .sort((first, second) => {
      if (first.score !== second.score) {
        return first.score - second.score;
      }

      return first.courier.fullName.localeCompare(second.courier.fullName, "ru");
    });

  if (candidates.length === 0) {
    return null;
  }

  const bestCandidate = candidates[0];
  const lowestDeliveryCount = Math.min(
    ...candidates.map((candidate) => candidate.deliveryCount),
  );
  const isLowestWorkload =
    bestCandidate.deliveryCount === lowestDeliveryCount &&
    candidates.filter(
      (candidate) => candidate.deliveryCount === lowestDeliveryCount,
    ).length === 1;

  return {
    courierId: bestCandidate.courier.id,
    courierName: bestCandidate.courier.fullName,
    reasons: buildRecommendationReasons(
      bestCandidate,
      intervalLabel,
      isLowestWorkload,
      referenceDate,
      deliveryDay,
    ),
    workloadSummary,
    conflictWarnings,
  };
}
