import "server-only";

import type postgres from "postgres";
import { getOrdersSqlClient } from "@/lib/orders/postgresClient";
import { OrderError } from "@/lib/orders/errors";
import type {
  CreateOrderResult,
  NewOrderRecord,
  OrderPaymentMethod,
  OrderProductSource,
  OrderRepository,
  OrderSizeCode,
  OrderStatus,
  PricedOrderItem,
  StoredOrderRecord,
} from "@/lib/orders/types";

type OrderRow = {
  id: string;
  public_number: string;
  idempotency_key: string;
  request_fingerprint: string;
  customer_name: string;
  customer_phone: string;
  recipient_name: string;
  recipient_phone: string;
  delivery_address: string;
  delivery_latitude: number;
  delivery_longitude: number;
  delivery_zone_id: string;
  delivery_date: Date | string;
  delivery_interval: string;
  payment_method: OrderPaymentMethod;
  customer_comment: string;
  subtotal: string | number;
  delivery_cost: string | number;
  total: string | number;
  currency: "RUB";
  status: OrderStatus;
  created_at: Date | string;
  updated_at: Date | string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_source: OrderProductSource;
  product_id: string;
  product_slug: string;
  product_name: string;
  size_code: OrderSizeCode;
  unit_price: string | number;
  quantity: number;
  line_total: string | number;
};

function isoDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function dateOnly(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function mapOrder(row: OrderRow, itemRows: OrderItemRow[]): StoredOrderRecord {
  const items: PricedOrderItem[] = itemRows.map((item) => ({
    id: item.id,
    productSource: item.product_source,
    productId: item.product_id,
    productSlug: item.product_slug,
    productName: item.product_name,
    size: item.size_code,
    unitPrice: Number(item.unit_price),
    quantity: item.quantity,
    lineTotal: Number(item.line_total),
  }));
  return {
    id: row.id,
    publicNumber: row.public_number,
    idempotencyKey: row.idempotency_key,
    requestFingerprint: row.request_fingerprint,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    deliveryAddress: row.delivery_address,
    deliveryLatitude: row.delivery_latitude,
    deliveryLongitude: row.delivery_longitude,
    deliveryZoneId: row.delivery_zone_id,
    deliveryDate: dateOnly(row.delivery_date),
    deliveryInterval: row.delivery_interval,
    paymentMethod: row.payment_method,
    customerComment: row.customer_comment,
    subtotal: Number(row.subtotal),
    deliveryCost: Number(row.delivery_cost),
    total: Number(row.total),
    currency: row.currency,
    status: row.status,
    createdAt: isoDate(row.created_at),
    updatedAt: isoDate(row.updated_at),
    items,
  };
}

function isMissingOrdersSchema(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "42P01",
  );
}

function storageError(error: unknown): OrderError {
  if (isMissingOrdersSchema(error)) {
    return new OrderError(
      "ORDER_STORAGE_NOT_READY",
      "Миграция хранилища заказов ещё не применена.",
      503,
    );
  }
  return new OrderError("ORDER_STORAGE_ERROR", "Не удалось сохранить заказ.", 500);
}

async function findWithSql(
  sql: postgres.Sql | postgres.TransactionSql,
  key: string,
): Promise<StoredOrderRecord | null> {
  const rows = await sql<OrderRow[]>`
    SELECT * FROM orders WHERE idempotency_key = ${key} LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    return null;
  }
  const itemRows = await sql<OrderItemRow[]>`
    SELECT * FROM order_items WHERE order_id = ${row.id} ORDER BY created_at, id
  `;
  return mapOrder(row, itemRows);
}

export class PostgresOrderRepository implements OrderRepository {
  async findByIdempotencyKey(key: string): Promise<StoredOrderRecord | null> {
    try {
      return await findWithSql(getOrdersSqlClient(), key);
    } catch (error) {
      if (error instanceof OrderError) {
        throw error;
      }
      throw storageError(error);
    }
  }

  async create(order: NewOrderRecord): Promise<CreateOrderResult> {
    const sql = getOrdersSqlClient();
    try {
      return await sql.begin(async (transaction) => {
        const inserted = await transaction<OrderRow[]>`
          INSERT INTO orders (
            id, public_number, idempotency_key, request_fingerprint,
            customer_name, customer_phone, recipient_name, recipient_phone,
            delivery_address, delivery_latitude, delivery_longitude, delivery_zone_id,
            delivery_date, delivery_interval, payment_method, customer_comment,
            subtotal, delivery_cost, total, currency, status, created_at, updated_at
          ) VALUES (
            ${order.id}, ${order.publicNumber}, ${order.idempotencyKey},
            ${order.requestFingerprint}, ${order.customerName}, ${order.customerPhone},
            ${order.recipientName}, ${order.recipientPhone}, ${order.deliveryAddress},
            ${order.deliveryLatitude}, ${order.deliveryLongitude}, ${order.deliveryZoneId},
            ${order.deliveryDate}, ${order.deliveryInterval}, ${order.paymentMethod},
            ${order.customerComment}, ${order.subtotal}, ${order.deliveryCost},
            ${order.total}, ${order.currency}, ${order.status}, ${order.createdAt},
            ${order.updatedAt}
          )
          ON CONFLICT (idempotency_key) DO NOTHING
          RETURNING *
        `;

        if (!inserted[0]) {
          const existing = await findWithSql(transaction, order.idempotencyKey);
          if (!existing) {
            throw new Error("Idempotency conflict row was not found.");
          }
          return { order: existing, replayed: true };
        }

        for (const item of order.items) {
          await transaction`
            INSERT INTO order_items (
              id, order_id, product_source, product_id, product_slug, product_name,
              size_code, unit_price, quantity, line_total, created_at
            ) VALUES (
              ${item.id}, ${order.id}, ${item.productSource}, ${item.productId},
              ${item.productSlug}, ${item.productName}, ${item.size}, ${item.unitPrice},
              ${item.quantity}, ${item.lineTotal}, ${order.createdAt}
            )
          `;
        }

        return { order: mapOrder(inserted[0], order.items.map((item) => ({
          id: item.id,
          order_id: order.id,
          product_source: item.productSource,
          product_id: item.productId,
          product_slug: item.productSlug,
          product_name: item.productName,
          size_code: item.size,
          unit_price: item.unitPrice,
          quantity: item.quantity,
          line_total: item.lineTotal,
        }))), replayed: false };
      });
    } catch (error) {
      if (error instanceof OrderError) {
        throw error;
      }
      throw storageError(error);
    }
  }
}
