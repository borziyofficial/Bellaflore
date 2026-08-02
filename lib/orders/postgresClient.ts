import "server-only";

import postgres from "postgres";
import { getDatabaseUrl } from "@/lib/catalogDb/config";
import { OrderError } from "@/lib/orders/errors";

let ordersSqlClient: ReturnType<typeof postgres> | null = null;

export function getOrdersSqlClient(): ReturnType<typeof postgres> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new OrderError(
      "ORDER_STORAGE_NOT_READY",
      "Хранилище заказов не настроено.",
      503,
    );
  }

  if (!ordersSqlClient) {
    ordersSqlClient = postgres(databaseUrl, {
      max: 5,
      connect_timeout: 10,
      idle_timeout: 20,
    });
  }
  return ordersSqlClient;
}
