"use client";

import {
  applyDocumentTheme,
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

const DARK_LUXURY_THEME = "dark-luxury" as BellaFloreTheme;

type ThemeContextValue = {
  theme: BellaFloreTheme;
  isManualOverride: boolean;
  setTheme: (theme: BellaFloreTheme) => void;
  toggleTheme: () => void;
  resetToAutoTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme] = useState<BellaFloreTheme>(DARK_LUXURY_THEME);

  useEffect(() => {
    applyDocumentTheme(DARK_LUXURY_THEME);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("bellaflore-ui-theme", DARK_LUXURY_THEME);
      window.localStorage.removeItem("bellaflore-ui-theme-manual");
    }
  }, []);

  const setTheme = useCallback(() => {
    applyDocumentTheme(DARK_LUXURY_THEME);
  }, []);

  const toggleTheme = useCallback(() => {
    applyDocumentTheme(DARK_LUXURY_THEME);
  }, []);

  const resetToAutoTheme = useCallback(() => {
    applyDocumentTheme(DARK_LUXURY_THEME);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      isManualOverride: false,
      setTheme,
      toggleTheme,
      resetToAutoTheme,
    }),
    [theme, setTheme, toggleTheme, resetToAutoTheme],
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
