"use client";

import { useBellaFloreTheme } from "@/components/theme/ThemeProvider";
import styles from "@/components/theme/ThemeToggle.module.css";
import { useEffect, useState } from "react";

type ThemeToggleProps = {
  variant?: "menu";
};

export function ThemeToggle({ variant = "menu" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useBellaFloreTheme();
  const [mounted, setMounted] = useState(false);
  const isNight = theme === "night";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      type="button"
      className={styles.menuToggle}
      onClick={toggleTheme}
      aria-label={isNight ? "Включить дневной режим" : "Включить ночной режим"}
      aria-pressed={isNight}
    >
      <span className={styles.icon} aria-hidden="true">
        {isNight ? "☾" : "☼"}
      </span>
      {variant === "menu" ? (
        <span className={styles.menuLabel}>
          {isNight ? "Ночной режим" : "Дневной режим"}
        </span>
      ) : null}
    </button>
  );
}
