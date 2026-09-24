import "server-only";

import { randomUUID } from "node:crypto";
import type postgres from "postgres";
import { getOrdersSqlClient } from "@/lib/orders/postgresClient";
import { OrderError } from "@/lib/orders/errors";
import type {
  OrderDraft,
  OrderDraftConversationState,
  OrderDraftRepository,
  DraftOrderItem,
  UpdateOrderDraftInput,
} from "@/lib/orders/draftTypes";

type OrderDraftRow = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  delivery_address: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  delivery_zone_id: string | null;
  delivery_date: string | null;
  delivery_interval: string | null;
  payment_method: string | null;
  customer_comment: string | null;
  items: unknown;
  conversation_state: unknown;
  status: "active" | "abandoned" | "converted";
  converted_to_order_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  abandoned_at: Date | string | null;
};

function isoDate(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function parseStoredJson<T>(value: unknown, fallback: T): T {
  let current = value;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (typeof current !== "string") break;

    try {
      current = JSON.parse(current);
    } catch {
      return fallback;
    }
  }

  return (current ?? fallback) as T;
}

function mapDraftRow(row: OrderDraftRow): OrderDraft {
  const parsedItems = parseStoredJson<unknown>(row.items, []);
  const parsedConversationState = parseStoredJson<unknown>(
    row.conversation_state,
    { turns: [] },
  );

  return {
    id: row.id,
    customerName: row.customer_name || undefined,
    customerPhone: row.customer_phone || undefined,
    recipientName: row.recipient_name || undefined,
    recipientPhone: row.recipient_phone || undefined,
    customerComment: row.customer_comment || undefined,
    deliveryAddress: row.delivery_address || undefined,
    deliveryLatitude: row.delivery_latitude || undefined,
    deliveryLongitude: row.delivery_longitude || undefined,
    deliveryZoneId: row.delivery_zone_id || undefined,
    deliveryDate: row.delivery_date || undefined,
    deliveryInterval: row.delivery_interval || undefined,
    paymentMethod: (row.payment_method as any) || undefined,
    items: Array.isArray(parsedItems)
      ? (parsedItems as DraftOrderItem[])
      : [],
    conversationState:
      parsedConversationState &&
      typeof parsedConversationState === "object" &&
      Array.isArray(
        (parsedConversationState as OrderDraftConversationState).turns,
      )
        ? (parsedConversationState as OrderDraftConversationState)
        : { turns: [] },
    status: row.status,
    convertedToOrderId: row.converted_to_order_id || undefined,
    createdAt: isoDate(row.created_at),
    updatedAt: isoDate(row.updated_at),
    abandonedAt: row.abandoned_at ? isoDate(row.abandoned_at) : undefined,
  };
}

function storageError(error: unknown): OrderError {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "42P01"
  ) {
    return new OrderError(
      "DRAFT_STORAGE_NOT_READY",
      "Миграция хранилища черновиков ещё не применена.",
      503,
    );
  }
  return new OrderError("DRAFT_STORAGE_ERROR", "Не удалось сохранить черновик заказа.", 500);
}

export class PostgresOrderDraftRepository implements OrderDraftRepository {
  async findById(draftId: string): Promise<OrderDraft | null> {
    if (!draftId?.trim()) return null;
    try {
      const sql = getOrdersSqlClient();



      const rows = await sql<OrderDraftRow[]>`
        SELECT * FROM order_drafts WHERE id = ${draftId} LIMIT 1
      `;
      return rows[0] ? mapDraftRow(rows[0]) : null;
    } catch (error) {
      if (error instanceof OrderError) throw error;
      throw storageError(error);
    }
  }

  async findByCustomerPhone(phone: string, limit: number = 10): Promise<OrderDraft[]> {
    if (!phone?.trim()) return [];
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    try {
      const sql = getOrdersSqlClient();
      const rows = await sql<OrderDraftRow[]>`
        SELECT * FROM order_drafts
        WHERE customer_phone = ${phone}
        ORDER BY updated_at DESC
        LIMIT ${safeLimit}
      `;
      return rows.map(mapDraftRow);
    } catch (error) {
      if (error instanceof OrderError) throw error;
      throw storageError(error);
    }
  }

  async create(draft: Omit<OrderDraft, "id" | "createdAt" | "updatedAt">): Promise<OrderDraft> {
    const draftId = randomUUID();
    try {
      const sql = getOrdersSqlClient();
      const rows = await sql<OrderDraftRow[]>`
        INSERT INTO order_drafts (
          id, customer_name, customer_phone, recipient_name, recipient_phone,
          delivery_address, delivery_latitude, delivery_longitude, delivery_zone_id,
          delivery_date, delivery_interval, payment_method, customer_comment,
          items, conversation_state, status, converted_to_order_id,
          created_at, updated_at
        ) VALUES (
          ${draftId},
          ${draft.customerName || null},
          ${draft.customerPhone || null},
          ${draft.recipientName || null},
          ${draft.recipientPhone || null},
          ${draft.deliveryAddress || null},
          ${draft.deliveryLatitude || null},
          ${draft.deliveryLongitude || null},
          ${draft.deliveryZoneId || null},
          ${draft.deliveryDate || null},
          ${draft.deliveryInterval || null},
          ${draft.paymentMethod || null},
          ${draft.customerComment || null},
          ${sql.json(draft.items)},
          ${sql.json(draft.conversationState)},
          ${draft.status},
          ${draft.convertedToOrderId || null},
          NOW(),
          NOW()
        )
        RETURNING *
      `;
      const row = rows[0];
      if (!row) throw new Error("No row returned from insert");
      return mapDraftRow(row);
    } catch (error) {
      if (error instanceof OrderError) throw error;
      throw storageError(error);
    }
  }

  async update(draftId: string, updates: UpdateOrderDraftInput): Promise<OrderDraft | null> {
    if (!draftId?.trim()) return null;
    try {
      const sql = getOrdersSqlClient();

      const currentDraft = await this.findById(draftId);
      if (!currentDraft) return null;

      const nextDeliveryAddress = updates.deliveryAddress?.trim() || null;
      const nextDeliveryLatitude =
        typeof updates.deliveryLatitude === "number" &&
        Number.isFinite(updates.deliveryLatitude)
          ? updates.deliveryLatitude
          : null;
      const nextDeliveryLongitude =
        typeof updates.deliveryLongitude === "number" &&
        Number.isFinite(updates.deliveryLongitude)
          ? updates.deliveryLongitude
          : null;
      const nextDeliveryZoneId = updates.deliveryZoneId?.trim() || null;

      const addressChanged =
        nextDeliveryAddress !== null &&
        nextDeliveryAddress !== currentDraft.deliveryAddress;

      const resolvedDeliveryLatitude = addressChanged
        ? nextDeliveryLatitude
        : nextDeliveryLatitude ?? currentDraft.deliveryLatitude ?? null;

      const resolvedDeliveryLongitude = addressChanged
        ? nextDeliveryLongitude
        : nextDeliveryLongitude ?? currentDraft.deliveryLongitude ?? null;

      const resolvedDeliveryZoneId = addressChanged
        ? nextDeliveryZoneId
        : nextDeliveryZoneId ?? currentDraft.deliveryZoneId ?? null;

      const rows = await sql<OrderDraftRow[]>`
        UPDATE order_drafts
        SET
          customer_name = COALESCE(${updates.customerName || null}, customer_name),
          customer_phone = COALESCE(${updates.customerPhone || null}, customer_phone),
          recipient_name = COALESCE(${updates.recipientName || null}, recipient_name),
          recipient_phone = COALESCE(${updates.recipientPhone || null}, recipient_phone),
          delivery_address = COALESCE(${nextDeliveryAddress}, delivery_address),
          delivery_latitude = ${resolvedDeliveryLatitude},
          delivery_longitude = ${resolvedDeliveryLongitude},
          delivery_zone_id = ${resolvedDeliveryZoneId},
          delivery_date = COALESCE(${updates.deliveryDate || null}, delivery_date),
          delivery_interval = COALESCE(${updates.deliveryInterval || null}, delivery_interval),
          payment_method = COALESCE(${updates.paymentMethod || null}, payment_method),
          customer_comment = COALESCE(${updates.customerComment || null}, customer_comment),
          items = COALESCE(
            ${updates.items ? sql.json(updates.items) : null},
            items
          ),
          conversation_state = COALESCE(
            ${updates.conversationState ? sql.json(updates.conversationState) : null},
            conversation_state
          ),
          updated_at = NOW()
        WHERE id = ${draftId}
        RETURNING *
      `;
      return rows[0] ? mapDraftRow(rows[0]) : null;
    } catch (error) {
      if (error instanceof OrderError) throw error;
      throw storageError(error);
    }
  }

  async delete(draftId: string): Promise<boolean> {
    if (!draftId?.trim()) return false;
    try {
      const sql = getOrdersSqlClient();
      const rows = await sql<{ id: string }[]>`
        DELETE FROM order_drafts WHERE id = ${draftId} RETURNING id
      `;
      return rows.length > 0;
    } catch (error) {
      if (error instanceof OrderError) throw error;
      throw storageError(error);
    }
  }

  async markAsConverted(draftId: string, orderId: string): Promise<OrderDraft | null> {
    if (!draftId?.trim() || !orderId?.trim()) return null;
    try {
      const sql = getOrdersSqlClient();
      const rows = await sql<OrderDraftRow[]>`
        UPDATE order_drafts
        SET status = 'converted', converted_to_order_id = ${orderId}, updated_at = NOW()
        WHERE id = ${draftId}
        RETURNING *
      `;
      return rows[0] ? mapDraftRow(rows[0]) : null;
    } catch (error) {
      if (error instanceof OrderError) throw error;
      throw storageError(error);
    }
  }

  async markAsAbandoned(draftId: string): Promise<OrderDraft | null> {
    if (!draftId?.trim()) return null;
    try {
      const sql = getOrdersSqlClient();
      const rows = await sql<OrderDraftRow[]>`
        UPDATE order_drafts
        SET status = 'abandoned', abandoned_at = NOW(), updated_at = NOW()
        WHERE id = ${draftId}
        RETURNING *
      `;
      return rows[0] ? mapDraftRow(rows[0]) : null;
    } catch (error) {
      if (error instanceof OrderError) throw error;
      throw storageError(error);
    }
  }
}
