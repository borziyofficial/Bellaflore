import { OrderError } from "@/lib/orders/errors";
import type { OrderService } from "@/lib/orders/service";
import { parseCreateOrderInput, parseIdempotencyKey } from "@/lib/orders/validation";

type OrdersPostDependencies = {
  service: OrderService;
  now?: () => Date;
};

function publicOrder(order: Awaited<ReturnType<OrderService["create"]>>["order"]) {
  return {
    id: order.id,
    orderNumber: order.publicNumber,
    status: order.status,
    subtotal: order.subtotal,
    deliveryCost: order.deliveryCost,
    total: order.total,
    currency: order.currency,
    deliveryZoneId: order.deliveryZoneId,
    createdAt: order.createdAt,
    items: order.items.map((item) => ({
      productId: item.productId,
      productSlug: item.productSlug,
      name: item.productName,
      size: item.size,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  };
}

export function createOrdersPostHandler(dependencies: OrdersPostDependencies) {
  return async function POST(request: Request): Promise<Response> {
    try {
      const idempotencyKey = parseIdempotencyKey(
        request.headers.get("Idempotency-Key"),
      );
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        throw new OrderError("INVALID_JSON", "Тело запроса содержит некорректный JSON.", 400);
      }

      const input = parseCreateOrderInput(body, (dependencies.now ?? (() => new Date()))());
      const result = await dependencies.service.create(input, idempotencyKey);
      return Response.json(
        { order: publicOrder(result.order), replayed: result.replayed },
        {
          status: result.replayed ? 200 : 201,
          headers: { "Cache-Control": "no-store" },
        },
      );
    } catch (error) {
      if (error instanceof OrderError) {
        return Response.json(
          { error: { code: error.code, message: error.message, details: error.details } },
          { status: error.status, headers: { "Cache-Control": "no-store" } },
        );
      }
      return Response.json(
        { error: { code: "ORDER_STORAGE_ERROR", message: "Не удалось создать заказ." } },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  };
}
