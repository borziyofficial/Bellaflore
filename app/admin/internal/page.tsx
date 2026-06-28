// ==================================================
// SECTION: Admin — Third Internal Module Entry
// РАЗДЕЛ: Admin — Internal Module
// ==================================================

"use client";

import { AdminEntryGate, AdminNavigationShell } from "@/components/adminEntry";
import styles from "./internalPage.module.css";

function InternalModuleEntryContent() {
  return (
    <section className={styles.card}>
      <p className={styles.eyebrow}>Admin Entry · Stage 41</p>
      <h2 className={styles.title}>Third Internal Module</h2>
      <p className={styles.subtitle}>Bellaflore internal operations foundation</p>
      <p className={styles.body}>
        Placeholder entry page. Operational engines are intentionally not connected on
        this stage.
      </p>
      <p className={styles.meta}>Route: /admin/internal</p>
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
