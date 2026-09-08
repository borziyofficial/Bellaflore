// ==================================================
// SECTION: ORDERS
// РАЗДЕЛ: Последовательный публичный номер заказа
//
// Purpose (EN): Assigns short sequential public order numbers (BF-001,
// BF-002, ...) using a native Postgres SEQUENCE, so numbering is atomic and
// safe under concurrent order creation, strictly increasing, and never
// reused (Postgres sequences never roll back on a failed/rolled-back
// transaction). The sequence is self-provisioned the first time it's used
// (CREATE SEQUENCE IF NOT EXISTS), the same non-destructive, additive
// pattern already used elsewhere in this project for admin-config tables
// (see lib/heroBannerDb.ts, lib/promoBannerDb.ts) — no manual migration
// file to run, and nothing about the existing `orders` table changes.
//
// If the sequence can't be provisioned/read for any reason, order creation
// must never fail because of it: callers fall back to the previous
// date+id-based format so checkout keeps working.
//
// Назначение (RU): Присваивает короткий последовательный публичный номер
// заказа (BF-001, BF-002, ...) через нативную последовательность (SEQUENCE)
// Postgres — это атомарно и безопасно при параллельном создании заказов,
// строго возрастает и никогда не переиспользуется (последовательности
// Postgres не откатываются при неудачной транзакции). Последовательность
// создаётся сама при первом использовании (CREATE SEQUENCE IF NOT EXISTS) —
// тот же неразрушающий, аддитивный паттерн, что уже используется в проекте
// для админ-настроек (см. lib/heroBannerDb.ts, lib/promoBannerDb.ts) —
// отдельный файл миграции не нужен, таблица `orders` не меняется.
//
// Если по какой-то причине последовательность недоступна, создание заказа
// не должно падать: вызывающий код возвращается к прежнему формату номера
// на основе даты и id.
// ==================================================
import type postgres from "postgres";

export const ORDER_NUMBER_SEQUENCE_NAME = "orders_public_number_seq";
const ORDER_NUMBER_MIN_DIGITS = 3;
const ORDER_NUMBER_PREFIX = "BF-";

let sequenceReady: Promise<void> | null = null;

/** Idempotent — safe to call before every order creation. */
async function ensureOrderNumberSequence(
  sql: postgres.Sql | postgres.TransactionSql,
): Promise<void> {
  if (!sequenceReady) {
    // ORDER_NUMBER_SEQUENCE_NAME is a fixed internal constant (not user
    // input), so it is safe to inline directly as SQL text here — DDL
    // statements like CREATE SEQUENCE cannot take the object name as a
    // bound parameter.
    sequenceReady = sql.unsafe(
      `CREATE SEQUENCE IF NOT EXISTS ${ORDER_NUMBER_SEQUENCE_NAME} START WITH 1 INCREMENT BY 1`,
    ).then(() => undefined);
  }
  await sequenceReady;
}

export function formatOrderPublicNumber(sequenceValue: number | bigint): string {
  const digits = sequenceValue.toString();
  const padded = digits.padStart(ORDER_NUMBER_MIN_DIGITS, "0");
  return `${ORDER_NUMBER_PREFIX}${padded}`;
}

/**
 * Returns the next sequential public order number (e.g. "BF-001"). Meant to
 * be called once per order, inside the same DB transaction as the order
 * INSERT. Throws on failure — callers should catch and fall back.
 */
export async function nextOrderPublicNumber(
  sql: postgres.Sql | postgres.TransactionSql,
): Promise<string> {
  await ensureOrderNumberSequence(sql);
  const rows = await sql.unsafe<{ value: string }[]>(
    `SELECT nextval('${ORDER_NUMBER_SEQUENCE_NAME}')::text AS value`,
  );
  const raw = rows[0]?.value;
  if (!raw) {
    throw new Error("orders_public_number_seq: nextval returned no row");
  }
  return formatOrderPublicNumber(BigInt(raw));
}
