// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Visual delivery-priority ordering for Yandex address suggestions
// (Moscow → New Moscow → Moscow Oblast → other Yandex results).
//
// Назначение (RU):
// Визуальная сортировка подсказок Yandex по приоритету доставки
// (Москва → Новая Москва → Московская область → прочие результаты).
// ==================================================
import type { AddressSuggestion } from "@/components/addressIntelligence/addressIntelligenceTypes";
import type { LiveGeocoderSuggestion } from "@/components/addressIntelligence/liveGeocoderTypes";

export type YandexAddressPriorityTier =
  | "moscow"
  | "new_moscow"
  | "moscow_oblast"
  | "other";

const NEW_MOSCOW_PATTERN =
  /новомосков|ти\s*нао|троицк|щербинка|коммунарка|сосенск|филимонков|внуковск|московский,\s*нов|новая\s+москва/i;

const MOSCOW_OBLAST_PATTERN =
  /московск(?:ая|ой)\s+обл|подмосков|мытищ|химки|одинцов|балаших|люберц|домодедов|красногорск|королёв|королев|подольск|долгопрудн|реутов|железнодорожн|видное|лобня|дубна|пушкино|раменск|сергиев|зеленоград/i;

const MOSCOW_CITY_PATTERN = /\bмосква\b/i;

export function resolveYandexAddressPriorityTier(
  text: string,
): YandexAddressPriorityTier {
  const normalized = text.toLowerCase();

  if (NEW_MOSCOW_PATTERN.test(normalized)) {
    return "new_moscow";
  }

  if (MOSCOW_OBLAST_PATTERN.test(normalized)) {
    return "moscow_oblast";
  }

  if (MOSCOW_CITY_PATTERN.test(normalized)) {
    return "moscow";
  }

  return "other";
}

function priorityTierRank(tier: YandexAddressPriorityTier): number {
  switch (tier) {
    case "moscow":
      return 0;
    case "new_moscow":
      return 1;
    case "moscow_oblast":
      return 2;
    case "other":
    default:
      return 3;
  }
}

export function prioritizeYandexLiveSuggestions<
  TSuggestion extends Pick<LiveGeocoderSuggestion, "label" | "fullAddress">,
>(suggestions: TSuggestion[]): TSuggestion[] {
  return [...suggestions].sort((first, second) => {
    const firstTier = resolveYandexAddressPriorityTier(
      `${first.label} ${first.fullAddress}`,
    );
    const secondTier = resolveYandexAddressPriorityTier(
      `${second.label} ${second.fullAddress}`,
    );
    const tierDiff =
      priorityTierRank(firstTier) - priorityTierRank(secondTier);

    if (tierDiff !== 0) {
      return tierDiff;
    }

    return first.label.localeCompare(second.label, "ru");
  });
}

export function prioritizeYandexAddressSuggestions(
  suggestions: AddressSuggestion[],
): AddressSuggestion[] {
  return prioritizeYandexLiveSuggestions(suggestions);
}

export function getYandexAddressPriorityTierLabel(
  tier: YandexAddressPriorityTier,
): string | null {
  switch (tier) {
    case "moscow":
      return "Москва";
    case "new_moscow":
      return "Новая Москва";
    case "moscow_oblast":
      return "Московская область";
    default:
      return null;
  }
}
