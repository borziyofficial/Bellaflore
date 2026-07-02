// ==================================================
// SECTION: SMART SEARCH
// РАЗДЕЛ: Smart Search — типы
//
// Purpose (EN): Types for intent-aware local smart search foundation.
//
// Назначение (RU): Типы для локального умного поиска.
// ==================================================
import type { CatalogProductRecord } from "@/components/catalogEngine/catalogTypes";

export type SmartSearchFlowerId =
  | "rose"
  | "peony"
  | "hydrangea"
  | "tulip"
  | "mix";

export type SmartSearchColorId =
  | "white"
  | "pink"
  | "red"
  | "soft"
  | "cream";

export type SmartSearchOccasionId =
  | "mother"
  | "birthday"
  | "romantic"
  | "gift"
  | "vip";

export type SmartSearchStyleId = "gentle" | "premium" | "luxury" | "romantic";

export type SmartSearchIntent = "gift" | "browse" | "price_shopping" | null;

export type SmartSearchSynonymKind =
  | "flower"
  | "color"
  | "occasion"
  | "style"
  | "keyword"
  | "price"
  | "intent";

export type SmartSearchSynonymEntry = {
  canonical: string;
  kind: SmartSearchSynonymKind;
  aliases: string[];
};

export type ParsedSearchQuery = {
  rawQuery: string;
  normalizedQuery: string;
  flowers: SmartSearchFlowerId[];
  colors: SmartSearchColorId[];
  occasions: SmartSearchOccasionId[];
  styles: SmartSearchStyleId[];
  stemCount: number | null;
  minPriceRub: number | null;
  maxPriceRub: number | null;
  intent: SmartSearchIntent;
  keywords: string[];
  matchedSynonyms: string[];
};

export type SmartSearchMatchReasonCode =
  | "title_match"
  | "category_match"
  | "flower_match"
  | "color_match"
  | "price_match"
  | "occasion_match"
  | "style_match"
  | "stem_count_match"
  | "popularity"
  | "availability"
  | "featured"
  | "keyword_match";

export type SmartSearchMatchReason = {
  code: SmartSearchMatchReasonCode;
  label: string;
  weight: number;
};

export type SmartSearchProductResult = {
  product: CatalogProductRecord;
  score: number;
  reasons: SmartSearchMatchReason[];
  reasonSummary: string;
};

export type SmartSearchResponse = {
  query: ParsedSearchQuery;
  results: SmartSearchProductResult[];
  provider: "local" | "ai";
  tookMs: number;
};

export type SmartSearchEmptyState = {
  title: string;
  message: string;
  similarProducts: CatalogProductRecord[];
  popularProducts: CatalogProductRecord[];
  filterHint: string;
};

export type AiSearchProvider = {
  id: "openai" | "local_model" | "admin_dictionary";
  parseQuery?: (query: string) => Promise<ParsedSearchQuery>;
  searchProducts?: (
    query: string,
    products: CatalogProductRecord[],
  ) => Promise<SmartSearchProductResult[]>;
};

export type SmartSearchSuggestion = {
  id: string;
  label: string;
  query: string;
};
