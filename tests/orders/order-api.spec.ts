import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { createOrdersPostHandler } from "../../lib/orders/http";
import { createOrderService } from "../../lib/orders/service";
import type {
  NewOrderRecord,
  OrderCatalogGateway,
  OrderRepository,
  StoredOrderRecord,
} from "../../lib/orders/types";

const NOW = new Date("2026-08-02T09:00:00.000Z");
const VALID_BODY = {
  customerName: "Анна",
  customerPhone: "+7 999 111-22-33",
  recipientName: "Мария",
  recipientPhone: "+7 999 444-55-66",
  deliveryAddress: "Москва, Красная площадь, 1",
  deliveryLatitude: 55.7539,
  deliveryLongitude: 37.6208,
  deliveryDate: "2026-08-03",
  deliveryInterval: "12:00–15:00",
  paymentMethod: "cardTransfer",
  customerComment: "Позвонить получателю",
  items: [{ productId: "rose-101", size: "M", quantity: 2 }],
};

class MemoryRepository implements OrderRepository {
  private readonly records = new Map<string, StoredOrderRecord>();

  async findByIdempotencyKey(key: string) {
    return this.records.get(key) ?? null;
  }

  async create(order: NewOrderRecord) {
    const existing = this.records.get(order.idempotencyKey);
    if (existing) {
      return { order: existing, replayed: true };
    }
    this.records.set(order.idempotencyKey, order);
    return { order, replayed: false };
  }
}

function createHandler(options?: { catalog?: OrderCatalogGateway }) {
  const repository = new MemoryRepository();
  const catalog: OrderCatalogGateway = options?.catalog ?? {
    async getProductsByIds() {
      return new Map([
        [
          "rose-101",
          {
            source: "catalog_products" as const,
            id: "rose-101",
            slug: "101-roza",
            name: "101 роза",
            sizes: { S: 4900, M: 5900, L: 7900, XL: 9900 },
          },
        ],
      ]);
    },
  };
  let sequence = 0;
  const service = createOrderService({
    repository,
    catalog,
    now: () => NOW,
    randomId: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
  });
  return createOrdersPostHandler({ service, now: () => NOW });
}

function request(body: unknown, key = "checkout-00000001") {
  return new Request("https://example.test/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": key },
    body: JSON.stringify(body),
  });
}

test("creates an order with server prices, delivery and snapshots", async () => {
  const response = await createHandler()(request({
    ...VALID_BODY,
    subtotal: 1,
    deliveryCost: 1,
    total: 2,
  }));
  expect(response.status).toBe(201);
  const payload = await response.json();
  expect(payload.replayed).toBe(false);
  expect(payload.order.orderNumber).toMatch(/^BF-20260802-/);
  expect(payload.order).toMatchObject({
    status: "NEW",
    subtotal: 11800,
    deliveryCost: 790,
    total: 12590,
    currency: "RUB",
    deliveryZoneId: "base",
    items: [
      {
        productId: "rose-101",
        productSlug: "101-roza",
        name: "101 роза",
        size: "M",
        unitPrice: 5900,
        quantity: 2,
        lineTotal: 11800,
      },
    ],
  });
});

test("replays the same idempotent request and rejects a changed payload", async () => {
  const handler = createHandler();
  const first = await handler(request(VALID_BODY));
  const replay = await handler(request(VALID_BODY));
  const conflict = await handler(
    request({ ...VALID_BODY, customerComment: "Другой заказ" }),
  );
  expect(first.status).toBe(201);
  expect(replay.status).toBe(200);
  expect((await replay.json()).replayed).toBe(true);
  expect(conflict.status).toBe(409);
  expect((await conflict.json()).error.code).toBe("IDEMPOTENCY_CONFLICT");
});

test("requires a valid idempotency key and validates required fields", async () => {
  const handler = createHandler();
  const noKey = new Request("https://example.test/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(VALID_BODY),
  });
  expect((await handler(noKey)).status).toBe(400);

  const invalid = await handler(request({ ...VALID_BODY, recipientPhone: "123" }));
  expect(invalid.status).toBe(400);
  expect((await invalid.json()).error.details.field).toBe("recipientPhone");
});

test("rejects unavailable products, sizes and delivery coordinates", async () => {
  const missingCatalog: OrderCatalogGateway = {
    async getProductsByIds() {
      return new Map();
    },
  };
  const missingProduct = await createHandler({ catalog: missingCatalog })(request(VALID_BODY));
  expect(missingProduct.status).toBe(404);

  const limitedCatalog: OrderCatalogGateway = {
    async getProductsByIds() {
      return new Map([
        [
          "rose-101",
          {
            source: "catalog_products" as const,
            id: "rose-101",
            slug: "101-roza",
            name: "101 роза",
            sizes: { M: 5900 },
          },
        ],
      ]);
    },
  };
  const unavailableSize = await createHandler({ catalog: limitedCatalog })(
    request({
      ...VALID_BODY,
      items: [{ productId: "rose-101", size: "XL", quantity: 1 }],
    }),
  );
  expect(unavailableSize.status).toBe(409);

  const outside = await createHandler()(request({
    ...VALID_BODY,
    deliveryLatitude: 59.9343,
    deliveryLongitude: 30.3351,
  }));
  expect(outside.status).toBe(422);
  expect((await outside.json()).error.code).toBe("DELIVERY_OUTSIDE_AREA");
});

test("migration is additive and defines order integrity constraints", async () => {
  const sql = await readFile(
    join(process.cwd(), "migrations", "20260802_001_create_orders.sql"),
    "utf8",
  );
  expect(sql).toContain("CREATE TABLE IF NOT EXISTS orders");
  expect(sql).toContain("CREATE TABLE IF NOT EXISTS order_items");
  expect(sql).toContain("idempotency_key VARCHAR(128) NOT NULL UNIQUE");
  expect(sql).toContain("REFERENCES orders(id) ON DELETE CASCADE");
  expect(sql).toContain("CHECK (total = subtotal + delivery_cost)");
  expect(sql).not.toMatch(/^\s*(?:DROP|TRUNCATE|DELETE)\s/gim);
  expect(sql).not.toMatch(/ALTER\s+TABLE\s+(?:catalog_products|admin_bouquets)/i);
});
