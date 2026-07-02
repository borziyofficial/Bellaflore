// ==================================================
// SECTION: TELEGRAM
// РАЗДЕЛ: Telegram
//
// Purpose (EN): Client and server helpers for Telegram order/status notifications.
//
// Назначение (RU): Клиентские и серверные хелперы Telegram-уведомлений о заказах и статусах.
// ==================================================
import type { TelegramCourierAssignedInput } from "@/components/telegram/telegramCourierAssignedTypes";

type TelegramCourierAssignedApiResponse = {
  success?: boolean;
  message?: string;
  status?: string;
};


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type SubmitTelegramCourierAssignedResult =
  | {
      ok: true;
      message: string;
      status: string;
    }
  | {
      ok: false;
      message: string;
      status?: string;
    };


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function getFriendlyTelegramCourierAssignedErrorMessage(
  data: TelegramCourierAssignedApiResponse,
  httpStatus: number,
): string {
  if (data.status === "missing_credentials") {
    return "Telegram credentials are missing.";
  }

  if (data.status === "telegram_error") {
    return "Telegram courier assignment notification failed.";
  }

  if (data.status === "invalid_payload") {
    return "Invalid Telegram courier assignment payload.";
  }

  if (httpStatus >= 500) {
    return "Telegram service is temporarily unavailable.";
  }

  return (
    data.message?.trim() ||
    "Unable to send Telegram courier assignment notice. Check your connection and try again."
  );
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export async function submitTelegramCourierAssigned(
  input: TelegramCourierAssignedInput,
): Promise<SubmitTelegramCourierAssignedResult> {
  try {
    const response = await fetch("/api/telegram/courier-assigned", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    let data: TelegramCourierAssignedApiResponse = {};

    try {
      data = (await response.json()) as TelegramCourierAssignedApiResponse;
    } catch {
      data = {};
    }

    if (!response.ok || !data.success) {
      return {
        ok: false,
        message: getFriendlyTelegramCourierAssignedErrorMessage(
          data,
          response.status,
        ),
        status: data.status,
      };
    }

    return {
      ok: true,
      message:
        data.message?.trim() || "Courier assignment sent to Telegram.",
      status: data.status?.trim() || "sent",
    };
  } catch {
    return {
      ok: false,
      message:
        "Unable to send Telegram courier assignment notice. Check your connection and try again.",
    };
  }
}
