// ==================================================
// SECTION: STORAGE
// РАЗДЕЛ: Хранилище
//
// Purpose (EN): Persistence layer for crmCore.
//
// Назначение (RU): Слой персистентности для crmCore.
// ==================================================
import type { CrmCustomer } from "@/components/crmCore/crmCustomerTypes";
import type { CrmOrder, CrmQueueName } from "@/components/crmCore/crmTypes";

export const CRM_ORDERS_STORAGE_KEY = "bellaflore_crm_orders_v1";

// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export const CRM_CUSTOMERS_STORAGE_KEY = "bellaflore_crm_customers_v1";
export const CRM_QUEUE_STORAGE_KEY = "bellaflore_crm_queue_v1";

export const CRM_QUEUE_NAMES: CrmQueueName[] = [
  "new_orders",
  "active_orders",
  "delayed_orders",
  "completed_orders",
  "cancelled_orders",
  "high_priority_orders",
];

export type CrmQueueState = Record<CrmQueueName, string[]>;

export function createEmptyCrmQueueState(): CrmQueueState {
  return {
    new_orders: [],
    active_orders: [],
    delayed_orders: [],
    completed_orders: [],
    cancelled_orders: [],
    high_priority_orders: [],
  };
}

export function isCrmOrder(value: unknown): value is CrmOrder {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CrmOrder>;

  return (
    typeof candidate.crmOrderId === "string" &&
    candidate.crmOrderId.trim().length > 0 &&
    typeof candidate.orderId === "string" &&
    candidate.orderId.trim().length > 0 &&
    typeof candidate.customerId === "string" &&
    typeof candidate.customerName === "string" &&
    typeof candidate.customerPhone === "string" &&
    typeof candidate.currentStatus === "string" &&
    typeof candidate.createdAt === "string" &&
    typeof candidate.updatedAt === "string" &&
    Array.isArray(candidate.tags) &&
    Array.isArray(candidate.notes)
  );
}

export function isCrmCustomer(value: unknown): value is CrmCustomer {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CrmCustomer>;

  return (
    typeof candidate.customerId === "string" &&
    candidate.customerId.trim().length > 0 &&
    typeof candidate.name === "string" &&
    typeof candidate.phone === "string" &&
    typeof candidate.totalOrders === "number" &&
    typeof candidate.totalSpent === "number" &&
    Array.isArray(candidate.addresses) &&
    Array.isArray(candidate.tags) &&
    Array.isArray(candidate.notes)
  );
}


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function isCrmQueueState(value: unknown): value is CrmQueueState {
  if (!value || typeof value !== "object") {
    return false;
  }

  return CRM_QUEUE_NAMES.every((queueName) =>
    Array.isArray((value as CrmQueueState)[queueName]),
  );
}

export function readCrmOrders(): CrmOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CRM_ORDERS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isCrmOrder);
  } catch {
    return [];
  }
}

export function writeCrmOrders(orders: CrmOrder[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CRM_ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // In-memory CRM order state still works if storage is blocked.
  }
}

export function saveCrmOrder(order: CrmOrder): CrmOrder[] {
  const existingOrders = readCrmOrders();
  const existingIndex = existingOrders.findIndex(
    (storedOrder) => storedOrder.orderId === order.orderId,
  );

  const nextOrders =
    existingIndex === -1
      ? [...existingOrders, order]
      : existingOrders.map((storedOrder, index) =>
          index === existingIndex ? order : storedOrder,
        );

  writeCrmOrders(nextOrders);
  return nextOrders;
}

export function readCrmCustomers(): CrmCustomer[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CRM_CUSTOMERS_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.filter(isCrmCustomer);
  } catch {
    return [];
  }
}

export function writeCrmCustomers(customers: CrmCustomer[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CRM_CUSTOMERS_STORAGE_KEY,
      JSON.stringify(customers),
    );
  } catch {
    // In-memory CRM customer state still works if storage is blocked.
  }
}

export function saveCrmCustomer(customer: CrmCustomer): CrmCustomer[] {
  const existingCustomers = readCrmCustomers();
  const existingIndex = existingCustomers.findIndex(
    (storedCustomer) => storedCustomer.customerId === customer.customerId,
  );

  const nextCustomers =
    existingIndex === -1
      ? [...existingCustomers, customer]
      : existingCustomers.map((storedCustomer, index) =>
          index === existingIndex ? customer : storedCustomer,
        );

  writeCrmCustomers(nextCustomers);
  return nextCustomers;
}

export function readCrmQueueState(): CrmQueueState {
  if (typeof window === "undefined") {
    return createEmptyCrmQueueState();
  }

  try {
    const rawValue = window.localStorage.getItem(CRM_QUEUE_STORAGE_KEY);
    const parsedValue = rawValue ? JSON.parse(rawValue) : null;

    if (!isCrmQueueState(parsedValue)) {
      return createEmptyCrmQueueState();
    }

    return parsedValue;
  } catch {
    return createEmptyCrmQueueState();
  }
}

export function writeCrmQueueState(queueState: CrmQueueState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CRM_QUEUE_STORAGE_KEY,
      JSON.stringify(queueState),
    );
  } catch {
    // In-memory CRM queue state still works if storage is blocked.
  }
}

export function saveCrmQueueState(queueState: CrmQueueState): CrmQueueState {
  writeCrmQueueState(queueState);
  return queueState;
}
