// ==================================================
// SECTION: Admin Shell — active module state
// РАЗДЕЛ: Состояние активного модуля
// ==================================================

"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  ADMIN_MODULE_STORAGE_KEY,
} from "@/components/adminShell/adminModules";
import type { AdminModuleId } from "@/components/adminShell/adminModuleTypes";

const MODULE_CHANGE_EVENT = "bellaflore-admin-module-change";

function readStoredModuleId(): AdminModuleId {
  if (typeof window === "undefined") {
    return "bellaflore";
  }

  try {
    const stored = window.sessionStorage.getItem(ADMIN_MODULE_STORAGE_KEY);
    if (
      stored === "bellaflore" ||
      stored === "amore-bloom" ||
      stored === "system-control"
    ) {
      return stored;
    }
  } catch {
    // Ignore storage errors.
  }

  return "bellaflore";
}

function subscribeToModuleState(onStoreChange: () => void): () => void {
  const handleModuleChange = () => {
    onStoreChange();
  };

  window.addEventListener(MODULE_CHANGE_EVENT, handleModuleChange);
  window.addEventListener("storage", handleModuleChange);

  return () => {
    window.removeEventListener(MODULE_CHANGE_EVENT, handleModuleChange);
    window.removeEventListener("storage", handleModuleChange);
  };
}

export function useAdminModule(): [
  AdminModuleId,
  (moduleId: AdminModuleId) => void,
] {
  const activeModuleId = useSyncExternalStore(
    subscribeToModuleState,
    readStoredModuleId,
    () => "bellaflore" as AdminModuleId,
  );

  const setActiveModuleId = useCallback((moduleId: AdminModuleId) => {
    try {
      window.sessionStorage.setItem(ADMIN_MODULE_STORAGE_KEY, moduleId);
    } catch {
      // Session persistence is optional.
    }

    window.dispatchEvent(new Event(MODULE_CHANGE_EVENT));
  }, []);

  return [activeModuleId, setActiveModuleId];
}
