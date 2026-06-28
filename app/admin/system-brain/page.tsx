// ==================================================
// SECTION: Admin — System Brain Entry
// РАЗДЕЛ: Admin — System Brain
// ==================================================

"use client";

import { AdminEntryGate, AdminNavigationShell } from "@/components/adminEntry";
import styles from "./systemBrainPage.module.css";

function SystemBrainEntryContent() {
  return (
    <section className={styles.card}>
      <p className={styles.eyebrow}>Admin Entry · Stage 41</p>
      <h2 className={styles.title}>System Brain</h2>
      <p className={styles.subtitle}>Bellaflore internal system brain foundation</p>
      <p className={styles.body}>
        Placeholder entry page. AI Brain engine wiring is intentionally not connected on
        this stage.
      </p>
      <p className={styles.meta}>Route: /admin/system-brain</p>
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
