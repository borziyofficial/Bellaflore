import { deliveryIntervals } from "@/components/checkout/deliveryIntervals";
import { getDeliveryZoneCatalogEntry } from "@/components/deliveryZones/deliveryZonesCatalog";
import { OrderError } from "@/lib/orders/errors";
import type { DeliveryMode } from "@/lib/orders/types";

const MONTHS: Record<string, number> = {
  января: 1, февраля: 2, марта: 3, апреля: 4, мая: 5, июня: 6,
  июля: 7, августа: 8, сентября: 9, октября: 10, ноября: 11, декабря: 12,
};

export function moscowToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function checkedDate(day: number, month: number, year: number, today: string): string {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("Укажите существующую дату доставки.");
  }
  const normalized = date.toISOString().slice(0, 10);
  if (normalized < today) throw new Error("Дата доставки не может быть в прошлом.");
  return normalized;
}

/** Extracts a date from the customer's current answer, never from conversation history. */
export function parseDeliveryDateAnswer(text: string, now = new Date()): string | null {
  const today = moscowToday(now);
  if (/(?<![а-яё])послезавтра(?![а-яё])/iu.test(text)) {
    const date = new Date(`${today}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + 2);
    return date.toISOString().slice(0, 10);
  }
  if (/(?<![а-яё])завтра(?![а-яё])/iu.test(text)) {
    const date = new Date(`${today}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + 1);
    return date.toISOString().slice(0, 10);
  }
  if (/(?<![а-яё])сегодня(?![а-яё])/iu.test(text)) return today;

  const iso = text.match(/(?:^|\D)(\d{4})-(\d{2})-(\d{2})(?!\d)/u);
  if (iso) return checkedDate(Number(iso[3]), Number(iso[2]), Number(iso[1]), today);

  const dotted = text.match(/(?:^|\D)(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?(?!\d)/u);
  const named = text.toLowerCase().match(
    /(?:^|[^а-яё\d])(\d{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)(?:\s+(\d{4}))?(?!\d)/iu,
  );
  if (!dotted && !named) return null;

  const day = Number((dotted ?? named)?.[1]);
  const month = dotted ? Number(dotted[2]) : MONTHS[named![2].toLowerCase()];
  const explicitYear = (dotted ?? named)?.[3];
  if (explicitYear) return checkedDate(day, month, Number(explicitYear), today);

  const currentYear = Number(today.slice(0, 4));
  try {
    return checkedDate(day, month, currentYear, today);
  } catch (error) {
    if (error instanceof Error && error.message.includes("прошлом")) {
      return checkedDate(day, month, currentYear + 1, today);
    }
    throw error;
  }
}

export type ParsedDeliveryTime =
  | { mode: "interval"; interval: string; exactTime: null }
  | { mode: "exact"; interval: null; exactTime: string };

export function parseDeliveryTimeAnswer(text: string): ParsedDeliveryTime | null {
  const range = text.match(/(?<![\d.-])(?:с\s*)?(\d{1,2})(?::00)?\s*(?:[–—-]|до)\s*(\d{1,2})(?::00)?(?!\d)/iu);
  if (range) {
    const label = `${String(Number(range[1])).padStart(2, "0")}:00–${String(Number(range[2])).padStart(2, "0")}:00`;
    if (!deliveryIntervals.some((item) => item.label === label)) {
      throw new Error("Выберите доступный интервал доставки.");
    }
    return { mode: "interval", interval: label, exactTime: null };
  }
  const exact = text.match(/(?:^|[^\d])(\d{1,2}):([0-5]\d)(?!\d)/u);
  if (!exact || Number(exact[1]) > 23) return null;
  return {
    mode: "exact",
    interval: null,
    exactTime: `${exact[1].padStart(2, "0")}:${exact[2]}`,
  };
}

export function exactTimeSurcharge(mode: DeliveryMode, zoneId: string): number {
  if (mode === "interval") return 0;
  const sortOrder = getDeliveryZoneCatalogEntry(zoneId as Parameters<typeof getDeliveryZoneCatalogEntry>[0])?.sortOrder;
  if (sortOrder === undefined || sortOrder < 1 || sortOrder > 7) {
    throw new OrderError("DELIVERY_OUTSIDE_AREA", "Адрес находится вне доступной зоны доставки.", 422);
  }
  return sortOrder <= 4 ? 1000 : 1500;
}
