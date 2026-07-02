// ==================================================
// SECTION: Admin Shell — dashboard home
// РАЗДЕЛ: Главный экран активного модуля
// ==================================================
"use client";

import Link from "next/link";
import { AdminModuleCard } from "@/components/adminShell/AdminModuleCard";
import {
  BELLAFLORE_MODULE_SECTIONS,
  SYSTEM_CONTROL_SECTIONS,
  getAdminModuleById,
} from "@/components/adminShell/adminModules";
import type { AdminModuleId } from "@/components/adminShell/adminModuleTypes";
import styles from "@/components/adminShell/AdminDashboardHome.module.css";

type AdminDashboardHomeProps = {
  activeModuleId: AdminModuleId;
};

export function AdminDashboardHome({ activeModuleId }: AdminDashboardHomeProps) {
  const activeModule = getAdminModuleById(activeModuleId);

  if (activeModuleId === "bellaflore") {
    return (
      <div className={styles.dashboard}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Bellaflore Store</p>
          <h2 className={styles.title}>Управление магазином</h2>
          <p className={styles.lead}>
            Товары, заказы, доставка и контент витрины — единая точка входа для
            команды Bellaflore.
          </p>
        </section>

        <div className={styles.grid}>
          {BELLAFLORE_MODULE_SECTIONS.map((section) => (
            <AdminModuleCard key={section.id} section={section} />
          ))}
        </div>
      </div>
    );
  }

  if (activeModuleId === "amore-bloom") {
    return (
      <div className={styles.dashboard}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Amore Bloom</p>
          <h2 className={styles.title}>Второй магазин</h2>
          <p className={styles.lead}>
            Placeholder для отдельного бренда. Полная логика и backend
            подключатся на следующем этапе.
          </p>
        </section>

        <section className={styles.placeholderPanel} aria-label="Amore Bloom placeholder">
          <h3 className={styles.placeholderTitle}>Скоро</h3>
          <p className={styles.placeholderText}>
            Модуль Amore Bloom пока недоступен. Переключатель уже готов для
            будущего multi-store режима без выхода из admin-сессии.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>System Control</p>
        <h2 className={styles.title}>Центр управления</h2>
        <p className={styles.lead}>
          Статус сборки, окружение, Telegram и диагностика — foundation для
          операционного контроля.
        </p>
        <div className={styles.quickLinks}>
          <Link href="/admin/system-brain" className={styles.quickLink}>
            Системный мозг
          </Link>
          <Link href="/admin/internal" className={styles.quickLink}>
            Внутренний модуль
          </Link>
        </div>
      </section>

      <div className={styles.grid}>
        {SYSTEM_CONTROL_SECTIONS.map((section) => (
          <AdminModuleCard key={section.id} section={section} />
        ))}
      </div>

      <section className={styles.placeholderPanel}>
        <h3 className={styles.placeholderTitle}>{activeModule.label}</h3>
        <p className={styles.placeholderText}>
          Расширенные панели диагностики и мониторинга появятся здесь без
          изменения структуры модулей.
        </p>
      </section>
    </div>
  );
}
