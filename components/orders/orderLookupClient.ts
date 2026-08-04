// ==================================================
// SECTION: ORDERS
// РАЗДЕЛ: Клиент поиска заказа по серверному API
//
// Purpose (EN):
// Fetches real order data from the server-side lookup API
// (/api/orders/lookup) by order number or phone, and maps the
// response into the OrderPassportData shape used by "Мой заказ".
//
// Назначение (RU):
// Получает реальные данные заказа с серверного API поиска
// (/api/orders/lookup) по номеру заказа или телефону и преобразует
// ответ в формат OrderPassportData для раздела «Мой заказ».
// ==================================================
import { getCustomerFacingOrderStatus } from "@/components/orders/orderStatus";
import type {
  OrderPassportData,
  OrderPassportItem,
} from "@/components/orders/MyOrderPassport";
import { getProductSizeRuLabel } from "@/lib/product/sizeLabels";
import type { ProductSizeId } from "@/components/product/productExperienceTypes";

const LOOKUP_TIMEOUT_MS = 12000;

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cardTransfer: "Перевод на карту / СБП",
  cashOnDelivery: "Оплата при получении",
};

export type OrderLookupApiItem = {
  productId: string;
  productSlug: string;
  name: string;
  size: ProductSizeId;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type OrderLookupApiOrder = {
  orderNumber: string;
  status: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryInterval: string;
  paymentMethod: string;
  customerComment: string;
  subtotal: number;
  deliveryCost: number;
  total: number;
  currency: "RUB";
  items: OrderLookupApiItem[];
};

export class OrderLookupError extends Error {
  readonly code: string;

  constructor(message: string, code = "LOOKUP_ERROR") {
    super(message);
    this.name = "OrderLookupError";
    this.code = code;
  }
}

const GENERIC_NOT_FOUND_MESSAGE =
  "Заказ не найден. Проверьте номер заказа или номер телефона.";
const GENERIC_ERROR_MESSAGE =
  "Не удалось получить данные заказа. Попробуйте ещё раз.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isOrderSizeId(value: unknown): value is ProductSizeId {
  return typeof value === "string" && ["S", "M", "L", "XL"].includes(value);
}

function parseLookupItem(value: unknown): OrderLookupApiItem | null {
  if (
    !isRecord(value) ||
    typeof value.productId !== "string" ||
    typeof value.productSlug !== "string" ||
    typeof value.name !== "string" ||
    !isOrderSizeId(value.size) ||
    !isFiniteNumber(value.unitPrice) ||
    !isFiniteNumber(value.quantity) ||
    !isFiniteNumber(value.lineTotal)
  ) {
    return null;
  }

  return {
    productId: value.productId,
    productSlug: value.productSlug,
    name: value.name,
    size: value.size,
    unitPrice: value.unitPrice,
    quantity: value.quantity,
    lineTotal: value.lineTotal,
  };
}

function parseLookupOrder(value: unknown): OrderLookupApiOrder | null {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return null;
  }

  const items = value.items.map(parseLookupItem).filter((item) => item !== null);
  if (items.length !== value.items.length) {
    return null;
  }

  if (
    typeof value.orderNumber !== "string" ||
    typeof value.status !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.customerName !== "string" ||
    typeof value.customerPhone !== "string" ||
    typeof value.deliveryAddress !== "string" ||
    typeof value.deliveryDate !== "string" ||
    typeof value.deliveryInterval !== "string" ||
    typeof value.paymentMethod !== "string" ||
    typeof value.customerComment !== "string" ||
    !isFiniteNumber(value.subtotal) ||
    !isFiniteNumber(value.deliveryCost) ||
    !isFiniteNumber(value.total) ||
    value.currency !== "RUB"
  ) {
    return null;
  }

  return {
    orderNumber: value.orderNumber,
    status: value.status,
    createdAt: value.createdAt,
    customerName: value.customerName,
    customerPhone: value.customerPhone,
    deliveryAddress: value.deliveryAddress,
    deliveryDate: value.deliveryDate,
    deliveryInterval: value.deliveryInterval,
    paymentMethod: value.paymentMethod,
    customerComment: value.customerComment,
    subtotal: value.subtotal,
    deliveryCost: value.deliveryCost,
    total: value.total,
    currency: value.currency,
    items,
  };
}

async function fetchLookup(
  params: URLSearchParams,
  fetcher: typeof fetch,
): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetcher(`/api/orders/lookup?${params.toString()}`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
  } catch {
    throw new OrderLookupError(
      "Не удалось связаться с сервером. Проверьте интернет и попробуйте снова.",
      "NETWORK_ERROR",
    );
  } finally {
    clearTimeout(timeoutId);
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new OrderLookupError(GENERIC_NOT_FOUND_MESSAGE, "NOT_FOUND");
    }
    if (response.status === 400) {
      throw new OrderLookupError(
        "Проверьте правильность введённых данных.",
        "INVALID_REQUEST",
      );
    }
    throw new OrderLookupError(GENERIC_ERROR_MESSAGE, "SERVER_ERROR");
  }

  return data;
}

export async function lookupOrderByNumber(
  orderNumber: string,
  phone?: string,
  fetcher: typeof fetch = fetch,
): Promise<OrderLookupApiOrder> {
  const params = new URLSearchParams({ orderNumber: orderNumber.trim() });
  if (phone?.trim()) {
    params.set("phone", phone.trim());
  }

  const data = await fetchLookup(params, fetcher);
  const order = isRecord(data) ? parseLookupOrder(data.order) : null;
  if (!order) {
    throw new OrderLookupError(GENERIC_NOT_FOUND_MESSAGE, "NOT_FOUND");
  }
  return order;
}

export async function lookupOrdersByPhone(
  phone: string,
  fetcher: typeof fetch = fetch,
): Promise<OrderLookupApiOrder[]> {
  const params = new URLSearchParams({ phone: phone.trim() });
  const data = await fetchLookup(params, fetcher);
  const rawOrders = isRecord(data) && Array.isArray(data.orders) ? data.orders : null;
  if (!rawOrders) {
    throw new OrderLookupError(GENERIC_NOT_FOUND_MESSAGE, "NOT_FOUND");
  }
  const orders = rawOrders.map(parseLookupOrder).filter((order) => order !== null);
  if (orders.length === 0) {
    throw new OrderLookupError(GENERIC_NOT_FOUND_MESSAGE, "NOT_FOUND");
  }
  return orders;
}

function formatOrderCreatedAt(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDeliveryDateRu(deliveryDate: string): string {
  const parts = deliveryDate.split("-");
  if (parts.length !== 3) {
    return deliveryDate;
  }
  const [year, month, day] = parts;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (Number.isNaN(date.getTime())) {
    return deliveryDate;
  }
  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function resolveCourierNote(statusId: string): string {
  switch (statusId) {
    case "COURIER":
      return "Курьер назначен";
    case "DELIVERED":
      return "Доставлено";
    case "CANCELLED":
      return "Заказ отменён";
    default:
      return "Курьер будет назначен после подтверждения";
  }
}

export function mapLookupOrderToPassport(
  order: OrderLookupApiOrder,
): OrderPassportData {
  const customerStatus = getCustomerFacingOrderStatus(order.status);
  const items: OrderPassportItem[] = order.items.map((item) => ({
    name: item.name,
    sizeLabel: getProductSizeRuLabel(item.size),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
  }));

  return {
    orderNumber: order.orderNumber,
    createdAtLabel: formatOrderCreatedAt(order.createdAt),
    recipientName: order.customerName,
    phone: order.customerPhone,
    address: order.deliveryAddress,
    deliveryDate: formatDeliveryDateRu(order.deliveryDate),
    deliveryTime: order.deliveryInterval,
    paymentMethod: PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod,
    bouquetName: "",
    items,
    comment: order.customerComment,
    productPriceRub: order.subtotal,
    deliveryPriceRub: order.deliveryCost,
    totalRub: order.total,
    orderStatus: customerStatus.label,
    statusColorId: customerStatus.id,
    courierStatus: resolveCourierNote(customerStatus.id),
    hasConfirmedOrder: true,
  };
}
