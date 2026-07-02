// ==================================================
// SECTION: MESSAGES
// РАЗДЕЛ: Сообщения
//
// Purpose (EN): User-facing and log message strings for addressIntelligence.
//
// Назначение (RU): Пользовательские и служебные сообщения для addressIntelligence.
// ==================================================
import type { AddressIntelligenceStatus } from "@/components/addressIntelligence/addressIntelligenceTypes";

export function getAddressIntelligenceHelperMessage(
  status: AddressIntelligenceStatus,
): string | null {
  switch (status) {
    case "needs_more_details":
      return "Укажите улицу и дом";
    case "ambiguous":
      return "Уточните адрес";
    case "suggestions_available":
      return "Выберите подходящий вариант";
    case "selected":
      return "Адрес распознан";
    case "unsupported":
      return "Уточните адрес или выберите подсказку";
    case "typing":
      return null;
    case "idle":
    case "error":
    default:
      return null;
  }
}
