// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Type definitions for crmCore.
//
// Назначение (RU): Определения типов для crmCore.
// ==================================================
import type { CrmCustomer } from "@/components/crmCore/crmCustomerTypes";

export type CrmOrderPriority = "low" | "normal" | "high" | "urgent";

export type CrmOrderSource = "checkout" | "admin" | "crm" | "import" | "event_bus";

export type CrmOrderStatus =
  | "created"
  | "accepted"
  | "preparing"
  | "ready_for_courier"
  | "assigned_to_courier"
  | "courier_on_the_way"
  | "delivered"
  | "cancelled"
  | "failed";

export type CrmOrder = {
  crmOrderId: string;
  orderId: string;
  logisticsOrderId: string;
  lifecycleOrderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryAddress: string;
  deliveryZone: string | null;
  deliveryPrice: number | null;
  deliveryEta: string | null;
  orderTotal: number;
  currentStatus: CrmOrderStatus;
  previousStatus: CrmOrderStatus | null;
  assignedCourierId: string | null;
  assignedCourierName: string | null;
  assignedCourierPhone: string | null;
  createdAt: string;
  updatedAt: string;
  lastEventAt: string;
  source: CrmOrderSource;
  tags: string[];
  notes: string[];
  priority: CrmOrderPriority;
  crmStatus: CrmOrderStatus;
  currentQueue: CrmQueueName | null;
};

export type CrmQueueName =
  | "new_orders"
  | "active_orders"
  | "delayed_orders"
  | "completed_orders"
  | "cancelled_orders"
  | "high_priority_orders";

export type CrmQueueBuckets = Record<CrmQueueName, CrmOrder[]>;

export type CrmConfig = {
  enabled: boolean;
  autoCreateCrmOrder: boolean;
  autoCreateCustomer: boolean;
  mergeCustomersByPhone: boolean;
  crmQueueEnabled: boolean;
  vipThresholdAmount: number;
  highPriorityOrderAmount: number;
  blacklistEnabled: boolean;
};

export type BootstrapCrmResult = {
  crmOrder: CrmOrder;
  customer: CrmCustomer;
  created: boolean;
};
