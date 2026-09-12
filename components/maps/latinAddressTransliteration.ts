// ==================================================
// SECTION: YANDEX MAP / ADDRESS INTELLIGENCE
// РАЗДЕЛ: Яндекс Карта / Умный поиск адресов
//
// Purpose (EN):
// Transliterates Latin/English address input into Russian so Yandex
// GeoSuggest and the geocoder (both queried with lang=ru_RU) can resolve
// queries such as "Palekhskaya street 17" instead of returning nothing.
//
// Назначение (RU):
// Транслитерация латинского ввода адреса в русский, чтобы Yandex
// GeoSuggest и геокодер (запрашиваются с lang=ru_RU) находили запросы
// вида "Palekhskaya street 17", а не возвращали пустой результат.
// ==================================================

// Whole-word replacements applied before character transliteration.
// These are address descriptors and toponyms whose literal transliteration
// would be wrong ("street" -> "стреет", "moscow" -> "москов").
const LATIN_ADDRESS_WORD_DICTIONARY: Array<[RegExp, string]> = [
  [/\bmoscow\b/gi, "Москва"],
  [/\brussia\b/gi, "Россия"],
  [/\bstreet\b/gi, "улица"],
  [/\bstr\b\.?/gi, "улица"],
  [/\bst\b\.?/gi, "улица"],
  [/\bulitsa\b/gi, "улица"],
  [/\bul\b\.?/gi, "улица"],
  [/\bavenue\b/gi, "проспект"],
  [/\bave\b\.?/gi, "проспект"],
  [/\bprospect\b/gi, "проспект"],
  [/\bprospekt\b/gi, "проспект"],
  [/\bpr-?kt\b\.?/gi, "проспект"],
  [/\blane\b/gi, "переулок"],
  [/\bpereulok\b/gi, "переулок"],
  [/\bper\b\.?/gi, "переулок"],
  [/\bhighway\b/gi, "шоссе"],
  [/\bshosse\b/gi, "шоссе"],
  [/\bembankment\b/gi, "набережная"],
  [/\bnaberezhnaya\b/gi, "набережная"],
  [/\bboulevard\b/gi, "бульвар"],
  [/\bbulvar\b/gi, "бульвар"],
  [/\bsquare\b/gi, "площадь"],
  [/\bploshchad\b/gi, "площадь"],
  [/\bhouse\b/gi, "дом"],
  [/\bbuilding\b/gi, "строение"],
  [/\bbld\b\.?/gi, "строение"],
  [/\bstroenie\b/gi, "строение"],
  [/\bkorpus\b/gi, "корпус"],
  [/\bkorp\b\.?/gi, "корпус"],
  [/\bdom\b/gi, "дом"],
];

// Ordered longest-first: multi-character digraphs must win over the
// single-character table below, otherwise "kh" becomes "кх" not "х".
const LATIN_TO_CYRILLIC_SEQUENCES: Array<[string, string]> = [
  ["shch", "щ"],
  ["sch", "щ"],
  ["shh", "щ"],
  ["zh", "ж"],
  ["kh", "х"],
  ["ts", "ц"],
  ["ch", "ч"],
  ["sh", "ш"],
  ["yo", "ё"],
  ["yu", "ю"],
  ["ya", "я"],
  ["ye", "е"],
  ["yi", "и"],
  ["yy", "ый"],
  ["ju", "ю"],
  ["ja", "я"],
  // NOTE: "ay"/"oy"/"ey"/"iy" are deliberately absent. A greedy scan would
  // consume the "a" of "Tverskaya" as "ай" and produce "Тверскайа"; a bare
  // "y" is resolved contextually in transliterateLatinWord instead.
  ["a", "а"],
  ["b", "б"],
  ["c", "к"],
  ["d", "д"],
  ["e", "е"],
  ["f", "ф"],
  ["g", "г"],
  ["h", "х"],
  ["i", "и"],
  ["j", "й"],
  ["k", "к"],
  ["l", "л"],
  ["m", "м"],
  ["n", "н"],
  ["o", "о"],
  ["p", "п"],
  ["q", "к"],
  ["r", "р"],
  ["s", "с"],
  ["t", "т"],
  ["u", "у"],
  ["v", "в"],
  ["w", "в"],
  ["x", "кс"],
  ["z", "з"],
];

const LATIN_LETTER_PATTERN = /[a-z]/i;
const CYRILLIC_VOWELS = new Set("аеёиоуыэюя");


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function hasLatinLetters(value: string): boolean {
  return LATIN_LETTER_PATTERN.test(value);
}

function transliterateLatinWord(word: string): string {
  const lowerCaseWord = word.toLowerCase();
  let cursor = 0;
  let output = "";

  while (cursor < lowerCaseWord.length) {
    let matched = false;

    for (const [latin, cyrillic] of LATIN_TO_CYRILLIC_SEQUENCES) {
      if (lowerCaseWord.startsWith(latin, cursor)) {
        output += cyrillic;
        cursor += latin.length;
        matched = true;
        break;
      }
    }

    if (matched) {
      continue;
    }

    // A bare "y" that no digraph claimed is one of three things: the glide in
    // "Tverskoy" -> "Тверской" (after a vowel), the adjectival ending in
    // "Novy" -> "Новый" (word-final after a consonant), or a plain vowel.
    if (lowerCaseWord[cursor] === "y") {
      const previousCharacter = output[output.length - 1] ?? "";
      const isWordFinal = cursor === lowerCaseWord.length - 1;

      if (CYRILLIC_VOWELS.has(previousCharacter)) {
        output += "й";
      } else if (isWordFinal && previousCharacter) {
        output += "ый";
      } else {
        output += "ы";
      }

      cursor += 1;
      continue;
    }

    output += lowerCaseWord[cursor];
    cursor += 1;
  }

  // Preserve the visual shape of the original token so the suggestion list
  // and the address field read naturally ("Палехская", not "палехская").
  const shouldCapitalize = /^[A-ZА-ЯЁ]/.test(word);
  if (!shouldCapitalize || output.length === 0) {
    return output;
  }

  return output[0].toUpperCase() + output.slice(1);
}

// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Converts a mixed/Latin address query into its Russian equivalent.
// Cyrillic-only input is returned untouched, so the call is idempotent
// and safe to run on every query.
//
// Назначение (RU):
// Преобразует латинский/смешанный адрес в русский эквивалент.
// Кириллица возвращается без изменений — вызов идемпотентен.
// ==================================================
export function transliterateLatinAddressToRussian(value: string): string {
  const trimmedValue = value.trim().replace(/\s+/g, " ");

  if (!trimmedValue || !hasLatinLetters(trimmedValue)) {
    return trimmedValue;
  }

  let normalizedValue = trimmedValue;
  for (const [pattern, replacement] of LATIN_ADDRESS_WORD_DICTIONARY) {
    normalizedValue = normalizedValue.replace(pattern, replacement);
  }

  return normalizedValue
    .split(/([^\p{L}]+)/u)
    .map((chunk) =>
      LATIN_LETTER_PATTERN.test(chunk) ? transliterateLatinWord(chunk) : chunk,
    )
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Builds the ordered list of query variants to try against Yandex.
// The Russian form is tried first because the providers are queried with
// lang=ru_RU; the raw input is kept as a second chance.
//
// Назначение (RU):
// Строит упорядоченный список вариантов запроса для Yandex: сначала
// русский вариант (провайдеры работают с lang=ru_RU), затем исходный ввод.
// ==================================================
export function buildRussianAddressQueryVariants(value: string): string[] {
  const trimmedValue = value.trim().replace(/\s+/g, " ");

  if (!trimmedValue) {
    return [];
  }

  if (!hasLatinLetters(trimmedValue)) {
    return [trimmedValue];
  }

  const transliteratedValue = transliterateLatinAddressToRussian(trimmedValue);

  if (!transliteratedValue || transliteratedValue === trimmedValue) {
    return [trimmedValue];
  }

  return [transliteratedValue, trimmedValue];
}
