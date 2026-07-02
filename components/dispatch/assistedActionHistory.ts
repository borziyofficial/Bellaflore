// ==================================================
// SECTION: DISPATCH
// РАЗДЕЛ: Диспетчеризация
//
// Purpose (EN):
// localStorage history for assisted dispatch action audit trail.
//
// Назначение (RU):
// История ассистированных действий диспетчеризации в localStorage.
// ==================================================
import type {
  AssistedAction,
  AssistedActionStatus,
} from "@/components/dispatch/assistedActionTypes";

export const ASSISTED_ACTION_HISTORY_STORAGE_KEY =
  "bellaflore_assisted_action_history_v1";

type AssistedActionHistoryStore = {
  actions: AssistedAction[];
};


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
function readHistoryStore(): AssistedActionHistoryStore {
  if (typeof window === "undefined") {
    return { actions: [] };
  }

  try {
    const rawValue = window.localStorage.getItem(
      ASSISTED_ACTION_HISTORY_STORAGE_KEY,
    );
    if (!rawValue) {
      return { actions: [] };
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (
      !parsedValue ||
      typeof parsedValue !== "object" ||
      !Array.isArray((parsedValue as AssistedActionHistoryStore).actions)
    ) {
      return { actions: [] };
    }

    return parsedValue as AssistedActionHistoryStore;
  } catch {
    return { actions: [] };
  }
}

function writeHistoryStore(store: AssistedActionHistoryStore): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ASSISTED_ACTION_HISTORY_STORAGE_KEY,
    JSON.stringify(store),
  );
}

function updateActionStatus(
  actionId: string,
  status: AssistedActionStatus,
  timestamps: Partial<Pick<AssistedAction, "appliedAt" | "undoneAt">>,
): AssistedAction | null {
  const store = readHistoryStore();
  const actionIndex = store.actions.findIndex(
    (action) => action.actionId === actionId,
  );

  if (actionIndex === -1) {
    return null;
  }

  const currentAction = store.actions[actionIndex];
  if (!currentAction) {
    return null;
  }

  const updatedAction: AssistedAction = {
    ...currentAction,
    status,
    ...timestamps,
  };

  store.actions[actionIndex] = updatedAction;
  writeHistoryStore(store);

  return updatedAction;
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
export function saveAssistedAction(action: AssistedAction): AssistedAction {
  const store = readHistoryStore();
  const existingIndex = store.actions.findIndex(
    (storedAction) => storedAction.actionId === action.actionId,
  );

  if (existingIndex === -1) {
    store.actions.unshift(action);
  } else {
    store.actions[existingIndex] = action;
  }

  writeHistoryStore(store);
  return action;
}

export function getAssistedActions(): AssistedAction[] {
  return readHistoryStore().actions;
}

export function getLastAppliedAssistedAction(): AssistedAction | null {
  return (
    getAssistedActions().find((action) => action.status === "applied") ?? null
  );
}

export function markActionPreviewed(actionId: string): AssistedAction | null {
  return updateActionStatus(actionId, "previewed", {});
}

export function markActionConfirmed(actionId: string): AssistedAction | null {
  return updateActionStatus(actionId, "confirmed", {});
}

export function markActionApplied(actionId: string): AssistedAction | null {
  return updateActionStatus(actionId, "applied", {
    appliedAt: new Date().toISOString(),
  });
}

export function markActionUndone(actionId: string): AssistedAction | null {
  return updateActionStatus(actionId, "undone", {
    undoneAt: new Date().toISOString(),
  });
}

export function markActionFailed(actionId: string): AssistedAction | null {
  return updateActionStatus(actionId, "failed", {});
}
