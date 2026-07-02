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
import { parseTelegramCourierAssignedRequest } from "@/app/lib/telegram/parseTelegramCourierAssignedRequest";
import { sendTelegramMessage } from "@/app/lib/telegram/sendTelegramMessage";
import { buildTelegramCourierAssignedMessage } from "@/components/telegram/buildTelegramCourierAssignedMessage";

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

  const courierAssignment = parseTelegramCourierAssignedRequest(body);

  if (!courierAssignment) {
    return Response.json(
      {
        success: false,
        message: "Invalid courier assignment payload.",
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

  const message = buildTelegramCourierAssignedMessage(courierAssignment);
  const sendResult = await sendTelegramMessage({
    credentials: credentialsResult.credentials,
    text: message,
  });

  if (!sendResult.ok) {
    console.info("[telegram] courier assigned sendMessage success:", false);

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

  console.info("[telegram] courier assigned sendMessage success:", true);

  return Response.json({
    success: true,
    message: "Courier assignment sent to Telegram.",
    status: "sent",
    telegram: sendResult.telegram,
  });
}
