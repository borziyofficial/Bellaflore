"use client";

import {
  applyDocumentTheme,
  resolveThemeForPathname,
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
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  const routeTheme = resolveThemeForPathname(pathname);
  const [theme, setThemeState] = useState<BellaFloreTheme>(routeTheme);

  useEffect(() => {
    setThemeState(routeTheme);
    applyDocumentTheme(routeTheme);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("bellaflore-ui-theme", routeTheme);
      window.localStorage.removeItem("bellaflore-ui-theme-manual");
    }
  }, [routeTheme]);

  const setTheme = useCallback(
    (nextTheme: BellaFloreTheme) => {
      const resolved = pathname.startsWith("/admin") ? "day" : nextTheme;
      setThemeState(resolved);
      applyDocumentTheme(resolved);
    },
    [pathname],
  );

  const toggleTheme = useCallback(() => {
    applyDocumentTheme(routeTheme);
    setThemeState(routeTheme);
  }, [routeTheme]);

  const resetToAutoTheme = useCallback(() => {
    applyDocumentTheme(routeTheme);
    setThemeState(routeTheme);
  }, [routeTheme]);

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
