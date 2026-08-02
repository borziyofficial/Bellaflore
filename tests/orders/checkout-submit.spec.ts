import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CheckoutOrderPayload } from "../../components/checkout/checkoutTypes";
import {
  buildCheckoutOrderApiRequest,
  buildServerConfirmedCheckoutPayload,
  clearCheckoutOrderAttempt,
  CheckoutOrderSubmitError,
  readCheckoutOrderAttempt,
  resolveCheckoutOrderAttempt,
  submitCheckoutOrder,
  writeCheckoutOrderAttempt,
  type CheckoutServerOrder,
} from "../../components/checkout/submitCheckoutOrder";

const CHECKOUT_PAYLOAD: CheckoutOrderPayload = {
  items: [
    {
      bouquetId: "rose-101",
      title: "Клиентское название",
      sizeId: "M",
      sizeLabel: "Средний",
      priceRub: 1,
      quantity: 2,
    },
  ],
  customerName: "Анна",
  phone: "+7 999 111-22-33",
  deliveryAddress: "Москва, Красная площадь, 1",
  deliveryDate: "2026-08-03",
  deliveryInterval: "12:00–15:00",
  comment: "Позвонить получателю",
  addressLatitude: 55.7539,
  addressLongitude: 37.6208,
  deliveryZoneId: "client-zone",
  deliveryZonePriceRub: 1,
};

const SERVER_ORDER: CheckoutServerOrder = {
  id: "00000000-0000-4000-8000-000000000001",
  orderNumber: "BF-20260802-0000000000",
  status: "NEW",
  subtotal: 11800,
  deliveryCost: 790,
  total: 12590,
  currency: "RUB",
  deliveryZoneId: "base",
  createdAt: "2026-08-02T09:00:00.000Z",
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
};

test("sends the selected payment method and idempotency key to same-origin orders API", async () => {
  const calls: { input: string | URL | Request; init?: RequestInit }[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    calls.push({ input, init });
    return Response.json({ order: SERVER_ORDER, replayed: false }, { status: 201 });
  };

  const onlineRequest = buildCheckoutOrderApiRequest(CHECKOUT_PAYLOAD, "online");
  const result = await submitCheckoutOrder(
    onlineRequest,
    "checkout-test-key-0001",
    fetcher,
  );

  expect(calls).toHaveLength(1);
  expect(calls[0]?.input).toBe("/api/orders");
  expect(calls[0]?.init?.method).toBe("POST");
  expect(calls[0]?.init?.headers).toMatchObject({
    "Content-Type": "application/json",
    "Idempotency-Key": "checkout-test-key-0001",
  });
  expect(JSON.parse(String(calls[0]?.init?.body))).toMatchObject({
    paymentMethod: "cardTransfer",
    recipientName: "Анна",
    recipientPhone: "+7 999 111-22-33",
    items: [{ productId: "rose-101", size: "M", quantity: 2 }],
  });
  expect(result.order).toEqual(SERVER_ORDER);

  expect(buildCheckoutOrderApiRequest(CHECKOUT_PAYLOAD, "cash").paymentMethod).toBe(
    "cashOnDelivery",
  );
});

test("uses the server order number, products and prices for the confirmed checkout", () => {
  const confirmed = buildServerConfirmedCheckoutPayload(
    CHECKOUT_PAYLOAD,
    SERVER_ORDER,
  );

  expect(confirmed.items).toEqual([
    {
      bouquetId: "rose-101",
      title: "101 роза",
      sizeId: "M",
      sizeLabel: "Средний",
      priceRub: 5900,
      quantity: 2,
    },
  ]);
  expect(confirmed.deliveryZoneId).toBe("base");
  expect(confirmed.deliveryZonePriceRub).toBe(790);
});

test("reuses one idempotency key for retries of the same request", () => {
  const request = buildCheckoutOrderApiRequest(CHECKOUT_PAYLOAD, "online");
  let sequence = 0;
  const createKey = () => `checkout-fixed-key-${++sequence}`;
  const first = resolveCheckoutOrderAttempt(request, null, createKey);
  const retry = resolveCheckoutOrderAttempt(request, first, createKey);
  const changed = resolveCheckoutOrderAttempt(
    { ...request, customerComment: "Изменённый заказ" },
    first,
    createKey,
  );

  expect(retry).toEqual(first);
  expect(changed.idempotencyKey).not.toBe(first.idempotencyKey);
  expect(sequence).toBe(2);
});

test("keeps the current checkout attempt across a page reload", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
  const attempt = {
    idempotencyKey: "checkout-persisted-key-0001",
    requestFingerprint: "request-fingerprint",
  };

  writeCheckoutOrderAttempt(attempt, storage);
  expect(readCheckoutOrderAttempt(storage)).toEqual(attempt);
  clearCheckoutOrderAttempt(storage);
  expect(readCheckoutOrderAttempt(storage)).toBeNull();
});

for (const [status, code, message] of [
  [400, "INVALID_REQUEST", "Проверьте данные заказа"],
  [404, "PRODUCT_NOT_FOUND", "товаров больше не доступен"],
  [409, "SIZE_UNAVAILABLE", "размер товара больше недоступен"],
  [422, "DELIVERY_OUTSIDE_AREA", "Доставка по выбранному адресу недоступна"],
  [503, "ORDER_STORAGE_UNAVAILABLE", "Сервис оформления временно недоступен"],
] as const) {
  test(`shows a Russian checkout error for ${status}`, async () => {
    const fetcher: typeof fetch = async () =>
      Response.json({ error: { code, message: "internal" } }, { status });

    await expect(
      submitCheckoutOrder(
        buildCheckoutOrderApiRequest(CHECKOUT_PAYLOAD, "online"),
        "checkout-test-key-0001",
        fetcher,
      ),
    ).rejects.toThrow(message);
  });
}

test("shows a Russian network error and keeps the request retryable", async () => {
  const fetcher: typeof fetch = async () => {
    throw new TypeError("network down");
  };

  const failure = submitCheckoutOrder(
    buildCheckoutOrderApiRequest(CHECKOUT_PAYLOAD, "online"),
    "checkout-test-key-0001",
    fetcher,
  );

  await expect(failure).rejects.toBeInstanceOf(CheckoutOrderSubmitError);
  await expect(failure).rejects.toThrow(
    "Не удалось связаться с сервером. Проверьте интернет и повторите попытку.",
  );
});

test("checkout saves the server order before clearing the form and notifying Telegram", async () => {
  const source = await readFile(join(process.cwd(), "app", "page.tsx"), "utf8");
  const saveOrderAt = source.indexOf("await submitCheckoutOrder(");
  const clearCartAt = source.indexOf("setCartItems([]);", saveOrderAt);
  const notifyTelegramAt = source.indexOf(
    "await submitCheckoutOrderToTelegram(",
    saveOrderAt,
  );

  expect(saveOrderAt).toBeGreaterThan(-1);
  expect(clearCartAt).toBeGreaterThan(saveOrderAt);
  expect(notifyTelegramAt).toBeGreaterThan(clearCartAt);
  expect(source).toContain(
    "сохранён. Уведомление Telegram не отправлено.",
  );
});
