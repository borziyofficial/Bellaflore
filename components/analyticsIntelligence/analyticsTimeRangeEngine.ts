// ==================================================
// SECTION: ANALYTICS INTELLIGENCE
// РАЗДЕЛ: Time range engine
// ==================================================
import type {
  AnalyticsTimeRange,
  AnalyticsTimeRangeKind,
} from "@/components/analyticsIntelligence/analyticsIntelligenceTypes";

const RANGE_LABELS: Record<AnalyticsTimeRangeKind, string> = {
  today: "Сегодня",
  yesterday: "Вчера",
  last_7_days: "Последние 7 дней",
  last_30_days: "Последние 30 дней",
  month_to_date: "С начала месяца",
  custom: "Произвольный период",
};

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export function resolveAnalyticsTimeRange(
  kind: AnalyticsTimeRangeKind = "today",
  customRange?: { startAt: string; endAt: string },
): AnalyticsTimeRange {
  const now = new Date();

  if (kind === "custom" && customRange) {
    return {
      kind,
      label: RANGE_LABELS.custom,
      startAt: customRange.startAt,
      endAt: customRange.endAt,
    };
  }

  switch (kind) {
    case "yesterday": {
      const day = new Date(now);
      day.setDate(day.getDate() - 1);
      return {
        kind,
        label: RANGE_LABELS.yesterday,
        startAt: startOfDay(day).toISOString(),
        endAt: endOfDay(day).toISOString(),
      };
    }
    case "last_7_days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return {
        kind,
        label: RANGE_LABELS.last_7_days,
        startAt: startOfDay(start).toISOString(),
        endAt: endOfDay(now).toISOString(),
      };
    }
    case "last_30_days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return {
        kind,
        label: RANGE_LABELS.last_30_days,
        startAt: startOfDay(start).toISOString(),
        endAt: endOfDay(now).toISOString(),
      };
    }
    case "month_to_date": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        kind,
        label: RANGE_LABELS.month_to_date,
        startAt: startOfDay(start).toISOString(),
        endAt: endOfDay(now).toISOString(),
      };
    }
    case "today":
    default:
      return {
        kind: "today",
        label: RANGE_LABELS.today,
        startAt: startOfDay(now).toISOString(),
        endAt: endOfDay(now).toISOString(),
      };
  }
}

export function getPreviousAnalyticsTimeRange(
  range: AnalyticsTimeRange,
): AnalyticsTimeRange {
  const startMs = new Date(range.startAt).getTime();
  const endMs = new Date(range.endAt).getTime();
  const durationMs = endMs - startMs;

  return {
    kind: range.kind,
    label: `Previous ${range.label}`,
    startAt: new Date(startMs - durationMs - 1).toISOString(),
    endAt: new Date(startMs - 1).toISOString(),
  };
}

export function isDateWithinAnalyticsRange(
  isoDate: string,
  range: AnalyticsTimeRange,
): boolean {
  const value = new Date(isoDate).getTime();
  const start = new Date(range.startAt).getTime();
  const end = new Date(range.endAt).getTime();
  return value >= start && value <= end;
}

export function listAnalyticsTimeRangePresets(): AnalyticsTimeRangeKind[] {
  return [
    "today",
    "yesterday",
    "last_7_days",
    "last_30_days",
    "month_to_date",
    "custom",
  ];
}
