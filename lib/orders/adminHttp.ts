import { OrderError } from "@/lib/orders/errors";
import { ORDER_STATUSES, type OrderStatus, type StoredOrderRecord } from "@/lib/orders/types";

export type AdminOrderRepository = {
  listRecent(options?: {
    status?: OrderStatus;
    limit?: number;
  }): Promise<StoredOrderRecord[]>;
  findByIdOrPublicNumber(identifier: string): Promise<StoredOrderRecord | null>;
  updateStatus(identifier: string, status: OrderStatus): Promise<StoredOrderRecord | null>;
};

type AdminOrderHandlerDependencies = {
  repository: AdminOrderRepository;
  authorize: (request: Request) => boolean;
};

function adminOrder(order: StoredOrderRecord) {
  return {
    id: order.id,
    orderNumber: order.publicNumber,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
    },
    recipient: {
      name: order.recipientName,
      phone: order.recipientPhone,
    },
    delivery: {
      address: order.deliveryAddress,
      latitude: order.deliveryLatitude,
      longitude: order.deliveryLongitude,
      zoneId: order.deliveryZoneId,
      date: order.deliveryDate,
      interval: order.deliveryInterval,
    },
    paymentMethod: order.paymentMethod,
    customerComment: order.customerComment,
    subtotal: order.subtotal,
    deliveryCost: order.deliveryCost,
    total: order.total,
    currency: order.currency,
    items: order.items.map((item) => ({
      id: item.id,
      productSource: item.productSource,
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

function unauthorizedResponse(): Response {
  return Response.json({ message: "Требуется вход администратора." }, { status: 401 });
}

function parseStatus(value: string | null): OrderStatus | null {
  if (!value) {
    return null;
  }
  return ORDER_STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : null;
}

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.min(Math.max(parsed, 1), 100) : 50;
}

function errorResponse(error: unknown): Response {
  if (error instanceof OrderError) {
    return Response.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status, headers: { "Cache-Control": "no-store" } },
    );
  }
  return Response.json(
    { error: { code: "ADMIN_ORDER_ERROR", message: "Не удалось загрузить заказы." } },
    { status: 500, headers: { "Cache-Control": "no-store" } },
  );
}

export function createAdminOrdersListGetHandler({
  authorize,
  repository,
}: AdminOrderHandlerDependencies) {
  return async function GET(request: Request): Promise<Response> {
    if (!authorize(request)) {
      return unauthorizedResponse();
    }

    try {
      const url = new URL(request.url);
      const status = parseStatus(url.searchParams.get("status"));
      const orders = await repository.listRecent({
        status: status ?? undefined,
        limit: parseLimit(url.searchParams.get("limit")),
      });
      return Response.json(
        {
          orders: orders.map(adminOrder),
          count: orders.length,
          statuses: ORDER_STATUSES,
        },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function createAdminOrderDetailGetHandler({
  authorize,
  repository,
}: AdminOrderHandlerDependencies) {
  return async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    if (!authorize(request)) {
      return unauthorizedResponse();
    }

    try {
      const { id } = await context.params;
      const order = await repository.findByIdOrPublicNumber(decodeURIComponent(id));
      if (!order) {
        return Response.json(
          { error: { code: "ORDER_NOT_FOUND", message: "Заказ не найден." } },
          { status: 404, headers: { "Cache-Control": "no-store" } },
        );
      }
      return Response.json(
        { order: adminOrder(order), statuses: ORDER_STATUSES },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export function createAdminOrderStatusPatchHandler({
  authorize,
  repository,
}: AdminOrderHandlerDependencies) {
  return async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    if (!authorize(request)) {
      return unauthorizedResponse();
    }

    try {
      const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
      if (typeof body?.status !== "string") {
        return Response.json(
          { error: { code: "INVALID_STATUS", message: "Укажите статус заказа." } },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }
      const status = parseStatus(body.status);
      if (!status) {
        return Response.json(
          { error: { code: "INVALID_STATUS", message: "Некорректный статус заказа." } },
          { status: 400, headers: { "Cache-Control": "no-store" } },
        );
      }

      const { id } = await context.params;
      const order = await repository.updateStatus(decodeURIComponent(id), status);
      if (!order) {
        return Response.json(
          { error: { code: "ORDER_NOT_FOUND", message: "Заказ не найден." } },
          { status: 404, headers: { "Cache-Control": "no-store" } },
        );
      }
      return Response.json(
        { order: adminOrder(order), statuses: ORDER_STATUSES },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      return errorResponse(error);
    }
  };
}
