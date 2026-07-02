"use client";

import { useBellaFloreTheme } from "@/components/theme/ThemeProvider";
import styles from "@/components/theme/ThemeToggle.module.css";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useBellaFloreTheme();
  const [mounted, setMounted] = useState(false);
  const isNight = theme === "night";

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={styles.toggle}
        aria-label="Переключить тему"
        suppressHydrationWarning
      >
        <span className={styles.icon} aria-hidden="true">
          ☼
        </span>
        <span className={styles.label}>День</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={isNight ? "Включить дневной режим" : "Включить ночной режим"}
      aria-pressed={isNight}
    >
      <span className={styles.icon} aria-hidden="true">
        {isNight ? "☾" : "☼"}
      </span>
      <span className={styles.label}>{isNight ? "Ночь" : "День"}</span>
    </button>
  );
}
