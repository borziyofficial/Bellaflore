// ==================================================
// SECTION: DISPATCH
// РАЗДЕЛ: Диспетчеризация
//
// Purpose (EN):
// Persistence for local route reorder and rebuild overrides.
//
// Назначение (RU):
// Сохранение локальных переопределений порядка и перестроения маршрутов.
// ==================================================
import type { AssistedRouteOverrideEntry } from "@/components/dispatch/assistedActionTypes";
import type { CourierRouteLine } from "@/components/maps/routeLineTypes";

export const ASSISTED_ROUTE_OVERRIDE_STORAGE_KEY =
  "bellaflore_assisted_route_overrides_v1";

type AssistedRouteOverrideStore = Record<string, AssistedRouteOverrideEntry>;


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
function readOverrideStore(): AssistedRouteOverrideStore {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(
      ASSISTED_ROUTE_OVERRIDE_STORAGE_KEY,
    );
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!parsedValue || typeof parsedValue !== "object") {
      return {};
    }

    return parsedValue as AssistedRouteOverrideStore;
  } catch {
    return {};
  }
}

function writeOverrideStore(store: AssistedRouteOverrideStore): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ASSISTED_ROUTE_OVERRIDE_STORAGE_KEY,
    JSON.stringify(store),
  );
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
export function getAssistedRouteOverrides(): AssistedRouteOverrideStore {
  return readOverrideStore();
}

export function saveAssistedRouteOverride(
  override: AssistedRouteOverrideEntry,
): void {
  const store = readOverrideStore();
  store[override.courierId] = override;
  writeOverrideStore(store);
}

export function removeAssistedRouteOverride(courierId: string): void {
  const normalizedCourierId = courierId.trim();
  if (!normalizedCourierId) {
    return;
  }

  const store = readOverrideStore();
  delete store[normalizedCourierId];
  writeOverrideStore(store);
}

export function clearAssistedRouteOverridesForAction(actionId: string): void {
  const store = readOverrideStore();
  let changed = false;

  for (const [courierId, override] of Object.entries(store)) {
    if (override.actionId === actionId) {
      delete store[courierId];
      changed = true;
    }
  }

  if (changed) {
    writeOverrideStore(store);
  }
}

export function applyAssistedRouteOverridesToRouteLines(
  routeLines: CourierRouteLine[],
  overrides: AssistedRouteOverrideStore,
): CourierRouteLine[] {
  return routeLines.map((routeLine) => {
    const override = overrides[routeLine.courierId];
    if (!override) {
      return routeLine;
    }

    const pointsByOrderId = new Map(
      routeLine.points.map((point) => [point.orderId, point]),
    );
    const reorderedPoints = override.orderIds
      .map((orderId) => pointsByOrderId.get(orderId))
      .filter((point): point is NonNullable<typeof point> => Boolean(point));

    if (reorderedPoints.length === 0) {
      return routeLine;
    }

    return {
      ...routeLine,
      orderIds: override.orderIds.filter((orderId) =>
        pointsByOrderId.has(orderId),
      ),
      points: reorderedPoints,
    };
  });
}
