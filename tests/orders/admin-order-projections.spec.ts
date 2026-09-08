import { expect, test } from "@playwright/test";
import {
  type AdminOrder,
  buildDashboardOrderMetrics,
  sortAdminOrdersNewestFirst,
} from "../../lib/orders/adminClient";

function order(overrides: Partial<AdminOrder> = {}): AdminOrder {
  return {
    id: "order-id",
    orderNumber: "BF-TEST-1",
    status: "NEW",
    createdAt: "2026-09-02T08:00:00.000Z",
    updatedAt: "2026-09-02T08:00:00.000Z",
    customer: { name: "TEST Customer", phone: "+70000000000" },
    recipient: { name: "TEST Customer", phone: "+70000000000" },
    delivery: {
      address: "Москва, Красная площадь, 1",
      latitude: 55.7539,
      longitude: 37.6208,
      zoneId: "moscow",
      date: "2026-09-02",
      interval: "12:00–15:00",
    },
    paymentMethod: "cashOnDelivery",
    paymentStatus: "PENDING",
    cancellationReason: null,
    customerComment: "TEST",
    subtotal: 1990,
    deliveryCost: 790,
    total: 2780,
    currency: "RUB",
    items: [],
    ...overrides,
  };
}

test("dashboard metrics use server order records and exclude cancelled revenue", () => {
  const metrics = buildDashboardOrderMetrics(
    [
      order(),
      order({ id: "cancelled", orderNumber: "BF-TEST-2", status: "CANCELLED", total: 5000 }),
      order({
        id: "older",
        orderNumber: "BF-TEST-3",
        status: "DELIVERED",
        createdAt: "2026-09-01T08:00:00.000Z",
      }),
    ],
    new Date("2026-09-02T12:00:00.000Z"),
  );

  expect(metrics).toMatchObject({
    totalOrders: 3,
    todayOrders: 2,
    todayRevenue: 2780,
    newOrders: 1,
  });
  expect(metrics.statusCounts).toMatchObject({ NEW: 1, CANCELLED: 1, DELIVERED: 1 });
});

test("recent orders are sorted by database creation timestamp", () => {
  const older = order({ id: "older", createdAt: "2026-09-01T08:00:00.000Z" });
  const newer = order({ id: "newer", createdAt: "2026-09-02T08:00:00.000Z" });

  expect(sortAdminOrdersNewestFirst([older, newer]).map((item) => item.id)).toEqual([
    "newer",
    "older",
  ]);
});
