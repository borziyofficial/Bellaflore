import { expect, test } from "@playwright/test";
import { createOrdersLookupGetHandler } from "../../lib/orders/http";
import type { OrderService } from "../../lib/orders/service";

const storedOrder = {
  id: "order-1",
  publicNumber: "BF-001",
  idempotencyKey: "checkout-00000001",
  requestFingerprint: "fingerprint",
  customerName: "Анна",
  customerPhone: "+7 999 111-22-33",
  recipientName: "Мария",
  recipientPhone: "+7 999 444-55-66",
  deliveryAddress: "Москва, Красная площадь, 1",
  deliveryLatitude: 55.7539,
  deliveryLongitude: 37.6208,
  deliveryZoneId: "base",
  deliveryDate: "2026-08-03",
  deliveryInterval: "12:00–15:00",
  paymentMethod: "cardTransfer" as const,
  paymentStatus: "PENDING" as const,
  cancellationReason: null,
  customerComment: "Комментарий",
  subtotal: 5900,
  deliveryCost: 790,
  total: 6690,
  currency: "RUB" as const,
  status: "NEW" as const,
  createdAt: "2026-08-02T09:00:00.000Z",
  updatedAt: "2026-08-02T09:00:00.000Z",
  items: [
    {
      id: "item-1",
      productSource: "catalog_products" as const,
      productId: "rose-101",
      productSlug: "101-roza",
      productName: "101 роза",
      size: "M" as const,
      unitPrice: 5900,
      quantity: 1,
      lineTotal: 5900,
    },
  ],
};

function createLookupHandler() {
  const service = {
    findByOrderNumber: async (orderNumber: string, phone?: string) => {
      if (orderNumber !== "BF-001") {
        throw new Error("not found");
      }
      if (phone && phone.replace(/[^0-9]/g, "") !== "79991112233") {
        const error = new Error("not found") as Error & {
          code: string;
          status: number;
        };
        error.code = "ORDER_NOT_FOUND";
        error.status = 404;
        throw error;
      }
      return storedOrder;
    },
    findByPhone: async () => [storedOrder],
  } as unknown as OrderService;

  return createOrdersLookupGetHandler({ service });
}

test("does not disclose order details by order number alone", async () => {
  const handler = createLookupHandler();
  const response = await handler(
    new Request("https://example.test/api/orders/lookup?orderNumber=BF-001"),
  );

  expect(response.status).toBe(400);
  expect((await response.json()).error.code).toBe("ORDER_PHONE_REQUIRED");
});

test("returns order details only after phone confirmation", async () => {
  const handler = createLookupHandler();
  const response = await handler(
    new Request(
      "https://example.test/api/orders/lookup?orderNumber=BF-001&phone=%2B7%20999%20111-22-33",
    ),
  );

  expect(response.status).toBe(200);
  expect((await response.json()).order).toMatchObject({
    orderNumber: "BF-001",
    customerPhone: "+7 999 111-22-33",
    total: 6690,
  });
});
