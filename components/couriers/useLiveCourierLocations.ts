// ==================================================
// SECTION: COURIERS
// РАЗДЕЛ: Курьеры
//
// Purpose (EN):
// React hook polling stored courier locations for admin map views.
//
// Назначение (RU):
// React-хук опроса сохранённых позиций курьеров для админ-карты.
// ==================================================
"use client";

import { buildLiveCourierMapData } from "@/components/couriers/liveCourierMapData";
import type { LiveCourierMapData } from "@/components/couriers/liveCourierMapData";
import type { LiveCourierRefreshIntervalMs } from "@/components/couriers/liveCourierUpdateConfig";
import { useCallback, useEffect, useRef, useState } from "react";

export type UseLiveCourierLocationsOptions = {
  autoRefreshEnabled: boolean;
  refreshIntervalMs: LiveCourierRefreshIntervalMs;
};


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
export type UseLiveCourierLocationsResult = {
  data: LiveCourierMapData;
  lastRefreshedAt: Date | null;
  refreshNow: () => void;
  isDocumentVisible: boolean;
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
function readLiveCourierMapData(): LiveCourierMapData {
  return buildLiveCourierMapData(new Date());
}

function readDocumentVisibility(): boolean {
  if (typeof document === "undefined") {
    return true;
  }

  return document.visibilityState === "visible";
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
export function useLiveCourierLocations(
  options: UseLiveCourierLocationsOptions,
): UseLiveCourierLocationsResult {
  const { autoRefreshEnabled, refreshIntervalMs } = options;
  const [data, setData] = useState<LiveCourierMapData>(() =>
    readLiveCourierMapData(),
  );
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(() =>
    typeof window === "undefined" ? null : new Date(),
  );
  const [isDocumentVisible, setIsDocumentVisible] = useState(() =>
    readDocumentVisibility(),
  );
  const intervalRef = useRef<number | null>(null);

  const refreshNow = useCallback(() => {
    setData(readLiveCourierMapData());
    setLastRefreshedAt(new Date());
  }, []);

  const clearRefreshInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = readDocumentVisibility();
      setIsDocumentVisible(isVisible);

      if (isVisible && autoRefreshEnabled) {
        refreshNow();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [autoRefreshEnabled, refreshNow]);

  useEffect(() => {
    clearRefreshInterval();

    if (!autoRefreshEnabled || !isDocumentVisible) {
      return;
    }

    intervalRef.current = window.setInterval(() => {
      refreshNow();
    }, refreshIntervalMs);

    return clearRefreshInterval;
  }, [
    autoRefreshEnabled,
    clearRefreshInterval,
    isDocumentVisible,
    refreshIntervalMs,
    refreshNow,
  ]);

  return {
    data,
    lastRefreshedAt,
    refreshNow,
    isDocumentVisible,
  };
}
