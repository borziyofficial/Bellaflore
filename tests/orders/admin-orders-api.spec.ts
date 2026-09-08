import { expect, test } from "@playwright/test";
import {
  createAdminOrderDetailGetHandler,
  createAdminOrdersListGetHandler,
  createAdminOrderStatusPatchHandler,
  type AdminOrderRepository,
} from "../../lib/orders/adminHttp";
import type { OrderStatus, StoredOrderRecord } from "../../lib/orders/types";

const ORDER: StoredOrderRecord = {
  id: "00000000-0000-4000-8000-000000000101",
  publicNumber: "BF-20260829-0000000001",
  idempotencyKey: "admin-orders-test",
  requestFingerprint: "f".repeat(64),
  customerName: "Анна",
  customerPhone: "+7 999 111-22-33",
  recipientName: "Мария",
  recipientPhone: "+7 999 444-55-66",
  deliveryAddress: "Москва, Красная площадь, 1",
  deliveryLatitude: 55.7539,
  deliveryLongitude: 37.6208,
  deliveryZoneId: "base",
  deliveryDate: "2026-08-30",
  deliveryInterval: "12:00–15:00",
  paymentMethod: "cashOnDelivery",
  paymentStatus: "PENDING",
  cancellationReason: null,
  customerComment: "Позвонить за час",
  subtotal: 5900,
  deliveryCost: 790,
  total: 6690,
  currency: "RUB",
  status: "NEW",
  createdAt: "2026-08-29T09:00:00.000Z",
  updatedAt: "2026-08-29T09:00:00.000Z",
  items: [
    {
      id: "00000000-0000-4000-8000-000000000201",
      productSource: "catalog_products",
      productId: "rose-101",
      productSlug: "101-roza",
      productName: "101 роза",
      size: "M",
      unitPrice: 5900,
      quantity: 1,
      lineTotal: 5900,
    },
  ],
};

class MemoryAdminOrderRepository implements AdminOrderRepository {
  private record: StoredOrderRecord | null = { ...ORDER };

  async listRecent(options?: { status?: OrderStatus; limit?: number }) {
    if (!this.record) {
      return [];
    }
    if (options?.status && this.record.status !== options.status) {
      return [];
    }
    return [this.record].slice(0, options?.limit ?? 50);
  }

  async findByIdOrPublicNumber(identifier: string) {
    if (!this.record) {
      return null;
    }
    return identifier === this.record.id || identifier === this.record.publicNumber
      ? this.record
      : null;
  }

  async updateStatus(
    identifier: string,
    status: OrderStatus,
    options: { cancellationReason?: string | null } = {},
  ) {
    const record = await this.findByIdOrPublicNumber(identifier);
    if (!record) {
      return null;
    }
    this.record = {
      ...record,
      status,
      cancellationReason:
        status === "CANCELLED" ? (options.cancellationReason ?? null) : null,
      updatedAt: "2026-08-29T10:00:00.000Z",
    };
    return this.record;
  }
}

function request(url: string, init?: RequestInit) {
  return new Request(url, init);
}

function context(id = ORDER.id) {
  return { params: Promise.resolve({ id }) };
}

test("admin orders list is protected and returns production order details", async () => {
  const repository = new MemoryAdminOrderRepository();
  const authorized = createAdminOrdersListGetHandler({
    repository,
    authorize: () => true,
  });
  const unauthorized = createAdminOrdersListGetHandler({
    repository,
    authorize: () => false,
  });

  expect((await unauthorized(request("https://example.test/api/admin/orders"))).status).toBe(401);

  const response = await authorized(request("https://example.test/api/admin/orders?limit=20"));
  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(payload.orders).toHaveLength(1);
  expect(payload.orders[0]).toMatchObject({
    id: ORDER.id,
    orderNumber: ORDER.publicNumber,
    status: "NEW",
    paymentStatus: "PENDING",
    customer: { name: "Анна", phone: "+7 999 111-22-33" },
    delivery: {
      address: "Москва, Красная площадь, 1",
      date: "2026-08-30",
      interval: "12:00–15:00",
    },
    total: 6690,
    items: [{ productId: "rose-101", size: "M", quantity: 1 }],
  });
});

test("admin order detail and status update are protected and persisted", async () => {
  const repository = new MemoryAdminOrderRepository();
  const detail = createAdminOrderDetailGetHandler({
    repository,
    authorize: () => true,
  });
  const patch = createAdminOrderStatusPatchHandler({
    repository,
    authorize: () => true,
  });

  const detailResponse = await detail(
    request(`https://example.test/api/admin/orders/${ORDER.publicNumber}`),
    context(ORDER.publicNumber),
  );
  expect(detailResponse.status).toBe(200);
  expect((await detailResponse.json()).order.orderNumber).toBe(ORDER.publicNumber);

  const patchResponse = await patch(
    request(`https://example.test/api/admin/orders/${ORDER.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED" }),
    }),
    context(),
  );
  expect(patchResponse.status).toBe(200);
  expect((await patchResponse.json()).order.status).toBe("CONFIRMED");

  const updated = await detail(
    request(`https://example.test/api/admin/orders/${ORDER.id}`),
    context(),
  );
  const updatedBody = await updated.json();
  expect(updatedBody.order.status).toBe("CONFIRMED");
  expect(updatedBody.order.paymentStatus).toBe("PENDING");
});

test("admin cancellation requires and persists a reason without changing payment", async () => {
  const repository = new MemoryAdminOrderRepository();
  const patch = createAdminOrderStatusPatchHandler({ repository, authorize: () => true });

  const missingReason = await patch(
    request(`https://example.test/api/admin/orders/${ORDER.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    }),
    context(),
  );
  expect(missingReason.status).toBe(400);

  const cancelled = await patch(
    request(`https://example.test/api/admin/orders/${ORDER.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED", cancellationReason: "TEST отмена" }),
    }),
    context(),
  );
  expect(cancelled.status).toBe(200);
  await expect(cancelled.json()).resolves.toMatchObject({
    order: {
      status: "CANCELLED",
      paymentStatus: "PENDING",
      cancellationReason: "TEST отмена",
    },
  });
});

test("admin order status update rejects invalid status", async () => {
  const patch = createAdminOrderStatusPatchHandler({
    repository: new MemoryAdminOrderRepository(),
    authorize: () => true,
  });

  const response = await patch(
    request(`https://example.test/api/admin/orders/${ORDER.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    }),
    context(),
  );
  expect(response.status).toBe(400);
  expect((await response.json()).error.code).toBe("INVALID_STATUS");
});
