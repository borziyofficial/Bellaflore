// ==================================================
// SECTION: TELEGRAM
// РАЗДЕЛ: Telegram
//
// Purpose (EN): Client and server helpers for Telegram order/status notifications.
//
// Назначение (RU): Клиентские и серверные хелперы Telegram-уведомлений о заказах и статусах.
// ==================================================
import type { TelegramCheckoutPayloadOrder } from "@/components/telegram/telegramTypes";

type TelegramOrderApiResponse = {
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
export type SubmitCheckoutOrderToTelegramResult =
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
function getFriendlyTelegramErrorMessage(
  data: TelegramOrderApiResponse,
  httpStatus: number,
): string {
  if (data.status === "missing_credentials") {
    return "Оформление временно недоступно. Попробуйте позже.";
  }

  if (data.status === "telegram_error") {
    return "Не удалось отправить заказ. Попробуйте ещё раз.";
  }

  if (data.status === "invalid_payload") {
    return "Не удалось оформить заказ. Проверьте данные и попробуйте снова.";
  }

  if (httpStatus >= 500) {
    return "Сервис временно недоступен. Попробуйте ещё раз.";
  }

  return (
    data.message?.trim() ||
    "Не удалось отправить заказ. Проверьте соединение и попробуйте снова."
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
export async function submitCheckoutOrderToTelegram(
  order: TelegramCheckoutPayloadOrder,
): Promise<SubmitCheckoutOrderToTelegramResult> {
  try {
    const response = await fetch("/api/telegram/order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(order),
    });

    let data: TelegramOrderApiResponse = {};

    try {
      data = (await response.json()) as TelegramOrderApiResponse;
    } catch {
      data = {};
    }

    if (!response.ok || !data.success) {
      return {
        ok: false,
        message: getFriendlyTelegramErrorMessage(data, response.status),
        status: data.status,
      };
    }

    return {
      ok: true,
      message: data.message?.trim() || "Order notification sent to Telegram.",
      status: data.status?.trim() || "sent",
    };
  } catch {
    return {
      ok: false,
      message:
        "Не удалось отправить заказ. Проверьте соединение и попробуйте снова.",
    };
  }
}
