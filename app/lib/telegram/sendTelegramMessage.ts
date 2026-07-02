// ==================================================
// SECTION: TELEGRAM
// РАЗДЕЛ: Telegram
//
// Purpose (EN): Server-side Telegram message delivery helpers for order notifications.
//
// Назначение (RU): Серверные хелперы Telegram для отправки сообщений.
// ==================================================
import type { TelegramCredentials } from "@/app/lib/telegram/getTelegramCredentials";

type TelegramApiResponse = {
  ok?: boolean;
  description?: string;
  result?: {
    message_id?: number;
  };
};


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type SafeTelegramSendResult = {
  ok: boolean;
  messageId: number | null;
  description: string | null;
};

export type TelegramSendOutcome =
  | {
      ok: true;
      telegram: SafeTelegramSendResult;
    }
  | {
      ok: false;
      message: string;
      telegram: SafeTelegramSendResult | null;
    };


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
function toSafeTelegramSendResult(
  response: TelegramApiResponse | null,
): SafeTelegramSendResult {
  return {
    ok: Boolean(response?.ok),
    messageId:
      typeof response?.result?.message_id === "number"
        ? response.result.message_id
        : null,
    description:
      typeof response?.description === "string" ? response.description : null,
  };
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export async function sendTelegramMessage({
  credentials,
  text,
}: {
  credentials: TelegramCredentials;
  text: string;
}): Promise<TelegramSendOutcome> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${credentials.botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: credentials.chatId,
          text,
        }),
        signal: controller.signal,
      },
    );

    let telegramResponse: TelegramApiResponse | null = null;

    try {
      telegramResponse = (await response.json()) as TelegramApiResponse;
    } catch {
      telegramResponse = null;
    }

    const telegram = toSafeTelegramSendResult(telegramResponse);

    if (!response.ok || !telegram.ok) {
      return {
        ok: false,
        message: "Telegram sendMessage returned an error.",
        telegram,
      };
    }

    return {
      ok: true,
      telegram,
    };
  } catch {
    return {
      ok: false,
      message: "Telegram sendMessage request failed.",
      telegram: null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
