// ==================================================
// SECTION: CRM
// РАЗДЕЛ: CRM
//
// Purpose (EN): Customer relationship management engine, storage, and queue logic.
//
// Назначение (RU): Движок CRM, хранилище и логика очередей клиентов.
// ==================================================
import type {
  CrmOrder,
  CrmOrderStatus,
  CrmQueueName,
  CrmQueueBuckets,
} from "@/components/crmCore/crmTypes";
import {
  createEmptyCrmQueueState,
  readCrmOrders,
  readCrmQueueState,
  saveCrmQueueState,
  type CrmQueueState,
} from "@/components/crmCore/crmStorage";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const ACTIVE_CRM_STATUSES = new Set<CrmOrderStatus>([
  "accepted",
  "preparing",
  "ready_for_courier",
  "assigned_to_courier",
  "courier_on_the_way",
]);

const COMPLETED_CRM_STATUSES = new Set<CrmOrderStatus>(["delivered"]);
const CANCELLED_CRM_STATUSES = new Set<CrmOrderStatus>(["cancelled", "failed"]);

function removeOrderIdFromAllQueues(
  queueState: CrmQueueState,
  orderId: string,
): CrmQueueState {
  const nextState = createEmptyCrmQueueState();

  for (const queueName of Object.keys(nextState) as CrmQueueName[]) {
    nextState[queueName] = queueState[queueName].filter((id) => id !== orderId);
  }

  return nextState;
}

function appendUniqueOrderId(queue: string[], orderId: string): string[] {
  if (queue.includes(orderId)) {
    return queue;
  }

  return [...queue, orderId];
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function resolvePrimaryQueueForCrmOrder(
  crmOrder: CrmOrder,
): CrmQueueName {
  if (crmOrder.tags.includes("delayed")) {
    return "delayed_orders";
  }

  if (COMPLETED_CRM_STATUSES.has(crmOrder.currentStatus)) {
    return "completed_orders";
  }

  if (CANCELLED_CRM_STATUSES.has(crmOrder.currentStatus)) {
    return "cancelled_orders";
  }

  if (crmOrder.currentStatus === "created") {
    return "new_orders";
  }

  if (ACTIVE_CRM_STATUSES.has(crmOrder.currentStatus)) {
    return "active_orders";
  }

  return "new_orders";
}

export function addCrmOrderToQueue(crmOrder: CrmOrder): CrmQueueState {
  const queueState = removeOrderIdFromAllQueues(
    readCrmQueueState(),
    crmOrder.orderId,
  );

  const primaryQueue = resolvePrimaryQueueForCrmOrder(crmOrder);
  queueState[primaryQueue] = appendUniqueOrderId(
    queueState[primaryQueue],
    crmOrder.orderId,
  );

  if (crmOrder.tags.includes("high_priority")) {
    queueState.high_priority_orders = appendUniqueOrderId(
      queueState.high_priority_orders,
      crmOrder.orderId,
    );
  }

  return saveCrmQueueState(queueState);
}

export function moveCrmOrderToQueue(
  orderId: string,
  queueName: CrmQueueName,
): CrmQueueState {
  const queueState = removeOrderIdFromAllQueues(readCrmQueueState(), orderId);
  queueState[queueName] = appendUniqueOrderId(queueState[queueName], orderId);
  return saveCrmQueueState(queueState);
}

export function getCrmQueue(queueName: CrmQueueName): CrmOrder[] {
  const queueState = readCrmQueueState();
  const orders = readCrmOrders();
  const orderMap = new Map(orders.map((order) => [order.orderId, order]));

  return queueState[queueName]
    .map((orderId) => orderMap.get(orderId) ?? null)
    .filter((order): order is CrmOrder => order !== null);
}

export function getAllCrmQueues(): CrmQueueBuckets {
  return {
    new_orders: getCrmQueue("new_orders"),
    active_orders: getCrmQueue("active_orders"),
    delayed_orders: getCrmQueue("delayed_orders"),
    completed_orders: getCrmQueue("completed_orders"),
    cancelled_orders: getCrmQueue("cancelled_orders"),
    high_priority_orders: getCrmQueue("high_priority_orders"),
  };
}

export function syncCrmOrderQueues(crmOrder: CrmOrder): CrmQueueState {
  return addCrmOrderToQueue(crmOrder);
}
