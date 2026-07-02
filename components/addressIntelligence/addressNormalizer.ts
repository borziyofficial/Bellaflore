// ==================================================
// SECTION: ADDRESS INTELLIGENCE
// РАЗДЕЛ: Интеллект адресов
//
// Purpose (EN): Live address suggestions, normalization, and geocoder adapters.
//
// Назначение (RU): Подсказки адресов, нормализация и адаптеры геокодера.
// ==================================================
const ABBREVIATION_REPLACEMENTS: [RegExp, string][] = [
  [/\bулица\b/gi, "ул."],
  [/\bул\b(?=\.|\s|,)/gi, "ул."],
  [/\bпроспект\b/gi, "пр-т"],
  [/\bпр-?т\b(?=\.|\s|,)/gi, "пр-т"],
  [/\bпереулок\b/gi, "пер."],
  [/\bпер\b(?=\.|\s|,)/gi, "пер."],
  [/\bшоссе\b/gi, "ш."],
  [/\bш\b(?=\.|\s|,)/gi, "ш."],
  [/\bдом\b/gi, "д."],
  [/\bд\b(?=\.|\s|,|\d)/gi, "д."],
  [/\bкорпус\b/gi, "корп."],
  [/\bкорп\b(?=\.|\s|,)/gi, "корп."],
  [/\bстроение\b/gi, "стр."],
  [/\bстр\b(?=\.|\s|,)/gi, "стр."],
];


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN): Exported type and interface definitions.
//
// Назначение (RU): Экспортируемые типы и интерфейсы.
// ==================================================
export type NormalizedAddressInput = {
  rawInput: string;
  normalizedInput: string;
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function normalizeAddressInput(input: string): NormalizedAddressInput {
  const rawInput = input;
  let normalizedInput = input.trim().replace(/\s+/g, " ");

  for (const [pattern, replacement] of ABBREVIATION_REPLACEMENTS) {
    normalizedInput = normalizedInput.replace(pattern, replacement);
  }

  normalizedInput = normalizedInput.replace(/\s+,/g, ",").replace(/,\s+/g, ", ");

  return {
    rawInput,
    normalizedInput,
  };
}
