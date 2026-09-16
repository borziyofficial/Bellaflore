import { isAdminRequestAuthorized } from "@/lib/adminApiAuth";
import { getOrdersSqlClient } from "@/lib/orders/postgresClient";
import {
  ORDER_PAYMENT_STATUSES,
  type OrderPaymentStatus,
} from "@/lib/orders/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(status: number) {
  return { status, headers: { "Cache-Control": "no-store" } };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!isAdminRequestAuthorized(request)) {
    return Response.json({ message: "Требуется вход администратора." }, noStore(401));
  }

  const body = (await request.json().catch(() => null)) as
    | { paymentStatus?: unknown }
    | null;
  if (
    typeof body?.paymentStatus !== "string" ||
    !ORDER_PAYMENT_STATUSES.includes(body.paymentStatus as OrderPaymentStatus)
  ) {
    return Response.json(
      { error: { code: "INVALID_PAYMENT_STATUS", message: "Некорректный статус оплаты." } },
      noStore(400),
    );
  }

  const paymentStatus = body.paymentStatus as OrderPaymentStatus;
  const { id } = await context.params;
  const identifier = decodeURIComponent(id).trim();
  if (!identifier) {
    return Response.json(
      { error: { code: "ORDER_NOT_FOUND", message: "Заказ не найден." } },
      noStore(404),
    );
  }

  try {
    const sql = getOrdersSqlClient();
    const rows = await sql<{ payment_status: OrderPaymentStatus }[]>`
      UPDATE orders
      SET payment_status = ${paymentStatus}, updated_at = NOW()
      WHERE id::text = ${identifier} OR public_number = ${identifier.toUpperCase()}
      RETURNING payment_status
    `;
    const updated = rows[0];
    if (!updated) {
      return Response.json(
        { error: { code: "ORDER_NOT_FOUND", message: "Заказ не найден." } },
        noStore(404),
      );
    }

    return Response.json(
      { paymentStatus: updated.payment_status },
      noStore(200),
    );
  } catch {
    return Response.json(
      { error: { code: "PAYMENT_STATUS_UPDATE_FAILED", message: "Не удалось обновить статус оплаты." } },
      noStore(500),
    );
  }
}
