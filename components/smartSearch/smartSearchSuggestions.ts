// ==================================================
// SECTION: SMART SEARCH
// РАЗДЕЛ: Search Suggestions
//
// Purpose (EN): Curated smart search suggestions for catalog UI.
//
// Назначение (RU): Подсказки умного поиска для каталога.
// ==================================================
import type { SmartSearchSuggestion } from "@/components/smartSearch/smartSearchTypes";

export const SMART_SEARCH_SUGGESTIONS: SmartSearchSuggestion[] = [
  { id: "roses-51", label: "51 роза", query: "51 роза" },
  { id: "white-roses", label: "белые розы", query: "белые розы" },
  { id: "peonies", label: "пионы", query: "пионы" },
  { id: "for-mom", label: "букет маме", query: "букет маме" },
  { id: "under-7000", label: "до 7000", query: "до 7000" },
  { id: "birthday", label: "день рождения", query: "день рождения" },
  { id: "hydrangeas", label: "гортензии", query: "гортензии" },
  { id: "vip", label: "VIP букет", query: "VIP букет" },
];

export function getSmartSearchSuggestions(limit = 8): SmartSearchSuggestion[] {
  return SMART_SEARCH_SUGGESTIONS.slice(0, limit);
}

export function filterSmartSearchSuggestions(
  query: string,
  limit = 6,
): SmartSearchSuggestion[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return getSmartSearchSuggestions(limit);
  }

  return SMART_SEARCH_SUGGESTIONS.filter(
    (suggestion) =>
      suggestion.label.toLowerCase().includes(normalized) ||
      suggestion.query.toLowerCase().includes(normalized),
  ).slice(0, limit);
}
