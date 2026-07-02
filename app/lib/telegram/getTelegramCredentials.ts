// ==================================================
// SECTION: TELEGRAM
// РАЗДЕЛ: Telegram
//
// Purpose (EN): Server-side Telegram credential resolution helpers for order notifications.
//
// Назначение (RU): Серверные хелперы Telegram для получения учётных данных.
// ==================================================
export type TelegramCredentials = {
  botToken: string;
  chatId: string;
};


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type TelegramCredentialsError = {
  missing: ("TELEGRAM_BOT_TOKEN" | "TELEGRAM_CHAT_ID")[];
  message: string;
};

export const TELEGRAM_CREDENTIALS_MISSING_MESSAGE =
  "Telegram credentials are missing";


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function logTelegramCredentialsStatus(): void {
  const hasBotToken = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
  const hasChatId = Boolean(process.env.TELEGRAM_CHAT_ID?.trim());

  console.info("[telegram] TELEGRAM_BOT_TOKEN configured:", hasBotToken);
  console.info("[telegram] TELEGRAM_CHAT_ID configured:", hasChatId);
}

export function getTelegramCredentials():
  | { ok: true; credentials: TelegramCredentials }
  | { ok: false; error: TelegramCredentialsError } {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim() ?? "";
  const missing: TelegramCredentialsError["missing"] = [];

  if (!botToken) {
    missing.push("TELEGRAM_BOT_TOKEN");
  }

  if (!chatId) {
    missing.push("TELEGRAM_CHAT_ID");
  }

  if (missing.length > 0) {
    return {
      ok: false,
      error: {
        missing,
        message: TELEGRAM_CREDENTIALS_MISSING_MESSAGE,
      },
    };
  }

  return {
    ok: true,
    credentials: {
      botToken,
      chatId,
    },
  };
}
