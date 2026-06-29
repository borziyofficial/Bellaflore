// ==================================================
// SECTION: Admin — Third Internal Module Entry
// РАЗДЕЛ: Admin — Внутренний модуль
// ==================================================

"use client";

import { AdminEntryGate, AdminNavigationShell } from "@/components/adminEntry";
import styles from "./internalPage.module.css";

function InternalModuleEntryContent() {
  return (
    <section className={styles.card}>
      <p className={styles.eyebrow}>Админ · Этап 42.5B</p>
      <h2 className={styles.title}>🧩 Внутренний модуль</h2>
      <p className={styles.subtitle}>Внутренние операционные инструменты Bellaflore</p>
      <p className={styles.body}>
        Страница-заглушка. Подключение operational engines на этом этапе намеренно не
        выполняется.
      </p>
      <p className={styles.meta}>Маршрут: /admin/internal</p>
    </section>
  );
}

export default function AdminInternalModulePage() {
  return (
    <AdminEntryGate route="/admin/internal">
      <AdminNavigationShell activeRoute="/admin/internal">
        <InternalModuleEntryContent />
      </AdminNavigationShell>
    </AdminEntryGate>
  );
}
