// ==================================================
// SECTION: Admin — System Brain Entry
// РАЗДЕЛ: Admin — Системный мозг
// ==================================================

"use client";

import { AdminEntryGate, AdminNavigationShell } from "@/components/adminEntry";
import styles from "./systemBrainPage.module.css";

function SystemBrainEntryContent() {
  return (
    <section className={styles.card}>
      <p className={styles.eyebrow}>Админ · Этап 42.5B</p>
      <h2 className={styles.title}>⚙️ Системный мозг</h2>
      <p className={styles.subtitle}>Внутренний системный слой Bellaflore</p>
      <p className={styles.body}>
        Страница-заглушка. Подключение AI Brain engine на этом этапе намеренно не
        выполняется.
      </p>
      <p className={styles.meta}>Маршрут: /admin/system-brain</p>
    </section>
  );
}

export default function AdminSystemBrainPage() {
  return (
    <AdminEntryGate route="/admin/system-brain">
      <AdminNavigationShell activeRoute="/admin/system-brain">
        <SystemBrainEntryContent />
      </AdminNavigationShell>
    </AdminEntryGate>
  );
}
