import { createHash, randomUUID } from "node:crypto";
import { OrderError } from "@/lib/orders/errors";
import { calculateServerDeliveryPrice } from "@/lib/orders/deliveryPricing";
import type {
  CreateOrderInput,
  CreateOrderResult,
  NewOrderRecord,
  OrderCatalogGateway,
  OrderRepository,
} from "@/lib/orders/types";

export type OrderServiceDependencies = {
  catalog: OrderCatalogGateway;
  repository: OrderRepository;
  now?: () => Date;
  randomId?: () => string;
};

function fingerprintRequest(input: CreateOrderInput): string {
  const canonical = {
    ...input,
    items: [...input.items].sort((left, right) =>
      `${left.productId}:${left.size}`.localeCompare(`${right.productId}:${right.size}`),
    ),
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

function buildPublicNumber(now: Date, id: string): string {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = id.replaceAll("-", "").slice(0, 10).toUpperCase();
  return `BF-${date}-${suffix}`;
}

export function createOrderService(dependencies: OrderServiceDependencies) {
  return {
    async create(input: CreateOrderInput, idempotencyKey: string): Promise<CreateOrderResult> {
      const requestFingerprint = fingerprintRequest(input);
      const existing = await dependencies.repository.findByIdempotencyKey(idempotencyKey);
      if (existing) {
        if (existing.requestFingerprint !== requestFingerprint) {
          throw new OrderError(
            "IDEMPOTENCY_CONFLICT",
            "Этот Idempotency-Key уже использован для другого заказа.",
            409,
          );
        }
        return { order: existing, replayed: true };
      }

      const products = await dependencies.catalog.getProductsByIds(
        [...new Set(input.items.map((item) => item.productId))],
      );
      const randomId = dependencies.randomId ?? randomUUID;
      const items = input.items.map((item) => {
        const product = products.get(item.productId);
        if (!product) {
          throw new OrderError(
            "PRODUCT_NOT_FOUND",
            "Товар не найден или недоступен для заказа.",
            404,
            { productId: item.productId },
          );
        }
        const unitPrice = product.sizes[item.size];
        if (!unitPrice || !Number.isSafeInteger(unitPrice) || unitPrice <= 0) {
          throw new OrderError(
            "SIZE_UNAVAILABLE",
            "Выбранный размер товара недоступен.",
            409,
            { productId: item.productId, size: item.size },
          );
        }
        const lineTotal = unitPrice * item.quantity;
        if (!Number.isSafeInteger(lineTotal)) {
          throw new OrderError("INVALID_REQUEST", "Сумма позиции слишком велика.", 400);
        }
        return {
          id: randomId(),
          productSource: product.source,
          productId: product.id,
          productSlug: product.slug,
          productName: product.name,
          size: item.size,
          unitPrice,
          quantity: item.quantity,
          lineTotal,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const delivery = calculateServerDeliveryPrice(
        input.deliveryLatitude,
        input.deliveryLongitude,
      );
      const total = subtotal + delivery.cost;
      if (![subtotal, total].every(Number.isSafeInteger)) {
        throw new OrderError("INVALID_REQUEST", "Сумма заказа слишком велика.", 400);
      }

      const now = (dependencies.now ?? (() => new Date()))();
      const createdAt = now.toISOString();
      const id = randomId();
      const order: NewOrderRecord = {
        id,
        publicNumber: buildPublicNumber(now, id),
        idempotencyKey,
        requestFingerprint,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        recipientName: input.recipientName,
        recipientPhone: input.recipientPhone,
        deliveryAddress: input.deliveryAddress,
        deliveryLatitude: input.deliveryLatitude,
        deliveryLongitude: input.deliveryLongitude,
        deliveryZoneId: delivery.zoneId,
        deliveryDate: input.deliveryDate,
        deliveryInterval: input.deliveryInterval,
        paymentMethod: input.paymentMethod,
        customerComment: input.customerComment,
        subtotal,
        deliveryCost: delivery.cost,
        total,
        currency: "RUB",
        status: "NEW",
        createdAt,
        updatedAt: createdAt,
        items,
      };

      const result = await dependencies.repository.create(order);
      if (
        result.replayed &&
        result.order.requestFingerprint !== requestFingerprint
      ) {
        throw new OrderError(
          "IDEMPOTENCY_CONFLICT",
          "Этот Idempotency-Key уже использован для другого заказа.",
          409,
        );
      }
      return result;
    },
  };
}

export type OrderService = ReturnType<typeof createOrderService>;
