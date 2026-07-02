// ==================================================
// SECTION: SMART SEARCH
// РАЗДЕЛ: Synonyms Dictionary
//
// Purpose (EN): Admin-ready synonym dictionary for intent-aware search.
//
// Назначение (RU): Словарь синонимов для умного поиска (готов к админке).
// ==================================================
import type {
  SmartSearchColorId,
  SmartSearchFlowerId,
  SmartSearchOccasionId,
  SmartSearchStyleId,
  SmartSearchSynonymEntry,
} from "@/components/smartSearch/smartSearchTypes";

export const SMART_SEARCH_SYNONYMS: SmartSearchSynonymEntry[] = [
  {
    canonical: "rose",
    kind: "flower",
    aliases: ["розы", "роза", "rose", "roses", "роз"],
  },
  {
    canonical: "peony",
    kind: "flower",
    aliases: ["пионы", "пион", "peony", "peonies", "пионов"],
  },
  {
    canonical: "hydrangea",
    kind: "flower",
    aliases: ["гортензия", "гортензии", "hydrangea", "hydrangeas", "гортенз"],
  },
  {
    canonical: "tulip",
    kind: "flower",
    aliases: ["тюльпан", "тюльпаны", "tulip", "tulips"],
  },
  {
    canonical: "white",
    kind: "color",
    aliases: ["белый", "белая", "белые", "white"],
  },
  {
    canonical: "pink",
    kind: "color",
    aliases: ["розовый", "розовая", "розовые", "pink"],
  },
  {
    canonical: "red",
    kind: "color",
    aliases: ["красный", "красная", "красные", "red"],
  },
  {
    canonical: "soft",
    kind: "color",
    aliases: ["нежный", "нежная", "нежные", "пастельный", "пастельная"],
  },
  {
    canonical: "cream",
    kind: "color",
    aliases: ["кремовый", "кремовая", "кремовые", "cream"],
  },
  {
    canonical: "mother",
    kind: "occasion",
    aliases: ["маме", "мама", "мамы", "mother", "for_mom"],
  },
  {
    canonical: "birthday",
    kind: "occasion",
    aliases: ["день рождения", "birthday", "др", "юбилей"],
  },
  {
    canonical: "romantic",
    kind: "occasion",
    aliases: ["любимой", "любимая", "romantic", "romance", "для девушки"],
  },
  {
    canonical: "vip",
    kind: "occasion",
    aliases: ["vip", "вип", "премиум", "premium", "luxury"],
  },
  {
    canonical: "gentle",
    kind: "style",
    aliases: ["нежный", "нежная", "нежные", "пастельный", "pastel", "soft"],
  },
  {
    canonical: "premium",
    kind: "style",
    aliases: ["премиум", "premium", "luxury", "люкс"],
  },
  {
    canonical: "luxury",
    kind: "style",
    aliases: ["luxury", "люкс", "эксклюзив", "exclusive"],
  },
  {
    canonical: "romantic_style",
    kind: "style",
    aliases: ["romantic", "романтичный", "романтика"],
  },
  {
    canonical: "gift",
    kind: "intent",
    aliases: ["букет", "подарок", "gift", "present"],
  },
  {
    canonical: "bouquet",
    kind: "keyword",
    aliases: ["букет", "букеты", "bouquet"],
  },
  {
    canonical: "box",
    kind: "keyword",
    aliases: ["коробка", "коробки", "box"],
  },
];

export const SMART_SEARCH_FLOWER_CANONICAL_MAP: Record<string, SmartSearchFlowerId> = {
  rose: "rose",
  peony: "peony",
  hydrangea: "hydrangea",
  tulip: "tulip",
  mix: "mix",
};

export const SMART_SEARCH_COLOR_CANONICAL_MAP: Record<string, SmartSearchColorId> = {
  white: "white",
  pink: "pink",
  red: "red",
  soft: "soft",
  cream: "cream",
};

export const SMART_SEARCH_OCCASION_CANONICAL_MAP: Record<
  string,
  SmartSearchOccasionId
> = {
  mother: "mother",
  birthday: "birthday",
  romantic: "romantic",
  vip: "vip",
  gift: "gift",
};

export const SMART_SEARCH_STYLE_CANONICAL_MAP: Record<string, SmartSearchStyleId> = {
  gentle: "gentle",
  premium: "premium",
  luxury: "luxury",
  romantic_style: "romantic",
};

export function getSmartSearchSynonymEntries(): SmartSearchSynonymEntry[] {
  return SMART_SEARCH_SYNONYMS;
}

export function mergeAdminSynonymDictionary(
  overrideEntries: SmartSearchSynonymEntry[],
): SmartSearchSynonymEntry[] {
  const byCanonical = new Map<string, SmartSearchSynonymEntry>();

  for (const entry of SMART_SEARCH_SYNONYMS) {
    byCanonical.set(`${entry.kind}:${entry.canonical}`, {
      ...entry,
      aliases: [...entry.aliases],
    });
  }

  for (const entry of overrideEntries) {
    const key = `${entry.kind}:${entry.canonical}`;
    const existing = byCanonical.get(key);
    byCanonical.set(key, {
      ...entry,
      aliases: existing
        ? [...new Set([...existing.aliases, ...entry.aliases])]
        : [...entry.aliases],
    });
  }

  return [...byCanonical.values()];
}
