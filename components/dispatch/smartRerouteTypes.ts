// ==================================================
// SECTION: DISPATCH
// РАЗДЕЛ: Диспетчеризация
//
// Purpose (EN):
// Type definitions for smart reroute suggestions and priorities.
//
// Назначение (RU):
// Типы умных подсказок перестроения маршрутов и приоритетов.
// ==================================================
export type SmartRerouteSuggestionType =
  | "delay_risk"
  | "heavy_traffic"
  | "courier_overloaded"
  | "courier_idle"
  | "route_deviation"
  | "long_stop"
  | "better_courier_available"
  | "better_stop_order"
  | "interval_risk"
  | "stale_location";


// ==================================================
// SECTION: TYPES
// РАЗДЕЛ: Типы
//
// Purpose (EN):
// Exported type and interface definitions.
//
// Назначение (RU):
// Экспортируемые типы и интерфейсы.
// ==================================================
export type SmartReroutePriority = "low" | "medium" | "high" | "critical";

export type SmartRerouteFilterCategory =
  | "traffic"
  | "gps"
  | "workload"
  | "delay"
  | "route";

export type SmartRerouteFilterId = "all" | SmartRerouteFilterCategory;

export type SmartRerouteSuggestion = {
  id: string;
  type: SmartRerouteSuggestionType;
  filterCategory: SmartRerouteFilterCategory;
  priority: SmartReroutePriority;
  title: string;
  description: string;
  reason: string;
  affectedCourierId: string | null;
  affectedCourierName: string | null;
  affectedOrderIds: string[];
  confidence: number;
  suggestedAction: string;
  createdAt: string;
};

export type SmartRerouteSuggestionsData = {
  suggestions: SmartRerouteSuggestion[];
  generatedAt: string;
};

export const SMART_REROUTE_FILTER_OPTIONS: Array<{
  id: SmartRerouteFilterId;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "traffic", label: "Traffic" },
  { id: "gps", label: "GPS" },
  { id: "workload", label: "Workload" },
  { id: "delay", label: "Delay" },
  { id: "route", label: "Route" },
];

const PRIORITY_SORT_ORDER: Record<SmartReroutePriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};


// ==================================================
// SECTION: API
// РАЗДЕЛ: Публичный API
//
// Purpose (EN):
// Public exported functions and constants.
//
// Назначение (RU):
// Публичные экспортируемые функции и константы.
// ==================================================
export function getSmartReroutePriorityLabel(
  priority: SmartReroutePriority,
): string {
  switch (priority) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
    default:
      return "Low";
  }
}

export function getSmartRerouteTypeLabel(
  type: SmartRerouteSuggestionType,
): string {
  switch (type) {
    case "delay_risk":
      return "Delay risk";
    case "heavy_traffic":
      return "Heavy traffic";
    case "courier_overloaded":
      return "Courier overloaded";
    case "courier_idle":
      return "Courier idle";
    case "route_deviation":
      return "Route deviation";
    case "long_stop":
      return "Long stop";
    case "better_courier_available":
      return "Better courier available";
    case "better_stop_order":
      return "Better stop order";
    case "interval_risk":
      return "Interval risk";
    case "stale_location":
      return "Stale location";
    default:
      return type;
  }
}

export function sortSmartRerouteSuggestions(
  suggestions: SmartRerouteSuggestion[],
): SmartRerouteSuggestion[] {
  return [...suggestions].sort((firstSuggestion, secondSuggestion) => {
    const priorityDifference =
      PRIORITY_SORT_ORDER[firstSuggestion.priority] -
      PRIORITY_SORT_ORDER[secondSuggestion.priority];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return (
      Date.parse(secondSuggestion.createdAt) -
      Date.parse(firstSuggestion.createdAt)
    );
  });
}

export function filterSmartRerouteSuggestions(
  suggestions: SmartRerouteSuggestion[],
  filterId: SmartRerouteFilterId,
): SmartRerouteSuggestion[] {
  if (filterId === "all") {
    return suggestions;
  }

  return suggestions.filter(
    (suggestion) => suggestion.filterCategory === filterId,
  );
}

export function clampSmartRerouteConfidence(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
