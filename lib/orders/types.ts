export const ORDER_SIZE_CODES = ["S", "M", "L", "XL"] as const;
export type OrderSizeCode = (typeof ORDER_SIZE_CODES)[number];

export const ORDER_PAYMENT_METHODS = [
  "cardTransfer",
  "cashOnDelivery",
] as const;
export type OrderPaymentMethod = (typeof ORDER_PAYMENT_METHODS)[number];

export type OrderStatus =
  | "NEW"
  | "CONFIRMED"
  | "PREPARING"
  | "COURIER_ASSIGNED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

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
  publicNumber: string;
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

export type StoredOrderRecord = Omit<NewOrderRecord, "status"> & {
  status: OrderStatus;
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
