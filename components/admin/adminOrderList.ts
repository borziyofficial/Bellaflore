// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: Админка
//
// Purpose (EN): Dashboard metrics, order management, dispatch, and route planning UI logic.
//
// Назначение (RU): Метрики, управление заказами, диспетчеризация и планирование маршрутов.
// ==================================================
import { CHECKOUT_ORDERS_STORAGE_KEY } from "@/components/checkout/checkoutOrderStorage";
import {
  getOrderStatus,
  getOrderStatusesInSortOrder,
  type OrderStatusId,
} from "@/components/orders/orderStatus";
import type { OrderTimelineEvent } from "@/components/orders/orderTimeline";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type AdminOrderSortKey =
  | "newest"
  | "oldest"
  | "status"
  | "deliveryDate";

export type AdminOrderItem = {
  bouquetId: string;
  bouquetName: string;
  quantity: number;
  priceRub: number;
  lineTotalRub: number;
};

export type AdminOrderRecord = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  comment: string;
  customerComment?: string;
  cardMessage?: string;
  items: AdminOrderItem[];
  totalPriceRub: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentProofFileName: string | null;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  deliveryZoneId?: string;
  deliveryZoneLabel?: string;
  deliveryZonePriceRub?: number;
  deliveryZoneDistanceKm?: number;
  deliveryZoneRoadDistanceKm?: number;
  deliveryZoneRoadDurationMinutes?: number;
  deliveryZoneStatus?: string;
  deliveryZoneDetectionMode?: string;
  validationStatus?: string;
  validationWarnings?: string[];
  validationVersion?: string;
  validatedAt?: string;
  status: OrderStatusId;
  createdAt: string;
  createdAtDisplay?: string;
  updatedAt?: string;
  timeline?: OrderTimelineEvent[];
  checkoutSource?: string;
  assignedCourierId?: string;
  assignedCourierName?: string;
  assignedCourierPhone?: string;
};

export type AdminOrderDateFilter = {
  date?: string;
  from?: string;
  to?: string;
};

export type AdminOrderDatePreset = "all" | "today" | "tomorrow" | "thisWeek";

export type AdminOrderCourierFilter = "all" | "unassigned" | string;

export type AdminOrderCrmFilters = {
  searchQuery?: string;
  status?: OrderStatusId | "all";
  courier?: AdminOrderCourierFilter;
  datePreset?: AdminOrderDatePreset;
  sortBy?: AdminOrderSortKey;
};

export const ADMIN_ORDER_STATUS_FILTERS: OrderStatusId[] = [
  "CREATED",
  "CONFIRMED",
  "PREPARING",
  "COURIER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const STATUS_SORT_ORDER = getOrderStatusesInSortOrder().reduce<
  Record<OrderStatusId, number>
>(
  (sortOrderMap, status, index) => {
    sortOrderMap[status.id] = index;
    return sortOrderMap;
  },
  {} as Record<OrderStatusId, number>,
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAdminOrderItem(value: unknown): value is AdminOrderItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.bouquetId === "string" &&
    typeof value.bouquetName === "string" &&
    typeof value.quantity === "number" &&
    typeof value.priceRub === "number" &&
    typeof value.lineTotalRub === "number"
  );
}

function normalizeOrderStatus(rawStatus: unknown): OrderStatusId | null {
  if (typeof rawStatus !== "string") {
    return getOrderStatus("CREATED")?.id ?? null;
  }

  return getOrderStatus(rawStatus)?.id ?? null;
}

function normalizeTimeline(value: unknown): OrderTimelineEvent[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value as OrderTimelineEvent[];
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function normalizeAdminOrder(order: unknown): AdminOrderRecord | null {
  if (!isRecord(order)) {
    return null;
  }

  const orderId = typeof order.orderId === "string" ? order.orderId.trim() : "";

  if (!orderId) {
    return null;
  }

  if (typeof order.customerName !== "string" || !order.customerName.trim()) {
    return null;
  }

  if (typeof order.customerPhone !== "string" || !order.customerPhone.trim()) {
    return null;
  }

  if (!Array.isArray(order.items) || !order.items.every(isAdminOrderItem)) {
    return null;
  }

  const status = normalizeOrderStatus(order.status);

  if (!status) {
    return null;
  }

  const createdAt =
    typeof order.createdAt === "string" && order.createdAt.trim()
      ? order.createdAt
      : new Date(0).toISOString();

  return {
    orderId,
    customerName: order.customerName.trim(),
    customerPhone: order.customerPhone.trim(),
    comment: typeof order.comment === "string" ? order.comment : "",
    customerComment:
      typeof order.customerComment === "string"
        ? order.customerComment
        : undefined,
    cardMessage:
      typeof order.cardMessage === "string" ? order.cardMessage : undefined,
    items: order.items,
    totalPriceRub:
      typeof order.totalPriceRub === "number" ? order.totalPriceRub : 0,
    paymentMethod:
      typeof order.paymentMethod === "string" ? order.paymentMethod : "",
    paymentStatus:
      typeof order.paymentStatus === "string" ? order.paymentStatus : "PENDING",
    paymentProofFileName:
      typeof order.paymentProofFileName === "string" ||
      order.paymentProofFileName === null
        ? order.paymentProofFileName
        : null,
    deliveryAddress:
      typeof order.deliveryAddress === "string" ? order.deliveryAddress : "",
    deliveryDate: typeof order.deliveryDate === "string" ? order.deliveryDate : "",
    deliveryTime: typeof order.deliveryTime === "string" ? order.deliveryTime : "",
    status,
    createdAt,
    createdAtDisplay:
      typeof order.createdAtDisplay === "string"
        ? order.createdAtDisplay
        : undefined,
    updatedAt: typeof order.updatedAt === "string" ? order.updatedAt : undefined,
    timeline: normalizeTimeline(order.timeline),
    checkoutSource:
      typeof order.checkoutSource === "string"
        ? order.checkoutSource
        : undefined,
    assignedCourierId:
      typeof order.assignedCourierId === "string"
        ? order.assignedCourierId
        : undefined,
    assignedCourierName:
      typeof order.assignedCourierName === "string"
        ? order.assignedCourierName
        : undefined,
    assignedCourierPhone:
      typeof order.assignedCourierPhone === "string"
        ? order.assignedCourierPhone
        : undefined,
  };
}

function readStoredAdminOrders(): AdminOrderRecord[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedOrders = window.localStorage.getItem(CHECKOUT_ORDERS_STORAGE_KEY);
    const parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];

    if (!Array.isArray(parsedOrders)) {
      return [];
    }

    return parsedOrders
      .map(normalizeAdminOrder)
      .filter((order): order is AdminOrderRecord => order !== null);
  } catch {
    return [];
  }
}

export function getAllOrders(): AdminOrderRecord[] {
  return sortOrders(readStoredAdminOrders(), "newest");
}

function getCreatedAtTimestamp(order: AdminOrderRecord): number {
  const createdAt = new Date(order.createdAt).getTime();

  return Number.isNaN(createdAt) ? 0 : createdAt;
}

function parseDateValue(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const directParse = Date.parse(trimmedValue);

  if (!Number.isNaN(directParse)) {
    return directParse;
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

function getDeliveryDateTimestamp(order: AdminOrderRecord): number {
  return parseDateValue(order.deliveryDate) ?? Number.MAX_SAFE_INTEGER;
}

function normalizeFilterDate(value: string): number | null {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  const parsedValue = parseDateValue(trimmedValue);

  if (parsedValue === null) {
    return null;
  }

  const date = new Date(parsedValue);

  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
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

export function sortOrders(
  orders: AdminOrderRecord[],
  sortBy: AdminOrderSortKey,
): AdminOrderRecord[] {
  const sortedOrders = [...orders];

  sortedOrders.sort((firstOrder, secondOrder) => {
    switch (sortBy) {
      case "oldest":
        return getCreatedAtTimestamp(firstOrder) - getCreatedAtTimestamp(secondOrder);
      case "status": {
        const firstStatusOrder = STATUS_SORT_ORDER[firstOrder.status] ?? 999;
        const secondStatusOrder = STATUS_SORT_ORDER[secondOrder.status] ?? 999;

        if (firstStatusOrder !== secondStatusOrder) {
          return firstStatusOrder - secondStatusOrder;
        }

        return getCreatedAtTimestamp(secondOrder) - getCreatedAtTimestamp(firstOrder);
      }
      case "deliveryDate": {
        const deliveryDifference =
          getDeliveryDateTimestamp(firstOrder) -
          getDeliveryDateTimestamp(secondOrder);

        if (deliveryDifference !== 0) {
          return deliveryDifference;
        }

        return getCreatedAtTimestamp(secondOrder) - getCreatedAtTimestamp(firstOrder);
      }
      case "newest":
      default:
        return getCreatedAtTimestamp(secondOrder) - getCreatedAtTimestamp(firstOrder);
    }
  });

  return sortedOrders;
}

export function filterOrdersByStatus(
  orders: AdminOrderRecord[],
  status: OrderStatusId | OrderStatusId[],
): AdminOrderRecord[] {
  const statuses = Array.isArray(status) ? status : [status];
  const normalizedStatuses = new Set(
    statuses
      .map((statusId) => getOrderStatus(statusId)?.id)
      .filter((statusId): statusId is OrderStatusId => Boolean(statusId)),
  );

  if (normalizedStatuses.size === 0) {
    return [];
  }

  return orders.filter((order) => normalizedStatuses.has(order.status));
}

export function filterOrdersByDate(
  orders: AdminOrderRecord[],
  filter: AdminOrderDateFilter,
): AdminOrderRecord[] {
  const exactDate = filter.date ? normalizeFilterDate(filter.date) : null;
  const rangeFrom = filter.from ? normalizeFilterDate(filter.from) : null;
  const rangeTo = filter.to ? normalizeFilterDate(filter.to) : null;

  if (exactDate === null && rangeFrom === null && rangeTo === null) {
    return orders;
  }

  return orders.filter((order) => {
    const deliveryDay = getDeliveryDayTimestamp(order);

    if (deliveryDay === null) {
      return false;
    }

    if (exactDate !== null) {
      return deliveryDay === exactDate;
    }

    if (rangeFrom !== null && deliveryDay < rangeFrom) {
      return false;
    }

    if (rangeTo !== null && deliveryDay > rangeTo) {
      return false;
    }

    return rangeFrom !== null || rangeTo !== null;
  });
}

function toRussianFilterDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function getWeekRange(referenceDate: Date): { from: string; to: string } {
  const startOfWeek = new Date(referenceDate);
  const weekday = startOfWeek.getDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;

  startOfWeek.setDate(startOfWeek.getDate() - daysFromMonday);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);

  return {
    from: toRussianFilterDate(startOfWeek),
    to: toRussianFilterDate(endOfWeek),
  };
}

export function searchAdminOrders(
  orders: AdminOrderRecord[],
  query: string,
): AdminOrderRecord[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return orders;
  }

  return orders.filter((order) => {
    const searchableValues = [
      order.orderId,
      order.customerName,
      order.customerPhone,
      order.deliveryAddress,
      ...order.items.map((item) => item.bouquetName),
    ];

    return searchableValues.some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
  });
}

export function filterOrdersByCourier(
  orders: AdminOrderRecord[],
  courierFilter: AdminOrderCourierFilter,
): AdminOrderRecord[] {
  if (courierFilter === "all") {
    return orders;
  }

  if (courierFilter === "unassigned") {
    return orders.filter((order) => !order.assignedCourierId?.trim());
  }

  const normalizedCourierId = courierFilter.trim();

  return orders.filter(
    (order) => order.assignedCourierId === normalizedCourierId,
  );
}

export function filterOrdersByDatePreset(
  orders: AdminOrderRecord[],
  preset: AdminOrderDatePreset,
  referenceDate: Date = new Date(),
): AdminOrderRecord[] {
  if (preset === "all") {
    return orders;
  }

  if (preset === "today") {
    return filterOrdersByDate(orders, {
      date: toRussianFilterDate(referenceDate),
    });
  }

  if (preset === "tomorrow") {
    const tomorrow = new Date(referenceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return filterOrdersByDate(orders, {
      date: toRussianFilterDate(tomorrow),
    });
  }

  const weekRange = getWeekRange(referenceDate);

  return filterOrdersByDate(orders, weekRange);
}

export function queryAdminOrders(
  filters: AdminOrderCrmFilters,
  referenceDate: Date = new Date(),
): AdminOrderRecord[] {
  let orders = readStoredAdminOrders();

  if (filters.searchQuery?.trim()) {
    orders = searchAdminOrders(orders, filters.searchQuery);
  }

  if (filters.status && filters.status !== "all") {
    orders = filterOrdersByStatus(orders, filters.status);
  }

  if (filters.courier && filters.courier !== "all") {
    orders = filterOrdersByCourier(orders, filters.courier);
  }

  if (filters.datePreset && filters.datePreset !== "all") {
    orders = filterOrdersByDatePreset(orders, filters.datePreset, referenceDate);
  }

  return sortOrders(orders, filters.sortBy ?? "newest");
}

export type AdminKanbanColumn = {
  status: OrderStatusId;
  label: string;
  orders: AdminOrderRecord[];
};

export const ADMIN_KANBAN_COLUMNS: Array<{
  status: OrderStatusId;
  label: string;
}> = [
  { status: "CREATED", label: "Создан" },
  { status: "CONFIRMED", label: "Подтверждён" },
  { status: "PREPARING", label: "Букет собирается" },
  { status: "COURIER_ASSIGNED", label: "Курьер назначен" },
  { status: "OUT_FOR_DELIVERY", label: "Курьер в пути" },
  { status: "DELIVERED", label: "Доставлен" },
  { status: "CANCELLED", label: "Отменён" },
];

export function groupOrdersForKanban(
  orders: AdminOrderRecord[],
): AdminKanbanColumn[] {
  return ADMIN_KANBAN_COLUMNS.map((column) => ({
    ...column,
    orders: filterOrdersByStatus(orders, column.status),
  }));
}

export function findOrderById(
  orderId: string,
  orders: AdminOrderRecord[] = getAllOrders(),
): AdminOrderRecord | null {
  const normalizedOrderId = orderId.trim();

  if (!normalizedOrderId) {
    return null;
  }

  return (
    orders.find((order) => order.orderId === normalizedOrderId) ?? null
  );
}

export type AdminOrderStoragePatch = {
  status?: string;
  timeline?: OrderTimelineEvent[];
  updatedAt?: string;
  assignedCourierId?: string;
  assignedCourierName?: string;
  assignedCourierPhone?: string;
};

export function patchStoredAdminOrder(
  orderId: string,
  patch: AdminOrderStoragePatch,
): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const storedOrders = window.localStorage.getItem(CHECKOUT_ORDERS_STORAGE_KEY);
    const parsedOrders = storedOrders ? JSON.parse(storedOrders) : [];

    if (!Array.isArray(parsedOrders)) {
      return false;
    }

    let orderFound = false;

    const nextOrders = parsedOrders.map((rawOrder: unknown) => {
      if (!isRecord(rawOrder)) {
        return rawOrder;
      }

      const rawOrderId =
        typeof rawOrder.orderId === "string" ? rawOrder.orderId.trim() : "";

      if (rawOrderId !== orderId.trim()) {
        return rawOrder;
      }

      orderFound = true;

      return {
        ...rawOrder,
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.timeline !== undefined ? { timeline: patch.timeline } : {}),
        ...(patch.updatedAt !== undefined ? { updatedAt: patch.updatedAt } : {}),
        ...(patch.assignedCourierId !== undefined
          ? { assignedCourierId: patch.assignedCourierId }
          : {}),
        ...(patch.assignedCourierName !== undefined
          ? { assignedCourierName: patch.assignedCourierName }
          : {}),
        ...(patch.assignedCourierPhone !== undefined
          ? { assignedCourierPhone: patch.assignedCourierPhone }
          : {}),
      };
    });

    if (!orderFound) {
      return false;
    }

    window.localStorage.setItem(
      CHECKOUT_ORDERS_STORAGE_KEY,
      JSON.stringify(nextOrders),
    );

    return true;
  } catch {
    return false;
  }
}
