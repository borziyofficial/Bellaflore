// ==================================================
// SECTION: SUPPLIER INTELLIGENCE
// РАЗДЕЛ: Delivery registry
// ==================================================
import { buildSupplierExampleRegistryState } from "@/components/supplierIntelligence/supplierExamples";
import { getSupplierById } from "@/components/supplierIntelligence/supplierRegistry";
import type { SupplierDeliverySchedule } from "@/components/supplierIntelligence/supplierTypes";

export const SUPPLIER_DELIVERY_STORAGE_KEY =
  "bellaflore_supplier_intelligence_delivery_v1";

let inMemoryDelivery: SupplierDeliverySchedule[] | null = null;

function readDeliveryFromStorage(): SupplierDeliverySchedule[] {
  if (typeof window === "undefined") {
    return inMemoryDelivery ?? buildSupplierExampleRegistryState().deliverySchedules;
  }

  try {
    const raw = window.localStorage.getItem(SUPPLIER_DELIVERY_STORAGE_KEY);
    if (!raw) {
      return inMemoryDelivery ?? buildSupplierExampleRegistryState().deliverySchedules;
    }

    const parsed = JSON.parse(raw) as SupplierDeliverySchedule[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : buildSupplierExampleRegistryState().deliverySchedules;
  } catch {
    return inMemoryDelivery ?? buildSupplierExampleRegistryState().deliverySchedules;
  }
}

function writeDeliveryToStorage(schedules: SupplierDeliverySchedule[]): void {
  inMemoryDelivery = schedules;

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SUPPLIER_DELIVERY_STORAGE_KEY, JSON.stringify(schedules));
  } catch {
    // In-memory fallback remains active.
  }
}

export function listDeliverySchedules(supplierId?: string): SupplierDeliverySchedule[] {
  return readDeliveryFromStorage()
    .filter((s) => s.isActive)
    .filter((s) => (supplierId ? s.supplierId === supplierId : true));
}

export function getDeliveryScheduleByZone(
  supplierId: string,
  zoneLabel: string,
): SupplierDeliverySchedule | null {
  return (
    listDeliverySchedules(supplierId).find((s) => s.zoneLabel === zoneLabel) ?? null
  );
}

export function getSupplierDeliveryTimeDays(supplierId: string): number | null {
  return getSupplierById(supplierId)?.deliveryTimeDays ?? null;
}

export function estimateDeliveryTime(input: {
  supplierId: string;
  zoneLabel?: string;
  orderHour?: number;
}): {
  deliveryDays: number;
  cutoffHour: number;
  meetsCutoff: boolean;
} {
  const supplier = getSupplierById(input.supplierId);
  const schedule = input.zoneLabel
    ? getDeliveryScheduleByZone(input.supplierId, input.zoneLabel)
    : listDeliverySchedules(input.supplierId)[0];

  const deliveryDays = schedule?.deliveryDays ?? supplier?.deliveryTimeDays ?? 3;
  const cutoffHour = schedule?.cutoffHour ?? 14;
  const orderHour = input.orderHour ?? new Date().getHours();

  return {
    deliveryDays,
    cutoffHour,
    meetsCutoff: orderHour < cutoffHour,
  };
}

export function registerDeliverySchedule(
  schedule: SupplierDeliverySchedule,
): SupplierDeliverySchedule {
  const schedules = readDeliveryFromStorage();
  const index = schedules.findIndex((s) => s.id === schedule.id);
  const next =
    index === -1
      ? [...schedules, schedule]
      : schedules.map((s, i) => (i === index ? schedule : s));

  writeDeliveryToStorage(next);
  return schedule;
}

export function seedSupplierDeliveryRegistry(): SupplierDeliverySchedule[] {
  writeDeliveryToStorage(buildSupplierExampleRegistryState().deliverySchedules);
  return listDeliverySchedules();
}

export function clearSupplierDeliveryRegistry(): void {
  writeDeliveryToStorage([]);
}

export function getFastestSuppliers(limit = 5): Array<{ supplierId: string; deliveryDays: number }> {
  const map = new Map<string, number>();

  for (const schedule of listDeliverySchedules()) {
    const current = map.get(schedule.supplierId);
    if (current === undefined || schedule.deliveryDays < current) {
      map.set(schedule.supplierId, schedule.deliveryDays);
    }
  }

  return [...map.entries()]
    .map(([supplierId, deliveryDays]) => ({ supplierId, deliveryDays }))
    .sort((a, b) => a.deliveryDays - b.deliveryDays)
    .slice(0, limit);
}
