// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админка
//
// Purpose (EN): Dashboard metrics, order management, dispatch, and route planning UI logic.
//
// Назначение (RU): Метрики, управление заказами, диспетчеризация и планирование маршрутов.
// ==================================================
import { deliveryIntervals } from "@/components/checkout/deliveryIntervals";
import type { AdminOrderRecord } from "@/components/admin/adminOrderList";
import { getOrderStatus } from "@/components/orders/orderStatus";

export type DeliveryPlannerDayGroup = "today" | "tomorrow" | "future";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type DeliveryPlannerConflict =
  | "unassigned"
  | "missing-interval"
  | "courier-overlap";

export type DeliveryPlannerWorkloadLevel = "low" | "medium" | "high";

export type DeliveryPlannerOrderEntry = {
  order: AdminOrderRecord;
  intervalLabel: string | null;
  conflicts: DeliveryPlannerConflict[];
};

export type DeliveryPlannerIntervalGroup = {
  label: string;
  orders: DeliveryPlannerOrderEntry[];
};

export type DeliveryPlannerDaySection = {
  group: DeliveryPlannerDayGroup;
  title: string;
  intervals: DeliveryPlannerIntervalGroup[];
  unscheduledOrders: DeliveryPlannerOrderEntry[];
};

export type DeliveryPlannerCourierWorkload = {
  courierId: string;
  courierName: string;
  deliveryCount: number;
  workloadLevel: DeliveryPlannerWorkloadLevel;
};

export type DeliveryPlannerPlan = {
  daySections: DeliveryPlannerDaySection[];
  courierWorkloads: DeliveryPlannerCourierWorkload[];
  totalDeliveries: number;
};

export const DELIVERY_PLANNER_INTERVAL_LABELS = deliveryIntervals.map(
  (interval) => interval.label,
);


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function parseDateValue(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const directParse = Date.parse(trimmedValue);

  if (!Number.isNaN(directParse)) {
    return directParse;
  }

  const isoDateMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoDateMatch) {
    const [, year, month, day] = isoDateMatch;
    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    ).getTime();

    return Number.isNaN(parsedDate) ? null : parsedDate;
  }

  const russianDateMatch = trimmedValue.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

  if (russianDateMatch) {
    const [, day, month, year] = russianDateMatch;
    const parsedDate = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
    ).getTime();

    return Number.isNaN(parsedDate) ? null : parsedDate;
  }

  return null;
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function getAdminOrderDeliveryDayTimestamp(
  order: AdminOrderRecord,
): number | null {
  return getDeliveryDayTimestamp(order);
}

function getDeliveryDayTimestamp(order: AdminOrderRecord): number | null {
  const deliveryTimestamp = parseDateValue(order.deliveryDate);

  if (deliveryTimestamp === null) {
    return null;
  }

  const deliveryDate = new Date(deliveryTimestamp);

  return Date.UTC(
    deliveryDate.getFullYear(),
    deliveryDate.getMonth(),
    deliveryDate.getDate(),
  );
}

function getReferenceDayTimestamp(referenceDate: Date): number {
  return Date.UTC(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
}

function normalizeIntervalLabel(value: string): string {
  return value.trim().replace(/-/g, "–");
}

export function resolveDeliveryPlannerInterval(
  deliveryTime: string,
): string | null {
  const normalizedDeliveryTime = normalizeIntervalLabel(deliveryTime);

  if (!normalizedDeliveryTime) {
    return null;
  }

  const matchedInterval = DELIVERY_PLANNER_INTERVAL_LABELS.find(
    (label) => normalizeIntervalLabel(label) === normalizedDeliveryTime,
  );

  return matchedInterval ?? null;
}

function classifyDeliveryDayGroup(
  deliveryDayTimestamp: number,
  referenceDate: Date = new Date(),
): DeliveryPlannerDayGroup | null {
  const todayTimestamp = getReferenceDayTimestamp(referenceDate);
  const tomorrowTimestamp = todayTimestamp + 24 * 60 * 60 * 1000;

  if (deliveryDayTimestamp < todayTimestamp) {
    return null;
  }

  if (deliveryDayTimestamp === todayTimestamp) {
    return "today";
  }

  if (deliveryDayTimestamp === tomorrowTimestamp) {
    return "tomorrow";
  }

  return "future";
}

function getWorkloadLevel(
  deliveryCount: number,
): DeliveryPlannerWorkloadLevel {
  if (deliveryCount >= 5) {
    return "high";
  }

  if (deliveryCount >= 3) {
    return "medium";
  }

  return "low";
}

function buildOverlapKeys(
  entries: DeliveryPlannerOrderEntry[],
): Set<string> {
  const assignmentCounts = new Map<string, number>();

  for (const entry of entries) {
    if (
      !entry.intervalLabel ||
      !entry.order.assignedCourierId?.trim() ||
      entry.conflicts.includes("missing-interval")
    ) {
      continue;
    }

    const deliveryDay = getDeliveryDayTimestamp(entry.order);

    if (deliveryDay === null) {
      continue;
    }

    const overlapKey = [
      deliveryDay,
      entry.intervalLabel,
      entry.order.assignedCourierId.trim(),
    ].join("|");

    assignmentCounts.set(overlapKey, (assignmentCounts.get(overlapKey) ?? 0) + 1);
  }

  const overlappingKeys = new Set<string>();

  for (const [overlapKey, count] of assignmentCounts.entries()) {
    if (count > 1) {
      overlappingKeys.add(overlapKey);
    }
  }

  return overlappingKeys;
}

function applyCourierOverlapConflicts(
  entries: DeliveryPlannerOrderEntry[],
  overlappingKeys: Set<string>,
): DeliveryPlannerOrderEntry[] {
  return entries.map((entry) => {
    const deliveryDay = getDeliveryDayTimestamp(entry.order);
    const courierId = entry.order.assignedCourierId?.trim();

    if (!entry.intervalLabel || !courierId || deliveryDay === null) {
      return entry;
    }

    const overlapKey = [deliveryDay, entry.intervalLabel, courierId].join("|");

    if (!overlappingKeys.has(overlapKey)) {
      return entry;
    }

    if (entry.conflicts.includes("courier-overlap")) {
      return entry;
    }

    return {
      ...entry,
      conflicts: [...entry.conflicts, "courier-overlap"],
    };
  });
}

function createPlannerEntry(order: AdminOrderRecord): DeliveryPlannerOrderEntry {
  const conflicts: DeliveryPlannerConflict[] = [];
  const intervalLabel = resolveDeliveryPlannerInterval(order.deliveryTime);

  if (!intervalLabel) {
    conflicts.push("missing-interval");
  }

  if (!order.assignedCourierId?.trim()) {
    conflicts.push("unassigned");
  }

  return {
    order,
    intervalLabel,
    conflicts,
  };
}

function groupEntriesByDay(
  entries: DeliveryPlannerOrderEntry[],
  referenceDate: Date,
): DeliveryPlannerDaySection[] {
  const dayGroups: Record<
    DeliveryPlannerDayGroup,
    DeliveryPlannerOrderEntry[]
  > = {
    today: [],
    tomorrow: [],
    future: [],
  };

  for (const entry of entries) {
    const deliveryDay = getDeliveryDayTimestamp(entry.order);
    const dayGroup =
      deliveryDay === null
        ? null
        : classifyDeliveryDayGroup(deliveryDay, referenceDate);

    if (!dayGroup) {
      continue;
    }

    dayGroups[dayGroup].push(entry);
  }

  const titles: Record<DeliveryPlannerDayGroup, string> = {
    today: "Сегодня",
    tomorrow: "Завтра",
    future: "Будущие",
  };

  return (["today", "tomorrow", "future"] as DeliveryPlannerDayGroup[]).map(
    (group) => {
      const groupEntries = dayGroups[group];
      const intervals = DELIVERY_PLANNER_INTERVAL_LABELS.map((label) => ({
        label,
        orders: groupEntries.filter((entry) => entry.intervalLabel === label),
      }));
      const unscheduledOrders = groupEntries.filter(
        (entry) => entry.intervalLabel === null,
      );

      return {
        group,
        title: titles[group],
        intervals,
        unscheduledOrders,
      };
    },
  );
}

function buildCourierWorkloads(
  entries: DeliveryPlannerOrderEntry[],
): DeliveryPlannerCourierWorkload[] {
  const workloadMap = new Map<
    string,
    { courierName: string; deliveryCount: number }
  >();

  for (const entry of entries) {
    const courierId = entry.order.assignedCourierId?.trim();
    const courierName = entry.order.assignedCourierName?.trim();

    if (!courierId || !courierName) {
      continue;
    }

    const current = workloadMap.get(courierId);

    if (current) {
      current.deliveryCount += 1;
      continue;
    }

    workloadMap.set(courierId, {
      courierName,
      deliveryCount: 1,
    });
  }

  return [...workloadMap.entries()]
    .map(([courierId, workload]) => ({
      courierId,
      courierName: workload.courierName,
      deliveryCount: workload.deliveryCount,
      workloadLevel: getWorkloadLevel(workload.deliveryCount),
    }))
    .sort((first, second) => second.deliveryCount - first.deliveryCount);
}

export function buildDeliveryPlannerPlan(
  orders: AdminOrderRecord[],
  referenceDate: Date = new Date(),
): DeliveryPlannerPlan {
  const eligibleOrders = orders.filter((order) => {
    const statusId = getOrderStatus(order.status)?.id;

    return statusId !== "CANCELLED" && getDeliveryDayTimestamp(order) !== null;
  });

  let entries = eligibleOrders
    .map(createPlannerEntry)
    .filter((entry) => {
      const deliveryDay = getDeliveryDayTimestamp(entry.order);

      if (deliveryDay === null) {
        return false;
      }

      return classifyDeliveryDayGroup(deliveryDay, referenceDate) !== null;
    });

  const overlappingKeys = buildOverlapKeys(entries);
  entries = applyCourierOverlapConflicts(entries, overlappingKeys);

  return {
    daySections: groupEntriesByDay(entries, referenceDate),
    courierWorkloads: buildCourierWorkloads(entries),
    totalDeliveries: entries.length,
  };
}

export function getDeliveryPlannerConflictLabel(
  conflict: DeliveryPlannerConflict,
): string {
  switch (conflict) {
    case "unassigned":
      return "Курьер не назначен";
    case "missing-interval":
      return "Интервал не указан";
    case "courier-overlap":
      return "Конфликт интервала у курьера";
    default:
      return conflict;
  }
}

export function getDeliveryPlannerWorkloadLabel(
  level: DeliveryPlannerWorkloadLevel,
): string {
  switch (level) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    default:
      return level;
  }
}
