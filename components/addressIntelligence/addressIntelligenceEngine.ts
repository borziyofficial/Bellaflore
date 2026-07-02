// ==================================================
// SECTION: ADDRESS INTELLIGENCE
// РАЗДЕЛ: Интеллект адресов
//
// Purpose (EN): Live address suggestions, normalization, and geocoder adapters.
//
// Назначение (RU): Подсказки адресов, нормализация и адаптеры геокодера.
// ==================================================
import { normalizeAddressInput } from "@/components/addressIntelligence/addressNormalizer";
import {
  getCachedAddressSuggestions,
  saveCachedAddressSuggestions,
} from "@/components/addressIntelligence/addressSuggestionCache";
import type {
  AddressIntelligenceResult,
  AddressIntelligenceStatus,
  AddressSuggestion,
} from "@/components/addressIntelligence/addressIntelligenceTypes";
import { readGeocodingCacheEntry } from "@/components/maps/geocodingCache";
import { normalizeGeocodingAddress } from "@/components/maps/geocodingNormalize";

type LocalStreetDefinition = {
  token: string;
  street: string;
  latitude: number;
  longitude: number;
};

type AmbiguousStreetDefinition = {
  token: string;
  street: string;
  variants: {
    id: string;
    district: string;
    latitude: number;
    longitude: number;
  }[];
};


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN): Private helper functions used within this module.
//
// Назначение (RU): Приватные вспомогательные функции модуля.
// ==================================================
const MOSCOW_CITY = "Москва";

const LOCAL_MOSCOW_STREETS: LocalStreetDefinition[] = [
  {
    token: "тверская",
    street: "ул. Тверская",
    latitude: 55.7576,
    longitude: 37.6135,
  },
  {
    token: "арбат",
    street: "ул. Арбат",
    latitude: 55.752,
    longitude: 37.5914,
  },
  {
    token: "пятницкая",
    street: "ул. Пятницкая",
    latitude: 55.7416,
    longitude: 37.6273,
  },
];

const AMBIGUOUS_STREETS: AmbiguousStreetDefinition[] = [
  {
    token: "ленина",
    street: "ул. Ленина",
    variants: [
      {
        id: "lenina-maryino",
        district: "Марьино",
        latitude: 55.6498,
        longitude: 37.7439,
      },
      {
        id: "lenina-sokol",
        district: "Сокол",
        latitude: 55.8054,
        longitude: 37.5152,
      },
      {
        id: "lenina-khimki",
        district: "Химки, Московская обл.",
        latitude: 55.897,
        longitude: 37.4297,
      },
    ],
  },
];

const UNSUPPORTED_LOCATION_PATTERNS: RegExp[] = [
  /сергиев\s+посад/i,
  /санкт[-\s]?петербург/i,
  /спб\b/i,
  /казань/i,
  /екатеринбург/i,
  /новосибирск/i,
];

const FULL_ADDRESS_PATTERN =
  /^москва,\s*(.+?),\s*д\.\s*(\d+[a-zA-Zа-яА-ЯёЁ]?)(?:\s*\((.+?)\))?$/i;

function createSuggestionId(prefix: string, parts: string[]): string {
  return `${prefix}-${parts.join("-").toLowerCase().replace(/\s+/g, "-")}`;
}

function extractHouseNumber(input: string): string | null {
  const normalized = input.replace(/mockDistanceKm\s*[:=]\s*[\d.,]+/gi, "").trim();

  const labeledMatch = normalized.match(
    /(?:^|[,\s])(?:д\.?|дом)\s*(\d+[a-zA-Zа-яА-ЯёЁ]?)(?:\s*[-/]\s*\d+)?(?:[,\s]|$)/i,
  );
  if (labeledMatch?.[1]) {
    return labeledMatch[1];
  }

  const trailingMatch = normalized.match(
    /(?:^|[,\s])(\d+[a-zA-Zа-яА-ЯёЁ]?)(?:\s*[-/]\s*\d+)?(?:[,\s]|$)/,
  );
  return trailingMatch?.[1] ?? null;
}

function stripHouseNumber(input: string): string {
  return input
    .replace(/(?:^|[,\s])(?:д\.?|дом)\s*\d+[a-zA-Zа-яА-ЯёЁ]?(?:\s*[-/]\s*\d+)?/gi, " ")
    .replace(/(?:^|[,\s])\d+[a-zA-Zа-яА-ЯёЁ]?(?:\s*[-/]\s*\d+)?(?=[,\s]|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findLocalStreet(input: string): LocalStreetDefinition | null {
  const lowered = input.toLowerCase();

  return (
    LOCAL_MOSCOW_STREETS.find((street) => lowered.includes(street.token)) ??
    null
  );
}

function findAmbiguousStreet(input: string): AmbiguousStreetDefinition | null {
  const lowered = stripHouseNumber(input).toLowerCase();

  return (
    AMBIGUOUS_STREETS.find((street) => lowered.includes(street.token)) ?? null
  );
}

function isUnsupportedLocation(input: string): boolean {
  return UNSUPPORTED_LOCATION_PATTERNS.some((pattern) => pattern.test(input));
}

function buildLocalSuggestion(
  street: string,
  house: string,
  latitude: number,
  longitude: number,
  id: string,
  district?: string,
): AddressSuggestion {
  const fullAddress = district
    ? `${MOSCOW_CITY}, ${street}, д. ${house} (${district})`
    : `${MOSCOW_CITY}, ${street}, д. ${house}`;

  return {
    id,
    label: fullAddress,
    fullAddress,
    city: MOSCOW_CITY,
    street,
    house,
    latitude,
    longitude,
    confidence: district ? 0.72 : 0.9,
    source: "local_pattern",
  };
}

function buildSuggestionsForStreetWithHouse(
  street: LocalStreetDefinition,
  house: string,
): AddressSuggestion[] {
  return [
    buildLocalSuggestion(
      street.street,
      house,
      street.latitude,
      street.longitude,
      createSuggestionId("local", [street.token, house]),
    ),
  ];
}

function buildAmbiguousSuggestions(
  street: AmbiguousStreetDefinition,
  house: string,
): AddressSuggestion[] {
  return street.variants.map((variant) =>
    buildLocalSuggestion(
      street.street,
      house,
      variant.latitude,
      variant.longitude,
      createSuggestionId("ambiguous", [variant.id, house]),
      variant.district,
    ),
  );
}

function buildSelectedSuggestionFromFullAddress(
  normalizedInput: string,
): AddressSuggestion | null {
  const match = normalizedInput.match(FULL_ADDRESS_PATTERN);
  if (!match) {
    return null;
  }

  const street = match[1]?.trim() ?? "";
  const house = match[2]?.trim() ?? "";
  const district = match[3]?.trim();
  const localStreet = findLocalStreet(street);

  return {
    id: createSuggestionId("selected", [normalizedInput]),
    label: normalizedInput,
    fullAddress: normalizedInput,
    city: MOSCOW_CITY,
    street,
    house,
    landmark: district,
    latitude: localStreet?.latitude,
    longitude: localStreet?.longitude,
    confidence: 0.95,
    source: "local_pattern",
  };
}

function tryGeocoderCacheSuggestion(
  normalizedInput: string,
): AddressSuggestion | null {
  const geocodingKey = normalizeGeocodingAddress(normalizedInput);
  const cached = readGeocodingCacheEntry(geocodingKey);

  if (
    !cached ||
    cached.status !== "found" ||
    cached.latitude === null ||
    cached.longitude === null
  ) {
    return null;
  }

  const house = extractHouseNumber(normalizedInput) ?? "";

  return {
    id: createSuggestionId("cache", [geocodingKey]),
    label: cached.address,
    fullAddress: cached.address,
    city: MOSCOW_CITY,
    street: stripHouseNumber(normalizedInput),
    house,
    latitude: cached.latitude,
    longitude: cached.longitude,
    confidence: cached.confidence ?? 0.82,
    source: "cache",
  };
}

function buildResult(
  partial: Omit<AddressIntelligenceResult, "updatedAt">,
): AddressIntelligenceResult {
  return {
    ...partial,
    updatedAt: new Date().toISOString(),
  };
}

function cacheResult(
  normalizedInput: string,
  status: AddressIntelligenceStatus,
  suggestions: AddressSuggestion[],
): void {
  if (!normalizedInput || suggestions.length === 0) {
    return;
  }

  saveCachedAddressSuggestions({
    normalizedInput,
    suggestions,
    status,
    cachedAt: new Date().toISOString(),
  });
}


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN): Public exported functions and constants.
//
// Назначение (RU): Публичные экспортируемые функции и константы.
// ==================================================
export function buildAddressIntelligence(input: string): AddressIntelligenceResult {
  const { rawInput, normalizedInput } = normalizeAddressInput(input);

  if (!normalizedInput) {
    return buildResult({
      rawInput,
      normalizedInput,
      suggestions: [],
      status: "idle",
      warnings: [],
      errors: [],
    });
  }

  if (normalizedInput.length < 3) {
    return buildResult({
      rawInput,
      normalizedInput,
      suggestions: [],
      status: "needs_more_details",
      warnings: [],
      errors: [],
    });
  }

  const cachedEntry = getCachedAddressSuggestions(normalizedInput);
  if (cachedEntry && cachedEntry.suggestions.length > 0) {
    const selectedSuggestion = cachedEntry.suggestions.find(
      (suggestion) =>
        suggestion.fullAddress.toLowerCase() === normalizedInput.toLowerCase(),
    );

    return buildResult({
      rawInput,
      normalizedInput,
      suggestions: cachedEntry.suggestions,
      selectedSuggestion,
      status: selectedSuggestion ? "selected" : cachedEntry.status,
      warnings: [],
      errors: [],
    });
  }

  if (isUnsupportedLocation(normalizedInput)) {
    return buildResult({
      rawInput,
      normalizedInput,
      suggestions: [],
      status: "unsupported",
      warnings: [],
      errors: ["Этот адрес может быть вне зоны доставки BellaFlore"],
    });
  }

  const selectedFromFullAddress =
    buildSelectedSuggestionFromFullAddress(normalizedInput);
  if (selectedFromFullAddress) {
    return buildResult({
      rawInput,
      normalizedInput,
      suggestions: [selectedFromFullAddress],
      selectedSuggestion: selectedFromFullAddress,
      status: "selected",
      warnings: [],
      errors: [],
    });
  }

  const houseNumber = extractHouseNumber(normalizedInput);
  const streetOnlyInput = stripHouseNumber(normalizedInput);
  const ambiguousStreet = findAmbiguousStreet(normalizedInput);

  if (ambiguousStreet && houseNumber) {
    const suggestions = buildAmbiguousSuggestions(ambiguousStreet, houseNumber);
    cacheResult(normalizedInput, "ambiguous", suggestions);

    return buildResult({
      rawInput,
      normalizedInput,
      suggestions,
      status: "ambiguous",
      warnings: ["Найдено несколько похожих адресов — выберите подходящий вариант"],
      errors: [],
    });
  }

  const localStreet = findLocalStreet(normalizedInput);

  if (localStreet && houseNumber) {
    const suggestions = buildSuggestionsForStreetWithHouse(
      localStreet,
      houseNumber,
    );
    cacheResult(normalizedInput, "suggestions_available", suggestions);

    return buildResult({
      rawInput,
      normalizedInput,
      suggestions,
      status: "suggestions_available",
      warnings: [],
      errors: [],
    });
  }

  if (localStreet && !houseNumber) {
    return buildResult({
      rawInput,
      normalizedInput,
      suggestions: [],
      status: "needs_more_details",
      warnings: [],
      errors: [],
    });
  }

  const cacheSuggestion = tryGeocoderCacheSuggestion(normalizedInput);
  if (cacheSuggestion) {
    const suggestions = [cacheSuggestion];
    cacheResult(normalizedInput, "suggestions_available", suggestions);

    return buildResult({
      rawInput,
      normalizedInput,
      suggestions,
      status: "suggestions_available",
      warnings: [],
      errors: [],
    });
  }

  if (!houseNumber && streetOnlyInput.length >= 3) {
    return buildResult({
      rawInput,
      normalizedInput,
      suggestions: [],
      status: "needs_more_details",
      warnings: [],
      errors: [],
    });
  }

  return buildResult({
    rawInput,
    normalizedInput,
    suggestions: [],
    status: "typing",
    warnings: [],
    errors: [],
  });
}
