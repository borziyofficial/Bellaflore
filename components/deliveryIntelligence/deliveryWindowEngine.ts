// ==================================================
// SECTION: DELIVERY INTELLIGENCE
// РАЗДЕЛ: Window engine
// ==================================================
import { deliveryIntervals } from "@/components/checkout/deliveryIntervals";
import type {
  DeliveryDelayRisk,
  DeliveryWindow,
} from "@/components/deliveryIntelligence/deliveryIntelligenceTypes";

function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isIntervalAvailableForToday(
  interval: { startMinutes: number; endMinutes: number },
  now: Date,
): boolean {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return interval.endMinutes > currentMinutes + 45;
}

export function getAvailableDeliveryWindows(
  deliveryDate: string,
  now: Date = new Date(),
): DeliveryWindow[] {
  const isToday = deliveryDate === formatDateInputValue(now);

  return deliveryIntervals
    .filter((interval) =>
      isToday ? isIntervalAvailableForToday(interval, now) : true,
    )
    .map((interval, index) => ({
      id: `window-${deliveryDate}-${index}`,
      label: interval.label,
      startMinutes: interval.startMinutes,
      endMinutes: interval.endMinutes,
      deliveryDate,
      isAvailable: true,
      riskLevel: interval.startMinutes >= 18 * 60 ? "medium" : "low",
    }));
}

export function findNearestDeliveryWindow(
  deliveryDate: string,
  now: Date = new Date(),
): DeliveryWindow | null {
  const windows = getAvailableDeliveryWindows(deliveryDate, now);
  return windows[0] ?? null;
}

export function detectDeliveryWindowRisk(
  deliveryDate: string,
  deliveryInterval: string,
  now: Date = new Date(),
): DeliveryDelayRisk {
  const windows = getAvailableDeliveryWindows(deliveryDate, now);
  const selected = windows.find((window) => window.label === deliveryInterval);

  if (!selected) {
    return {
      level: "high",
      delayMinutesEstimate: 30,
      reasons: ["Выбранный интервал недоступен"],
      shouldNotify: true,
      shouldReschedule: true,
    };
  }

  if (selected.riskLevel === "medium") {
    return {
      level: "medium",
      delayMinutesEstimate: 15,
      reasons: ["Вечерний интервал с повышенной загрузкой"],
      shouldNotify: false,
      shouldReschedule: false,
    };
  }

  return {
    level: "low",
    delayMinutesEstimate: 0,
    reasons: ["Интервал доступен"],
    shouldNotify: false,
    shouldReschedule: false,
  };
}

export function suggestRescheduleWindow(
  deliveryDate: string,
  now: Date = new Date(),
): DeliveryWindow | null {
  return findNearestDeliveryWindow(deliveryDate, now);
}
