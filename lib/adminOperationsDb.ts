import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getOrdersSqlClient } from "@/lib/orders/postgresClient";
import type { OrderStatus } from "@/lib/orders/types";

export type AdminPromotion = {
  id: string;
  title: string;
  description: string;
  discountType: "fixed" | "percent";
  discountValue: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminPromotionInput = Omit<
  AdminPromotion,
  "id" | "createdAt" | "updatedAt"
>;

export type AdminCustomerSummary = {
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
};

export type AdminCustomerOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
};

export type AdminNotification = {
  id: string;
  kind: "new_order" | "cancelled_order";
  title: string;
  message: string;
  orderId: string;
  orderNumber: string;
  createdAt: string;
  read: boolean;
  severity: "info" | "important";
};

type PromotionRow = {
  id: string;
  title: string;
  description: string;
  discount_type: "fixed" | "percent";
  discount_value: string | number;
  starts_at: string | Date;
  ends_at: string | Date;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

type CustomerRow = {
  name: string;
  phone: string;
  order_count: string | number;
  total_spent: string | number;
  last_order_at: string | Date;
};

type AnalyticsRow = {
  order_count: string | number;
  revenue_order_count: string | number;
  revenue: string | number;
  new_count: string | number;
  confirmed_count: string | number;
  cancelled_count: string | number;
};

type OrderSummaryRow = {
  id: string;
  public_number: string;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  total: string | number;
  created_at: string | Date;
  updated_at: string | Date;
};

let operationsSchemaReady: Promise<void> | null = null;
const DEV_DATA_DIR = join(process.cwd(), ".data");
const DEV_DATA_FILE = join(DEV_DATA_DIR, "admin-operations.json");

type DevOperationsData = {
  promotions: AdminPromotion[];
  notificationReads: string[];
};

function isDevFileStore(): boolean {
  return process.env.NODE_ENV !== "production";
}

async function readDevOperations(): Promise<DevOperationsData> {
  try {
    const parsed = JSON.parse(await readFile(DEV_DATA_FILE, "utf8")) as Partial<DevOperationsData>;
    return {
      promotions: Array.isArray(parsed.promotions) ? parsed.promotions : [],
      notificationReads: Array.isArray(parsed.notificationReads) ? parsed.notificationReads : [],
    };
  } catch {
    return { promotions: [], notificationReads: [] };
  }
}

async function writeDevOperations(data: DevOperationsData): Promise<void> {
  await mkdir(DEV_DATA_DIR, { recursive: true });
  await writeFile(DEV_DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

function iso(value: string | Date): string {
  return new Date(value).toISOString();
}

function mapPromotion(row: PromotionRow): AdminPromotion {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    startsAt: iso(row.starts_at),
    endsAt: iso(row.ends_at),
    isActive: row.is_active,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

async function ensureOperationsSchema(): Promise<void> {
  if (!operationsSchemaReady) {
    const sql = getOrdersSqlClient();
    operationsSchemaReady = Promise.all([
      sql`
        CREATE TABLE IF NOT EXISTS admin_promotions (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percent')),
          discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
          starts_at TIMESTAMPTZ NOT NULL,
          ends_at TIMESTAMPTZ NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `,
      sql`
        CREATE TABLE IF NOT EXISTS admin_notification_reads (
          notification_id TEXT PRIMARY KEY,
          read_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `,
    ]).then(() => undefined);
  }
  await operationsSchemaReady;
}

export async function listAdminPromotions(): Promise<AdminPromotion[]> {
  if (isDevFileStore()) {
    return (await readDevOperations()).promotions.sort(
      (left, right) => Date.parse(right.startsAt) - Date.parse(left.startsAt),
    );
  }
  await ensureOperationsSchema();
  const rows = await getOrdersSqlClient()<PromotionRow[]>`
    SELECT * FROM admin_promotions ORDER BY starts_at DESC, created_at DESC
  `;
  return rows.map(mapPromotion);
}

export async function createAdminPromotion(
  input: AdminPromotionInput,
): Promise<AdminPromotion> {
  if (isDevFileStore()) {
    const data = await readDevOperations();
    const now = new Date().toISOString();
    const promotion: AdminPromotion = {
      ...input,
      id: `promo-${randomUUID()}`,
      createdAt: now,
      updatedAt: now,
    };
    await writeDevOperations({ ...data, promotions: [promotion, ...data.promotions] });
    return promotion;
  }
  await ensureOperationsSchema();
  const id = `promo-${randomUUID()}`;
  const rows = await getOrdersSqlClient()<PromotionRow[]>`
    INSERT INTO admin_promotions (
      id, title, description, discount_type, discount_value,
      starts_at, ends_at, is_active
    ) VALUES (
      ${id}, ${input.title}, ${input.description}, ${input.discountType},
      ${input.discountValue}, ${input.startsAt}, ${input.endsAt}, ${input.isActive}
    )
    RETURNING *
  `;
  return mapPromotion(rows[0]);
}

export async function updateAdminPromotion(
  id: string,
  input: AdminPromotionInput,
): Promise<AdminPromotion | null> {
  if (isDevFileStore()) {
    const data = await readDevOperations();
    const existing = data.promotions.find((item) => item.id === id);
    if (!existing) return null;
    const promotion = { ...existing, ...input, updatedAt: new Date().toISOString() };
    await writeDevOperations({
      ...data,
      promotions: data.promotions.map((item) => item.id === id ? promotion : item),
    });
    return promotion;
  }
  await ensureOperationsSchema();
  const rows = await getOrdersSqlClient()<PromotionRow[]>`
    UPDATE admin_promotions SET
      title = ${input.title},
      description = ${input.description},
      discount_type = ${input.discountType},
      discount_value = ${input.discountValue},
      starts_at = ${input.startsAt},
      ends_at = ${input.endsAt},
      is_active = ${input.isActive},
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? mapPromotion(rows[0]) : null;
}

export async function deleteAdminPromotion(id: string): Promise<boolean> {
  if (isDevFileStore()) {
    const data = await readDevOperations();
    const promotions = data.promotions.filter((item) => item.id !== id);
    if (promotions.length === data.promotions.length) return false;
    await writeDevOperations({ ...data, promotions });
    return true;
  }
  await ensureOperationsSchema();
  const rows = await getOrdersSqlClient()<Array<{ id: string }>>`
    DELETE FROM admin_promotions WHERE id = ${id} RETURNING id
  `;
  return rows.length > 0;
}

export async function listAdminCustomers(
  search = "",
): Promise<AdminCustomerSummary[]> {
  const sql = getOrdersSqlClient();
  const query = search.trim().toLowerCase();
  const phoneQuery = query.replace(/\D/g, "");
  const rows = await sql<CustomerRow[]>`
    SELECT
      (array_agg(customer_name ORDER BY created_at DESC))[1] AS name,
      (array_agg(customer_phone ORDER BY created_at DESC))[1] AS phone,
      COUNT(*) AS order_count,
      COALESCE(SUM(total) FILTER (WHERE status <> 'CANCELLED'), 0) AS total_spent,
      MAX(created_at) AS last_order_at
    FROM orders
    WHERE ${query === ""} OR
      LOWER(customer_name) LIKE ${`%${query}%`} OR
      (${phoneQuery !== ""} AND regexp_replace(customer_phone, '[^0-9]', '', 'g') LIKE ${`%${phoneQuery}%`})
    GROUP BY regexp_replace(customer_phone, '[^0-9]', '', 'g')
    ORDER BY last_order_at DESC
  `;
  return rows.map((row) => ({
    name: row.name,
    phone: row.phone,
    orderCount: Number(row.order_count),
    totalSpent: Number(row.total_spent),
    lastOrderAt: iso(row.last_order_at),
  }));
}

export async function getAdminCustomerOrders(
  phone: string,
): Promise<AdminCustomerOrder[]> {
  const normalized = phone.replace(/\D/g, "");
  if (!normalized) return [];
  const rows = await getOrdersSqlClient()<OrderSummaryRow[]>`
    SELECT id, public_number, customer_name, customer_phone, status, total, created_at, updated_at
    FROM orders
    WHERE regexp_replace(customer_phone, '[^0-9]', '', 'g') = ${normalized}
    ORDER BY created_at DESC
  `;
  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.public_number,
    status: row.status,
    total: Number(row.total),
    createdAt: iso(row.created_at),
  }));
}

function moscowRangeStart(days: 1 | 7 | 30, now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const utcMidnight = Date.UTC(value("year"), value("month") - 1, value("day"));
  return new Date(utcMidnight - 3 * 60 * 60 * 1000 - (days - 1) * 86400000);
}

export async function getAdminAnalytics(days: 1 | 7 | 30) {
  const sql = getOrdersSqlClient();
  const startsAt = moscowRangeStart(days).toISOString();
  const summaryRows = await sql<AnalyticsRow[]>`
    SELECT
      COUNT(*) AS order_count,
      COUNT(*) FILTER (WHERE status <> 'CANCELLED') AS revenue_order_count,
      COALESCE(SUM(total) FILTER (WHERE status <> 'CANCELLED'), 0) AS revenue,
      COUNT(*) FILTER (WHERE status = 'NEW') AS new_count,
      COUNT(*) FILTER (WHERE status = 'CONFIRMED') AS confirmed_count,
      COUNT(*) FILTER (WHERE status = 'CANCELLED') AS cancelled_count
    FROM orders
    WHERE created_at >= ${startsAt}
  `;
  const recentRows = await sql<OrderSummaryRow[]>`
    SELECT id, public_number, customer_name, customer_phone, status, total, created_at, updated_at
    FROM orders
    WHERE created_at >= ${startsAt}
    ORDER BY created_at DESC
    LIMIT 10
  `;
  const summary = summaryRows[0];
  const orderCount = Number(summary?.order_count ?? 0);
  const revenueOrderCount = Number(summary?.revenue_order_count ?? 0);
  const revenue = Number(summary?.revenue ?? 0);
  return {
    rangeDays: days,
    orderCount,
    revenue,
    averageOrder: revenueOrderCount > 0 ? revenue / revenueOrderCount : 0,
    newCount: Number(summary?.new_count ?? 0),
    confirmedCount: Number(summary?.confirmed_count ?? 0),
    cancelledCount: Number(summary?.cancelled_count ?? 0),
    recentOrders: recentRows.map((row) => ({
      id: row.id,
      orderNumber: row.public_number,
      customerName: row.customer_name,
      status: row.status,
      total: Number(row.total),
      createdAt: iso(row.created_at),
    })),
  };
}

function notificationId(kind: "new" | "cancelled", row: OrderSummaryRow): string {
  return `order:${kind}:${row.id}:${kind === "cancelled" ? iso(row.updated_at) : iso(row.created_at)}`;
}

export async function listAdminNotifications(): Promise<AdminNotification[]> {
  if (!isDevFileStore()) await ensureOperationsSchema();
  const sql = getOrdersSqlClient();
  const orderRows = await sql<OrderSummaryRow[]>`
    SELECT id, public_number, customer_name, customer_phone, status, total, created_at, updated_at
    FROM orders
    ORDER BY GREATEST(created_at, updated_at) DESC
    LIMIT 100
  `;
  const eventRows = orderRows.flatMap((row) => [
    { kind: "new" as const, row },
    ...(row.status === "CANCELLED" ? [{ kind: "cancelled" as const, row }] : []),
  ]).sort((left, right) => {
    const leftDate = left.kind === "cancelled" ? left.row.updated_at : left.row.created_at;
    const rightDate = right.kind === "cancelled" ? right.row.updated_at : right.row.created_at;
    return Date.parse(iso(rightDate)) - Date.parse(iso(leftDate));
  });
  const ids = eventRows.map(({ kind, row }) => notificationId(kind, row));
  const readRows = isDevFileStore()
    ? (await readDevOperations()).notificationReads.map((notification_id) => ({ notification_id }))
    : ids.length
      ? await sql<Array<{ notification_id: string }>>`
        SELECT notification_id FROM admin_notification_reads
        WHERE notification_id IN ${sql(ids)}
      `
      : [];
  const readIds = new Set(readRows.map((row) => row.notification_id));
  return eventRows.map(({ kind, row }) => {
    const cancelled = kind === "cancelled";
    const id = notificationId(kind, row);
    return {
      id,
      kind: cancelled ? "cancelled_order" : "new_order",
      title: cancelled ? "Заказ отменён" : "Новый заказ",
      message: `${row.public_number} · ${row.customer_name}`,
      orderId: row.id,
      orderNumber: row.public_number,
      createdAt: cancelled ? iso(row.updated_at) : iso(row.created_at),
      read: readIds.has(id),
      severity: cancelled ? "important" : "info",
    };
  });
}

export async function markAdminNotificationRead(id: string): Promise<void> {
  if (isDevFileStore()) {
    const data = await readDevOperations();
    if (!data.notificationReads.includes(id)) {
      await writeDevOperations({ ...data, notificationReads: [...data.notificationReads, id] });
    }
    return;
  }
  await ensureOperationsSchema();
  await getOrdersSqlClient()`
    INSERT INTO admin_notification_reads (notification_id, read_at)
    VALUES (${id}, NOW())
    ON CONFLICT (notification_id) DO NOTHING
  `;
}
