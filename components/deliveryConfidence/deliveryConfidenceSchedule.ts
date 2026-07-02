// ==================================================
// SECTION: DELIVERY CONFIDENCE
// РАЗДЕЛ: Уверенность доставки
//
// Purpose (EN):
// Working hours, cutoffs, and interval availability for delivery confidence.
//
// Назначение (RU):
// Рабочие часы, дедлайны и доступность интервалов для уверенности доставки.
// ==================================================
import { deliveryIntervals } from "@/components/checkout/deliveryIntervals";
import type {
  DeliveryConfidenceScheduleInput,
  DeliveryConfidenceScheduleResult,
  DeliveryRulesConfig,
} from "@/components/deliveryConfidence/deliveryConfidenceTypes";
import {
  resolveZoneEstimatedDeliveryTime,
} from "@/components/deliveryConfidence/deliveryRulesConfig";
import type { DeliveryZoneId } from "@/components/deliveryZones/deliveryZoneTypes";


// ==================================================
// SECTION: HELPERS
// РАЗДЕЛ: Вспомогательные функции
//
// Purpose (EN):
// Private helper functions used within this module.
//
// Назначение (RU):
// Приватные вспомогательные функции модуля.
// ==================================================
function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


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
export function parseTimeToMinutes(timeValue: string): number | null {
  const match = timeValue.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

function parseIntervalLabel(intervalLabel: string): {
  startMinutes: number;
  endMinutes: number;
} | null {
  const normalized = intervalLabel.replace(/[–—-]/g, "–").trim();
  const match = normalized.match(/^(\d{1,2}:\d{2})\s*–\s*(\d{1,2}:\d{2})$/);
  if (!match) {
    const knownInterval = deliveryIntervals.find(
      (interval) => interval.label === intervalLabel,
    );
    if (knownInterval) {
      return {
        startMinutes: knownInterval.startMinutes,
        endMinutes: knownInterval.endMinutes,
      };
    }

    return null;
  }

  const startMinutes = parseTimeToMinutes(match[1] ?? "");
  const endMinutes = parseTimeToMinutes(match[2] ?? "");

  if (startMinutes === null || endMinutes === null) {
    return null;
  }

  return { startMinutes, endMinutes };
}

function isIntervalWithinWorkingHours(
  interval: { startMinutes: number; endMinutes: number },
  workingStartMinutes: number,
  workingEndMinutes: number,
): boolean {
  return (
    interval.startMinutes >= workingStartMinutes &&
    interval.endMinutes <= workingEndMinutes
  );
}

function findNearestAvailableInterval(
  workingStartMinutes: number,
  workingEndMinutes: number,
  now: Date,
  deliveryDate: string,
): string | null {
  const todayDateValue = formatDateInputValue(now);
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = deliveryDate === todayDateValue;

  const candidates = deliveryIntervals.filter((interval) => {
    if (!isIntervalWithinWorkingHours(interval, workingStartMinutes, workingEndMinutes)) {
      return false;
    }

    if (isToday && interval.endMinutes <= currentTimeMinutes) {
      return false;
    }

    return true;
  });

  return candidates[0]?.label ?? null;
}

function resolveHolidayMessage(
  rules: DeliveryRulesConfig,
  deliveryDate: string,
): string | null {
  if (!rules.holidayRules.enabled || rules.holidayRules.holidays.length === 0) {
    return null;
  }

  const holiday = rules.holidayRules.holidays.find(
    (entry) => entry.date === deliveryDate,
  );

  if (!holiday) {
    return null;
  }

  if (!holiday.deliveryAvailable) {
    return holiday.message ?? `Доставка недоступна: ${holiday.label}`;
  }

  return null;
}

export function createEmptyDeliveryConfidenceScheduleResult(
  sameDayCutoffTime: string,
): DeliveryConfidenceScheduleResult {
  return {
    zoneEstimatedDeliveryLabel: null,
    zoneEstimatedDeliveryMinutesMin: null,
    zoneEstimatedDeliveryMinutesMax: null,
    sameDayDeliveryAvailable: true,
    sameDayCutoffTime,
    selectedIntervalWithinWorkingHours: true,
    nearestAvailableInterval: null,
    scheduleMessage: null,
  };
}

export function resolveDeliveryConfidenceSchedule(
  rules: DeliveryRulesConfig,
  zoneId: DeliveryZoneId | null,
  scheduleInput: DeliveryConfidenceScheduleInput,
): DeliveryConfidenceScheduleResult {
  const now = scheduleInput.now ?? new Date();
  const sameDayCutoffTime = rules.sameDayCutoffTime;
  const emptySchedule = createEmptyDeliveryConfidenceScheduleResult(
    sameDayCutoffTime,
  );

  if (!zoneId) {
    return emptySchedule;
  }

  const zoneEta = resolveZoneEstimatedDeliveryTime(rules, zoneId);
  const workingStartMinutes = parseTimeToMinutes(rules.workingHours.startTime);
  const workingEndMinutes = parseTimeToMinutes(rules.workingHours.endTime);
  const cutoffMinutes = parseTimeToMinutes(sameDayCutoffTime);
  const todayDateValue = formatDateInputValue(now);
  const isToday = scheduleInput.deliveryDate === todayDateValue;
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

  const scheduleBase: DeliveryConfidenceScheduleResult = {
    zoneEstimatedDeliveryLabel: zoneEta?.label ?? null,
    zoneEstimatedDeliveryMinutesMin: zoneEta?.minMinutes ?? null,
    zoneEstimatedDeliveryMinutesMax: zoneEta?.maxMinutes ?? null,
    sameDayDeliveryAvailable: true,
    sameDayCutoffTime,
    selectedIntervalWithinWorkingHours: true,
    nearestAvailableInterval: null,
    scheduleMessage: null,
  };

  const holidayMessage = resolveHolidayMessage(rules, scheduleInput.deliveryDate);
  if (holidayMessage) {
    return {
      ...scheduleBase,
      sameDayDeliveryAvailable: false,
      scheduleMessage: holidayMessage,
    };
  }

  if (
    isToday &&
    cutoffMinutes !== null &&
    currentTimeMinutes >= cutoffMinutes
  ) {
    const nearestInterval = findNearestAvailableInterval(
      workingStartMinutes ?? 0,
      workingEndMinutes ?? 24 * 60,
      now,
      scheduleInput.deliveryDate,
    );

    return {
      ...scheduleBase,
      sameDayDeliveryAvailable: false,
      selectedIntervalWithinWorkingHours: false,
      nearestAvailableInterval: nearestInterval,
      scheduleMessage: `Доставка сегодня недоступна после ${sameDayCutoffTime}`,
    };
  }

  if (workingStartMinutes === null || workingEndMinutes === null) {
    return scheduleBase;
  }

  const selectedInterval = scheduleInput.deliveryInterval
    ? parseIntervalLabel(scheduleInput.deliveryInterval)
    : null;

  if (!selectedInterval) {
    const nearestInterval = findNearestAvailableInterval(
      workingStartMinutes,
      workingEndMinutes,
      now,
      scheduleInput.deliveryDate,
    );

    return {
      ...scheduleBase,
      nearestAvailableInterval: nearestInterval,
      scheduleMessage: nearestInterval
        ? `Ближайший доступный интервал: ${nearestInterval}`
        : null,
    };
  }

  const withinWorkingHours = isIntervalWithinWorkingHours(
    selectedInterval,
    workingStartMinutes,
    workingEndMinutes,
  );

  if (withinWorkingHours) {
    return scheduleBase;
  }

  const nearestInterval = findNearestAvailableInterval(
    workingStartMinutes,
    workingEndMinutes,
    now,
    scheduleInput.deliveryDate,
  );

  return {
    ...scheduleBase,
    selectedIntervalWithinWorkingHours: false,
    nearestAvailableInterval: nearestInterval,
    scheduleMessage: nearestInterval
      ? `Выбранный интервал вне часов доставки (${rules.workingHours.startTime}–${rules.workingHours.endTime}). Ближайший доступный: ${nearestInterval}`
      : `Доставка доступна ${rules.workingHours.startTime}–${rules.workingHours.endTime}`,
  };
}
