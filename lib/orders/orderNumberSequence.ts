// ==================================================
// SECTION: ORDERS
// РАЗДЕЛ: Месячный последовательный публичный номер заказа
//
// Public numbers are BF-1, BF-2, ... and reset at the start of each
// Moscow calendar month. Allocation is atomic in PostgreSQL and safe under
// concurrent order creation.
// ==================================================
import type postgres from "postgres";

export const ORDER_NUMBER_COUNTER_TABLE = "orders_public_number_counters";
const ORDER_NUMBER_PREFIX = "BF-";
const MOSCOW_TIME_ZONE = "Europe/Moscow";

let counterTableReady: Promise<void> | null = null;

function moscowMonthStart(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid order creation date");
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MOSCOW_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-01`;
}

async function ensureOrderNumberCounterTable(
  sql: postgres.Sql | postgres.TransactionSql,
): Promise<void> {
  if (!counterTableReady) {
    counterTableReady = sql.unsafe(
      `CREATE TABLE IF NOT EXISTS ${ORDER_NUMBER_COUNTER_TABLE} (
        month_start date PRIMARY KEY,
        next_value bigint NOT NULL CHECK (next_value >= 1)
      )`,
    ).then(() => undefined);
  }
  await counterTableReady;
}

export function formatOrderPublicNumber(sequenceValue: number | bigint): string {
  const value = BigInt(sequenceValue);
  if (value < BigInt(1)) {
    throw new Error("Order number sequence must start at 1");
  }
  return `${ORDER_NUMBER_PREFIX}${value.toString()}`;
}

/**
 * Atomically allocates the next public number for the Moscow calendar month
 * containing the order's creation timestamp.
 *
 * The counter stores the next free value. The first allocation inserts 2 and
 * returns 1; later allocations increment the row and return the previous
 * value. PostgreSQL's unique primary key + ON CONFLICT update serializes
 * concurrent allocations for the same month.
 */
export async function nextOrderPublicNumber(
  sql: postgres.Sql | postgres.TransactionSql,
  createdAt: Date | string = new Date(),
): Promise<string> {
  await ensureOrderNumberCounterTable(sql);
  const monthStart = moscowMonthStart(createdAt);

  const rows = await sql.unsafe<{ value: string }[]>(
    `INSERT INTO ${ORDER_NUMBER_COUNTER_TABLE} (month_start, next_value)
     VALUES ('${monthStart}', 2)
     ON CONFLICT (month_start)
     DO UPDATE SET next_value = ${ORDER_NUMBER_COUNTER_TABLE}.next_value + 1
     RETURNING (next_value - 1)::text AS value`,
  );

  const raw = rows[0]?.value;
  if (!raw) {
    throw new Error("orders_public_number_counters: allocation returned no row");
  }

  return formatOrderPublicNumber(BigInt(raw));
}
