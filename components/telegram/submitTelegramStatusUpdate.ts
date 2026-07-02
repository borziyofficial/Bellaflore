// ==================================================
// SECTION: TELEGRAM
// РАЗДЕЛ: Telegram
//
// Purpose (EN): Client and server helpers for Telegram order/status notifications.
//
// Назначение (RU): Клиентские и серверные хелперы Telegram-уведомлений о заказах и статусах.
// ==================================================
import type { OrderStatusId } from "@/components/orders/orderStatus";

type TelegramStatusApiResponse = {
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
export type SubmitTelegramStatusUpdateInput = {
  orderId: string;
  bouquet: string;
  status: OrderStatusId;
  updatedAt: string;
  customer: string;
  phone: string;
};

export type SubmitTelegramStatusUpdateResult =
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
function getFriendlyTelegramStatusErrorMessage(
  data: TelegramStatusApiResponse,
  httpStatus: number,
): string {
  if (data.status === "missing_credentials") {
    return "Telegram credentials are missing.";
  }

  if (data.status === "telegram_error") {
    return "Telegram status update failed.";
  }

  if (data.status === "invalid_payload") {
    return "Invalid Telegram status payload.";
  }

  if (httpStatus >= 500) {
    return "Telegram service is temporarily unavailable.";
  }

  return (
    data.message?.trim() ||
    "Unable to send Telegram status update. Check your connection and try again."
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
export async function submitTelegramStatusUpdate(
  input: SubmitTelegramStatusUpdateInput,
): Promise<SubmitTelegramStatusUpdateResult> {
  try {
    const response = await fetch("/api/telegram/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    let data: TelegramStatusApiResponse = {};

    try {
      data = (await response.json()) as TelegramStatusApiResponse;
    } catch {
      data = {};
    }

    if (!response.ok || !data.success) {
      return {
        ok: false,
        message: getFriendlyTelegramStatusErrorMessage(data, response.status),
        status: data.status,
      };
    }

    return {
      ok: true,
      message: data.message?.trim() || "Status update sent to Telegram.",
      status: data.status?.trim() || "sent",
    };
  } catch {
    return {
      ok: false,
      message:
        "Unable to send Telegram status update. Check your connection and try again.",
    };
  }
}
