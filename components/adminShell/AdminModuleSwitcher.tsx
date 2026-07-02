// ==================================================
// SECTION: Admin Shell — module switcher
// РАЗДЕЛ: Переключатель модулей (Telegram-style)
// ==================================================
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ADMIN_MODULES } from "@/components/adminShell/adminModules";
import type { AdminModuleId } from "@/components/adminShell/adminModuleTypes";
import styles from "@/components/adminShell/AdminModuleSwitcher.module.css";

type AdminModuleSwitcherProps = {
  activeModuleId: AdminModuleId;
  onModuleChange: (moduleId: AdminModuleId) => void;
};

function getModuleInitial(label: string): string {
  return label.trim().charAt(0).toUpperCase() || "B";
}

export function AdminModuleSwitcher({
  activeModuleId,
  onModuleChange,
}: AdminModuleSwitcherProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const activeModule =
    ADMIN_MODULES.find((module) => module.id === activeModuleId) ??
    ADMIN_MODULES[0];

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelect = (moduleId: AdminModuleId) => {
    onModuleChange(moduleId);
    setOpen(false);
  };

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {getModuleInitial(activeModule.label)}
        </span>
        <span className={styles.labelBlock}>
          <span className={styles.moduleName}>{activeModule.label}</span>
          <span className={styles.moduleHint}>Текущий модуль</span>
        </span>
        <span className={styles.chevron} aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          className={styles.menu}
          role="listbox"
          aria-label="Выбор модуля админ-панели"
        >
          <p className={styles.menuTitle}>Модули</p>
          {ADMIN_MODULES.map((module) => {
            const isActive = module.id === activeModuleId;

            return (
              <button
                key={module.id}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`${styles.option} ${isActive ? styles.optionActive : ""} ${
                  module.availability === "coming-soon" ? styles.optionDisabled : ""
                }`}
                onClick={() => handleSelect(module.id)}
              >
                <span className={styles.marker} aria-hidden="true">
                  {isActive ? "✅" : "○"}
                </span>
                <span className={styles.optionBody}>
                  <span className={styles.optionLabel}>{module.label}</span>
                  <span className={styles.optionDescription}>
                    {module.shortLabel}
                  </span>
                </span>
                {module.availability === "coming-soon" ? (
                  <span className={styles.badge}>Скоро</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
