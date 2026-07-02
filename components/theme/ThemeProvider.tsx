"use client";

import {
  applyDocumentTheme,
  clearManualThemeOverride,
  readManualThemeOverride,
  resolveActiveTheme,
  resolveAutoTheme,
  setManualThemeOverride,
  type BellaFloreTheme,
} from "@/lib/theme/bellafloreAutoTheme";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type { BellaFloreTheme };

type ThemeContextValue = {
  theme: BellaFloreTheme;
  isManualOverride: boolean;
  setTheme: (theme: BellaFloreTheme) => void;
  toggleTheme: () => void;
  resetToAutoTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<BellaFloreTheme>(() => resolveActiveTheme());
  const [isManualOverride, setIsManualOverride] = useState(
    () => readManualThemeOverride() !== null,
  );

  const syncTheme = useCallback(() => {
    const nextTheme = resolveActiveTheme();
    setThemeState(nextTheme);
    setIsManualOverride(readManualThemeOverride() !== null);
    applyDocumentTheme(nextTheme);
  }, []);

  useEffect(() => {
    syncTheme();

    const intervalId = window.setInterval(() => {
      if (readManualThemeOverride()) {
        return;
      }

      const autoTheme = resolveAutoTheme();
      setThemeState(autoTheme);
      applyDocumentTheme(autoTheme);
    }, 60_000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncTheme();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [syncTheme]);

  const setTheme = useCallback((nextTheme: BellaFloreTheme) => {
    setManualThemeOverride(nextTheme);
    setThemeState(nextTheme);
    setIsManualOverride(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const nextTheme = current === "day" ? "night" : "day";
      setManualThemeOverride(nextTheme);
      setIsManualOverride(true);
      return nextTheme;
    });
  }, []);

  const resetToAutoTheme = useCallback(() => {
    clearManualThemeOverride();
    const autoTheme = resolveAutoTheme();
    setThemeState(autoTheme);
    setIsManualOverride(false);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isManualOverride,
      setTheme,
      toggleTheme,
      resetToAutoTheme,
    }),
    [theme, isManualOverride, setTheme, toggleTheme, resetToAutoTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useBellaFloreTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useBellaFloreTheme must be used within ThemeProvider");
  }

  return context;
}
