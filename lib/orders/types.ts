export const ORDER_SIZE_CODES = ["S", "M", "L", "XL"] as const;
export type OrderSizeCode = (typeof ORDER_SIZE_CODES)[number];

export const ORDER_PAYMENT_METHODS = [
  "cardTransfer",
  "cashOnDelivery",
] as const;
export type OrderPaymentMethod = (typeof ORDER_PAYMENT_METHODS)[number];

export const ORDER_PAYMENT_STATUSES = ["PENDING", "PAID", "REFUNDED"] as const;
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export const ORDER_STATUSES = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "COURIER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderProductSource = "catalog_products" | "admin_bouquets";

export type CreateOrderItemInput = {
  productId: string;
  size: OrderSizeCode;
  quantity: number;
};

export type CreateOrderInput = {
  customerName: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryDate: string;
  deliveryInterval: string;
  paymentMethod: OrderPaymentMethod;
  customerComment: string;
  items: CreateOrderItemInput[];
};

export type OrderCatalogProduct = {
  source: OrderProductSource;
  id: string;
  slug: string;
  name: string;
  sizes: Partial<Record<OrderSizeCode, number>>;
};

export type PricedOrderItem = {
  id: string;
  productSource: OrderProductSource;
  productId: string;
  productSlug: string;
  productName: string;
  size: OrderSizeCode;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type NewOrderRecord = {
  id: string;
  /**
   * Optional on purpose: the repository assigns the real sequential public
   * number atomically at INSERT time (see orderNumberSequence.ts). A value
   * set here is only used as a last-resort fallback if the sequence can't
   * be read.
   */
  publicNumber?: string;
  idempotencyKey: string;
  requestFingerprint: string;
  customerName: string;
  customerPhone: string;
  recipientName: string;
  recipientPhone: string;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  deliveryZoneId: string;
  deliveryDate: string;
  deliveryInterval: string;
  paymentMethod: OrderPaymentMethod;
  paymentStatus: "PENDING";
  cancellationReason: null;
  customerComment: string;
  subtotal: number;
  deliveryCost: number;
  total: number;
  currency: "RUB";
  status: "NEW";
  createdAt: string;
  updatedAt: string;
  items: PricedOrderItem[];
};

export type StoredOrderRecord = Omit<
  NewOrderRecord,
  "status" | "paymentStatus" | "cancellationReason" | "publicNumber"
> & {
  /** Always present once stored — the DB column is NOT NULL. */
  publicNumber: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  cancellationReason: string | null;
};

export type CreateOrderResult = {
  order: StoredOrderRecord;
  replayed: boolean;
};

export interface OrderCatalogGateway {
  getProductsByIds(ids: string[]): Promise<Map<string, OrderCatalogProduct>>;
}

export interface OrderRepository {
  findByIdempotencyKey(key: string): Promise<StoredOrderRecord | null>;
  create(order: NewOrderRecord): Promise<CreateOrderResult>;
  findByPublicNumber(publicNumber: string): Promise<StoredOrderRecord | null>;
  findRecentByPhone(phone: string, limit?: number): Promise<StoredOrderRecord[]>;
}
