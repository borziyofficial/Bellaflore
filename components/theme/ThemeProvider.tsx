"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BellaFloreTheme = "day" | "night";

const STORAGE_KEY = "bellaflore-ui-theme";

type ThemeContextValue = {
  theme: BellaFloreTheme;
  setTheme: (theme: BellaFloreTheme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): BellaFloreTheme {
  if (typeof window === "undefined") {
    return "day";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "night" ? "night" : "day";
}

function applyTheme(theme: BellaFloreTheme) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<BellaFloreTheme>(() => readStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback((nextTheme: BellaFloreTheme) => {
    setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "day" ? "night" : "day"));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
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
