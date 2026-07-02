// ==================================================
// SECTION: CRM
// РАЗДЕЛ: CRM
//
// Purpose (EN): Customer relationship management engine, storage, and queue logic.
//
// Назначение (RU): Движок CRM, хранилище и логика очередей клиентов.
// ==================================================
import { getCrmConfig } from "@/components/crmCore/crmConfig";
import type { CrmCustomer, CrmCustomerAddress } from "@/components/crmCore/crmCustomerTypes";
import {
  resolvePrimaryQueueForCrmOrder,
  syncCrmOrderQueues,
} from "@/components/crmCore/crmQueueEngine";
import {
  readCrmCustomers,
  readCrmOrders,
  saveCrmCustomer,
  saveCrmOrder,
} from "@/components/crmCore/crmStorage";
import type {
  BootstrapCrmResult,
  CrmOrder,
  CrmOrderPriority,
  CrmOrderSource,
  CrmOrderStatus,
} from "@/components/crmCore/crmTypes";
import type { LogisticsOrder } from "@/components/deliveryOrchestration/deliveryOrchestrationTypes";
import type { OrderLifecycle } from "@/components/orderLifecycle/orderLifecycleTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const HIGH_PRIORITY_TAG = "high_priority";
const VIP_TAG = "vip";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function createCustomerId(phone: string): string {
  return `CRM-C-${normalizePhone(phone) || phone.trim()}`;
}

function createCrmOrderId(orderId: string): string {
  return `CRM-O-${orderId}`;
}

function isCrmOrderStatus(value: string): value is CrmOrderStatus {
  return [
    "created",
    "accepted",
    "preparing",
    "ready_for_courier",
    "assigned_to_courier",
    "courier_on_the_way",
    "delivered",
    "cancelled",
    "failed",
  ].includes(value);
}

function resolveOrderPriority(orderTotal: number): CrmOrderPriority {
  const config = getCrmConfig();

  if (orderTotal >= config.highPriorityOrderAmount) {
    return "high";
  }

  return "normal";
}

function buildOrderTags(orderTotal: number, customer: CrmCustomer): string[] {
  const config = getCrmConfig();
  const tags: string[] = [];

  if (orderTotal >= config.highPriorityOrderAmount) {
    tags.push(HIGH_PRIORITY_TAG);
  }

  if (customer.vipStatus) {
    tags.push(VIP_TAG);
  }

  return tags;
}

function upsertCustomerAddress(
  customer: CrmCustomer,
  deliveryAddress: string,
  deliveryZone: string | null,
  orderAt: string,
): CrmCustomerAddress[] {
  const existingIndex = customer.addresses.findIndex(
    (entry) => entry.address.trim() === deliveryAddress.trim(),
  );

  if (existingIndex === -1) {
    return [
      ...customer.addresses,
      {
        address: deliveryAddress,
        deliveryZone,
        lastUsedAt: orderAt,
      },
    ];
  }

  return customer.addresses.map((entry, index) =>
    index === existingIndex
      ? {
          ...entry,
          deliveryZone: deliveryZone ?? entry.deliveryZone,
          lastUsedAt: orderAt,
        }
      : entry,
  );
}

function queueCrmOrder(crmOrder: CrmOrder): CrmOrder {
  syncCrmOrderQueues(crmOrder);

  return {
    ...crmOrder,
    currentQueue: resolvePrimaryQueueForCrmOrder(crmOrder),
    updatedAt: new Date().toISOString(),
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
export function getCrmOrders(): CrmOrder[] {
  return readCrmOrders().sort(
    (leftOrder, rightOrder) =>
      Date.parse(rightOrder.updatedAt) - Date.parse(leftOrder.updatedAt),
  );
}

export function getCrmOrderByOrderId(orderId: string): CrmOrder | null {
  return readCrmOrders().find((order) => order.orderId === orderId) ?? null;
}

export function getCrmCustomers(): CrmCustomer[] {
  return readCrmCustomers().sort(
    (leftCustomer, rightCustomer) =>
      Date.parse(rightCustomer.updatedAt) - Date.parse(leftCustomer.updatedAt),
  );
}

export function getCrmCustomerByPhone(phone: string): CrmCustomer | null {
  const normalizedPhone = normalizePhone(phone);
  const config = getCrmConfig();

  return (
    readCrmCustomers().find((customer) =>
      config.mergeCustomersByPhone
        ? normalizePhone(customer.phone) === normalizedPhone
        : customer.phone === phone,
    ) ?? null
  );
}

export function createOrUpdateCrmCustomerFromOrder(
  crmOrder: CrmOrder,
): CrmCustomer {
  const config = getCrmConfig();

  if (!config.enabled || !config.autoCreateCustomer) {
    const existingCustomer = getCrmCustomerByPhone(crmOrder.customerPhone);
    if (existingCustomer) {
      return existingCustomer;
    }

    throw new Error("CRM customer auto-create is disabled.");
  }

  const now = new Date().toISOString();
  const existingCustomer = getCrmCustomerByPhone(crmOrder.customerPhone);
  const orderAt = crmOrder.lastEventAt || crmOrder.createdAt;

  if (!existingCustomer) {
    const totalSpent = crmOrder.orderTotal;
    const vipStatus = totalSpent >= config.vipThresholdAmount;
    const customer: CrmCustomer = {
      customerId: createCustomerId(crmOrder.customerPhone),
      name: crmOrder.customerName,
      phone: crmOrder.customerPhone,
      email: crmOrder.customerEmail,
      addresses: [
        {
          address: crmOrder.deliveryAddress,
          deliveryZone: crmOrder.deliveryZone,
          lastUsedAt: orderAt,
        },
      ],
      totalOrders: 1,
      totalSpent,
      lastOrderAt: orderAt,
      firstOrderAt: orderAt,
      tags: vipStatus ? [VIP_TAG] : [],
      notes: [],
      blacklistStatus: false,
      vipStatus,
      createdAt: now,
      updatedAt: now,
    };

    saveCrmCustomer(customer);
    return customer;
  }

  const totalSpent = existingCustomer.totalSpent + crmOrder.orderTotal;
  const vipStatus = totalSpent >= config.vipThresholdAmount;
  const updatedCustomer: CrmCustomer = {
    ...existingCustomer,
    name: crmOrder.customerName.trim() || existingCustomer.name,
    email: crmOrder.customerEmail ?? existingCustomer.email,
    addresses: upsertCustomerAddress(
      existingCustomer,
      crmOrder.deliveryAddress,
      crmOrder.deliveryZone,
      orderAt,
    ),
    totalOrders: existingCustomer.totalOrders + 1,
    totalSpent,
    lastOrderAt: orderAt,
    firstOrderAt: existingCustomer.firstOrderAt ?? orderAt,
    tags: vipStatus
      ? [...new Set([...existingCustomer.tags, VIP_TAG])]
      : existingCustomer.tags,
    vipStatus,
    updatedAt: now,
  };

  saveCrmCustomer(updatedCustomer);
  return updatedCustomer;
}

export function createCrmOrderFromLogisticsOrder(
  logisticsOrder: LogisticsOrder,
  lifecycle?: OrderLifecycle | null,
  source: CrmOrderSource = "checkout",
): CrmOrder | null {
  const config = getCrmConfig();

  if (!config.enabled || !config.autoCreateCrmOrder) {
    return null;
  }

  const existingOrder = getCrmOrderByOrderId(logisticsOrder.orderId);
  if (existingOrder) {
    return existingOrder;
  }

  const now = new Date().toISOString();
  const lifecycleStatus = lifecycle?.currentStatus ?? "created";
  const currentStatus = isCrmOrderStatus(lifecycleStatus)
    ? lifecycleStatus
    : "created";

  const customer = getCrmCustomerByPhone(logisticsOrder.customerPhone);
  const priority = resolveOrderPriority(logisticsOrder.totalPriceRub);

  const draftOrder: CrmOrder = {
    crmOrderId: createCrmOrderId(logisticsOrder.orderId),
    orderId: logisticsOrder.orderId,
    logisticsOrderId: logisticsOrder.orderId,
    lifecycleOrderId: lifecycle?.lifecycleOrderId ?? logisticsOrder.orderId,
    customerId:
      customer?.customerId ?? createCustomerId(logisticsOrder.customerPhone),
    customerName: logisticsOrder.customerName,
    customerPhone: logisticsOrder.customerPhone,
    customerEmail: null,
    deliveryAddress: logisticsOrder.deliveryAddress,
    deliveryZone: logisticsOrder.deliveryZone,
    deliveryPrice: logisticsOrder.deliveryPrice,
    deliveryEta: logisticsOrder.deliveryEta,
    orderTotal: logisticsOrder.totalPriceRub,
    currentStatus,
    previousStatus: null,
    assignedCourierId: logisticsOrder.courierId,
    assignedCourierName: logisticsOrder.courierName,
    assignedCourierPhone: logisticsOrder.courierPhone,
    createdAt: now,
    updatedAt: now,
    lastEventAt: lifecycle?.updatedAt ?? now,
    source,
    tags: [],
    notes: [],
    priority,
    crmStatus: currentStatus,
    currentQueue: null,
  };

  const linkedCustomer = createOrUpdateCrmCustomerFromOrder(draftOrder);
  const crmOrder: CrmOrder = {
    ...draftOrder,
    customerId: linkedCustomer.customerId,
    tags: buildOrderTags(draftOrder.orderTotal, linkedCustomer),
  };

  saveCrmOrder(crmOrder);

  if (config.crmQueueEnabled) {
    const queuedOrder = queueCrmOrder(crmOrder);
    saveCrmOrder(queuedOrder);
    return queuedOrder;
  }

  return crmOrder;
}

export function bootstrapCrmFromLogisticsAndLifecycle(
  logisticsOrder: LogisticsOrder,
  lifecycle: OrderLifecycle,
): BootstrapCrmResult | null {
  const existingOrder = getCrmOrderByOrderId(logisticsOrder.orderId);

  if (existingOrder) {
    const customer = getCrmCustomerByPhone(existingOrder.customerPhone);

    if (!customer) {
      return null;
    }

    return {
      crmOrder: existingOrder,
      customer,
      created: false,
    };
  }

  const crmOrder = createCrmOrderFromLogisticsOrder(
    logisticsOrder,
    lifecycle,
    "checkout",
  );

  if (!crmOrder) {
    return null;
  }

  const customer = getCrmCustomerByPhone(crmOrder.customerPhone);

  if (!customer) {
    return null;
  }

  return {
    crmOrder,
    customer,
    created: true,
  };
}

export function updateCrmOrderStatus(
  orderId: string,
  status: string,
  lastEventAt?: string,
): CrmOrder | null {
  const config = getCrmConfig();

  if (!config.enabled || !isCrmOrderStatus(status)) {
    return null;
  }

  const existingOrder = getCrmOrderByOrderId(orderId);
  if (!existingOrder) {
    return null;
  }

  const eventAt = lastEventAt ?? new Date().toISOString();
  const updatedOrder: CrmOrder = {
    ...existingOrder,
    previousStatus: existingOrder.currentStatus,
    currentStatus: status,
    crmStatus: status,
    lastEventAt: eventAt,
    updatedAt: eventAt,
  };

  saveCrmOrder(updatedOrder);

  if (config.crmQueueEnabled) {
    const queuedOrder = queueCrmOrder(updatedOrder);
    saveCrmOrder(queuedOrder);
    return queuedOrder;
  }

  return updatedOrder;
}

export function addCrmOrderNote(orderId: string, note: string): CrmOrder | null {
  const trimmedNote = note.trim();
  const existingOrder = getCrmOrderByOrderId(orderId);

  if (!existingOrder || !trimmedNote) {
    return existingOrder;
  }

  const updatedOrder: CrmOrder = {
    ...existingOrder,
    notes: [...existingOrder.notes, trimmedNote],
    updatedAt: new Date().toISOString(),
  };

  saveCrmOrder(updatedOrder);
  return updatedOrder;
}

export function addCrmCustomerNote(
  customerId: string,
  note: string,
): CrmCustomer | null {
  const trimmedNote = note.trim();
  const existingCustomer = readCrmCustomers().find(
    (customer) => customer.customerId === customerId,
  );

  if (!existingCustomer || !trimmedNote) {
    return existingCustomer ?? null;
  }

  const updatedCustomer: CrmCustomer = {
    ...existingCustomer,
    notes: [...existingCustomer.notes, trimmedNote],
    updatedAt: new Date().toISOString(),
  };

  saveCrmCustomer(updatedCustomer);
  return updatedCustomer;
}

export function upsertCrmOrderFromNotificationEvent(input: {
  orderId: string;
  logisticsOrderId?: string | null;
  lifecycleOrderId?: string | null;
  status: string;
  lastEventAt: string;
  payload?: Record<string, unknown>;
}): CrmOrder | null {
  const existingOrder = getCrmOrderByOrderId(input.orderId);

  if (existingOrder) {
    return updateCrmOrderStatus(input.orderId, input.status, input.lastEventAt);
  }

  if (!getCrmConfig().autoCreateCrmOrder) {
    return null;
  }

  const draftOrder: CrmOrder = {
    crmOrderId: createCrmOrderId(input.orderId),
    orderId: input.orderId,
    logisticsOrderId: input.logisticsOrderId ?? input.orderId,
    lifecycleOrderId: input.lifecycleOrderId ?? input.orderId,
    customerId: createCustomerId(
      typeof input.payload?.customerPhone === "string"
        ? input.payload.customerPhone
        : input.orderId,
    ),
    customerName:
      typeof input.payload?.customerName === "string"
        ? input.payload.customerName
        : "Клиент",
    customerPhone:
      typeof input.payload?.customerPhone === "string"
        ? input.payload.customerPhone
        : "",
    customerEmail: null,
    deliveryAddress:
      typeof input.payload?.deliveryAddress === "string"
        ? input.payload.deliveryAddress
        : "",
    deliveryZone:
      typeof input.payload?.deliveryZone === "string"
        ? input.payload.deliveryZone
        : null,
    deliveryPrice:
      typeof input.payload?.deliveryPrice === "number"
        ? input.payload.deliveryPrice
        : null,
    deliveryEta:
      typeof input.payload?.deliveryEta === "string"
        ? input.payload.deliveryEta
        : null,
    orderTotal:
      typeof input.payload?.orderTotal === "number" ? input.payload.orderTotal : 0,
    currentStatus: isCrmOrderStatus(input.status) ? input.status : "created",
    previousStatus: null,
    assignedCourierId: null,
    assignedCourierName: null,
    assignedCourierPhone: null,
    createdAt: input.lastEventAt,
    updatedAt: input.lastEventAt,
    lastEventAt: input.lastEventAt,
    source: "event_bus",
    tags: [],
    notes: [],
    priority: resolveOrderPriority(
      typeof input.payload?.orderTotal === "number" ? input.payload.orderTotal : 0,
    ),
    crmStatus: isCrmOrderStatus(input.status) ? input.status : "created",
    currentQueue: null,
  };

  if (draftOrder.orderTotal >= getCrmConfig().highPriorityOrderAmount) {
    draftOrder.tags.push(HIGH_PRIORITY_TAG);
  }

  saveCrmOrder(draftOrder);
  createOrUpdateCrmCustomerFromOrder(draftOrder);

  if (getCrmConfig().crmQueueEnabled) {
    const savedOrder = getCrmOrderByOrderId(input.orderId);
    if (savedOrder) {
      const queuedOrder = queueCrmOrder(savedOrder);
      saveCrmOrder(queuedOrder);
      return queuedOrder;
    }
  }

  return getCrmOrderByOrderId(input.orderId);
}
