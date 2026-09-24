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
  // Mirrors the real Postgres sequence used by orderNumberSequence.ts:
  // starts at 1, strictly increments, never reused.
  private nextSequenceValue = 1;

  async findByIdempotencyKey(key: string) {
    return this.records.get(key) ?? null;
  }

  async create(order: NewOrderRecord) {
    const existing = this.records.get(order.idempotencyKey);
    if (existing) {
      return { order: existing, replayed: true };
    }
    const publicNumber = `BF-${String(this.nextSequenceValue++).padStart(3, "0")}`;
    const stored: StoredOrderRecord = { ...order, publicNumber };
    this.records.set(order.idempotencyKey, stored);
    return { order: stored, replayed: false };
  }

  async findByPublicNumber(publicNumber: string) {
    const normalized = publicNumber.trim().toUpperCase();
    for (const record of this.records.values()) {
      if (record.publicNumber === normalized) {
        return record;
      }
    }
    return null;
  }

  async findRecentByPhone(phone: string, limit = 20) {
    const normalized = phone.replace(/[^0-9]/g, "");
    return [...this.records.values()]
      .filter(
        (record) => record.customerPhone.replace(/[^0-9]/g, "") === normalized,
      )
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
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
  expect(payload.order.orderNumber).toBe("BF-001");
  expect(payload.order).toMatchObject({
    status: "NEW",
    subtotal: 11800,
    deliveryCost: 790,
    total: 12590,
    currency: "RUB",
    deliveryZoneId: "base",
    deliveryTimeSurcharge: 0,
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

test("exact 16:25 is stored separately and priced server-side; duplicate request replays", async () => {
  const handler = createHandler();
  const body = {
    ...VALID_BODY,
    deliveryMode: "exact",
    deliveryInterval: null,
    deliveryExactTime: "16:25",
    deliveryTimeSurcharge: 1,
  };
  const first = await handler(request(body, "checkout-exact-1625"));
  expect(first.status).toBe(201);
  expect((await first.json()).order).toMatchObject({
    deliveryCost: 1790,
    baseDeliveryCost: 790,
    deliveryTimeSurcharge: 1000,
    deliveryMode: "exact",
    deliveryInterval: null,
    deliveryExactTime: "16:25",
    total: 13590,
  });
  const replay = await handler(request(body, "checkout-exact-1625"));
  expect(replay.status).toBe(200);
  expect((await replay.json()).replayed).toBe(true);
  const changed = await handler(request({ ...body, deliveryExactTime: "16:30" }, "checkout-exact-1625"));
  expect(changed.status).toBe(409);
});

test("legacy interval order remains valid with zero surcharge", async () => {
  const response = await createHandler()(request(VALID_BODY, "checkout-legacy-interval"));
  expect(response.status).toBe(201);
  const body = await response.json();
  expect(body.order.deliveryCost).toBe(790);
  expect(body.order.deliveryTimeSurcharge).toBe(0);
  expect(body.order.deliveryMode).toBe("interval");
  expect(body.order.deliveryInterval).toBe("12:00–15:00");
  expect(body.order.deliveryExactTime).toBeNull();
});

test("exact mode rejects a simultaneous interval and accepts a date twelve months ahead", async () => {
  const handler = createHandler();
  const contradictory = await handler(request({
    ...VALID_BODY, deliveryMode: "exact", deliveryExactTime: "16:25",
  }, "checkout-exact-invalid"));
  expect(contradictory.status).toBe(400);
  expect((await contradictory.json()).error.details.field).toBe("deliveryInterval");

  const future = await handler(request({
    ...VALID_BODY, deliveryDate: "2027-08-02",
  }, "checkout-future-12-months"));
  expect(future.status).toBe(201);

  const past = await handler(request({
    ...VALID_BODY, deliveryDate: "2026-08-01",
  }, "checkout-past-date"));
  expect(past.status).toBe(400);
  expect((await past.json()).error.details.field).toBe("deliveryDate");
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

test("public order numbers are short, sequential, and never reused", async () => {
  const handler = createHandler();
  const first = await handler(request({ ...VALID_BODY }, "checkout-seq-1"));
  const second = await handler(request({ ...VALID_BODY }, "checkout-seq-2"));
  const third = await handler(request({ ...VALID_BODY }, "checkout-seq-3"));

  const firstNumber = (await first.json()).order.orderNumber as string;
  const secondNumber = (await second.json()).order.orderNumber as string;
  const thirdNumber = (await third.json()).order.orderNumber as string;

  expect(firstNumber).toBe("BF-001");
  expect(secondNumber).toBe("BF-002");
  expect(thirdNumber).toBe("BF-003");

  // Never reused: a replay of an already-used idempotency key must return
  // the SAME stored number, not mint a new one.
  const replay = await handler(request({ ...VALID_BODY }, "checkout-seq-1"));
  expect((await replay.json()).order.orderNumber).toBe(firstNumber);
});

test("order number sequence is self-provisioned and never alters existing order data", async () => {
  const source = await readFile(
    join(process.cwd(), "lib", "orders", "orderNumberSequence.ts"),
    "utf8",
  );
  expect(source).toContain("CREATE SEQUENCE IF NOT EXISTS");
  expect(source).not.toMatch(/^\s*(?:DROP|TRUNCATE|DELETE|ALTER\s+TABLE)\s/gim);
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

test("admin order metadata migration is additive and keeps payment separate", async () => {
  const sql = await readFile(
    join(process.cwd(), "migrations", "20260905_001_add_order_payment_and_cancellation.sql"),
    "utf8",
  );
  expect(sql).toContain("payment_status");
  expect(sql).toContain("cancellation_reason");
  expect(sql).toContain("DEFAULT 'PENDING'");
  expect(sql).not.toMatch(/^\s*(?:DROP|TRUNCATE|DELETE)\s/gim);
});

test("exact-delivery migration preserves legacy rows and enforces exclusive time fields", async () => {
  const sql = await readFile(
    join(process.cwd(), "migrations", "20260924_001_add_exact_delivery_time.sql"),
    "utf8",
  );
  expect(sql).toContain("delivery_mode TEXT NOT NULL DEFAULT 'interval'");
  expect(sql).toContain("delivery_exact_time TIME");
  expect(sql).toContain("delivery_time_surcharge BIGINT NOT NULL DEFAULT 0");
  expect(sql).toContain("ALTER COLUMN delivery_interval DROP NOT NULL");
  expect(sql).toContain("delivery_interval IS NULL");
  expect(sql).toContain("ADD COLUMN IF NOT EXISTS delivery_mode TEXT,");
  expect(sql).toContain("ALTER COLUMN delivery_mode DROP DEFAULT");
  expect(sql).toContain("ALTER COLUMN delivery_mode DROP NOT NULL");
  expect(sql).toContain("SET delivery_mode = NULL");
  expect(sql).toContain("SET delivery_mode = 'interval'");
  expect(sql).toContain("delivery_mode IS NULL AND delivery_interval IS NULL");
  expect(sql).not.toMatch(/^\s*(?:DROP|TRUNCATE|DELETE)\s/gim);
});
