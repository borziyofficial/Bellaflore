// ==================================================
// SECTION: API — TELEGRAM
// РАЗДЕЛ: API — Telegram
//
// Purpose (EN): Next.js route handler for Telegram notification webhooks.
//
// Назначение (RU): Обработчик маршрута Next.js для Telegram-уведомлений.
// ==================================================
import {
  getTelegramCredentials,
  logTelegramCredentialsStatus,
} from "@/app/lib/telegram/getTelegramCredentials";
import { parseTelegramStatusRequest } from "@/app/lib/telegram/parseTelegramStatusRequest";
import { sendTelegramMessage } from "@/app/lib/telegram/sendTelegramMessage";
import { buildTelegramStatusMessage } from "@/components/telegram/buildTelegramStatusMessage";
import { getOrderStatusLabel } from "@/components/orders/orderStatus";

// ==================================================
// SECTION: HANDLER
// РАЗДЕЛ: Обработчик
//
// Purpose (EN): HTTP route handler entry point.
//
// Назначение (RU): Точка входа HTTP-обработчика маршрута.
// ==================================================

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        success: false,
        message: "Invalid JSON body.",
        status: "invalid_request",
      },
      { status: 400 },
    );
  }

  const statusUpdate = parseTelegramStatusRequest(body);

  if (!statusUpdate) {
    return Response.json(
      {
        success: false,
        message: "Invalid status update payload.",
        status: "invalid_payload",
      },
      { status: 400 },
    );
  }

  const credentialsResult = getTelegramCredentials();
  logTelegramCredentialsStatus();

  if (!credentialsResult.ok) {
    return Response.json(
      {
        success: false,
        message: credentialsResult.error.message,
        status: "missing_credentials",
        missing: credentialsResult.error.missing,
      },
      { status: 503 },
    );
  }

  const message = buildTelegramStatusMessage({
    orderId: statusUpdate.orderId,
    bouquet: statusUpdate.bouquet,
    statusLabel: getOrderStatusLabel(statusUpdate.status),
    updatedAt: statusUpdate.updatedAt,
    customer: statusUpdate.customer,
    phone: statusUpdate.phone,
  });

  const sendResult = await sendTelegramMessage({
    credentials: credentialsResult.credentials,
    text: message,
  });

  if (!sendResult.ok) {
    console.info("[telegram] status update sendMessage success:", false);

    return Response.json(
      {
        success: false,
        message: sendResult.message,
        status: "telegram_error",
        telegram: sendResult.telegram,
      },
      { status: 502 },
    );
  }

  console.info("[telegram] status update sendMessage success:", true);

  return Response.json({
    success: true,
    message: "Status update sent to Telegram.",
    status: "sent",
    telegram: sendResult.telegram,
  });
}
