// ==================================================
// SECTION: ORDER INTELLIGENCE
// РАЗДЕЛ: Типы
//
// Purpose (EN): CRM order domain types for Bellaflore order intelligence.
//
// Назначение (RU): Типы заказов CRM Bellaflore.
// ==================================================
import type { CatalogProductSizeId } from "@/components/catalogEngine/catalogTypes";

export type OrderStatus =
  | "draft"
  | "new"
  | "confirmed"
  | "preparing"
  | "ready"
  | "courier_assigned"
  | "in_delivery"
  | "delivered"
  | "cancelled"
  | "failed";

export type OrderTimelineEventKind =
  | "order_created"
  | "order_confirmed"
  | "bouquet_preparing"
  | "order_ready"
  | "courier_assigned"
  | "in_delivery"
  | "delivered"
  | "cancelled"
  | "failed"
  | "status_changed"
  | "note_added";

export type OrderActorType = "system" | "admin" | "courier" | "customer";

export type OrderCustomer = {
  name: string;
  phone: string;
  email?: string | null;
};

export type OrderRecipient = {
  name?: string | null;
  phone?: string | null;
  isSameAsCustomer: boolean;
};

export type OrderDelivery = {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  zoneId?: string | null;
  zoneLabel?: string | null;
  zoneTitle?: string | null;
  deliveryPriceRub?: number | null;
  deliveryDate: string;
  deliveryInterval: string;
  comment?: string;
  cardMessage?: string;
  deliveryEta?: string | null;
  courierId?: string | null;
  courierName?: string | null;
  courierPhone?: string | null;
  assignedAt?: string | null;
};

export type OrderPaymentStatus = "pending" | "paid" | "refunded" | "failed";

export type OrderPayment = {
  method: string;
  status: OrderPaymentStatus;
  totalRub: number;
  productsRub: number;
  deliveryRub: number;
  proofFileName?: string | null;
};

export type OrderItem = {
  productId: string;
  title: string;
  sizeId?: CatalogProductSizeId;
  quantity: number;
  unitPriceRub: number;
  lineTotalRub: number;
  addOnIds?: string[];
};

export type OrderTimelineEvent = {
  id: string;
  kind: OrderTimelineEventKind;
  status: OrderStatus;
  title: string;
  message: string;
  createdAt: string;
  actorType: OrderActorType;
  actorName?: string | null;
  metadata?: Record<string, unknown>;
};

export type OrderSource = "checkout" | "admin" | "crm" | "import" | "telegram";

export type Order = {
  id: string;
  status: OrderStatus;
  customer: OrderCustomer;
  recipient: OrderRecipient;
  delivery: OrderDelivery;
  payment: OrderPayment;
  items: OrderItem[];
  timeline: OrderTimelineEvent[];
  inventoryReservationId?: string | null;
  source: OrderSource;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  notes?: string[];
};

export type OrderListFilters = {
  status?: OrderStatus | OrderStatus[];
  query?: string;
  fromDate?: string;
  toDate?: string;
  courierId?: string;
};

export type OrderAlertKind =
  | "new_order"
  | "unconfirmed_order"
  | "courier_not_assigned"
  | "delivery_delayed";

export type OrderAlert = {
  id: string;
  orderId: string;
  kind: OrderAlertKind;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  createdAt: string;
};

export type AiOrderIntelligenceHooks = {
  analyzeOrderDemand?: () => Promise<
    Array<{ productId: string; demandScore: number; reason: string }>
  >;
  detectProblemOrder?: (
    orderId: string,
  ) => Promise<{ isProblem: boolean; reasons: string[] }>;
  suggestCourier?: (
    orderId: string,
  ) => Promise<{ courierId: string; courierName: string; reason: string } | null>;
  predictDeliveryDelay?: (
    orderId: string,
  ) => Promise<{ delayMinutes: number; reason: string } | null>;
  summarizeDailyOrders?: (
    date: string,
  ) => Promise<{ summary: string; highlights: string[] }>;
};

export type OrderInventoryIntegrationPlan = {
  reserveOnCreate: boolean;
  releaseOnCancel: boolean;
  confirmOnDeliver: boolean;
};
