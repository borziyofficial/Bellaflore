// ==================================================
// SECTION: ADMIN — Bouquets product studio
// ==================================================
"use client";

import { AdminCatalogManager } from "@/components/adminCatalogManager/AdminCatalogManager";
import { AdminAppShell, AdminEntryGate } from "@/components/adminEntry";

export default function AdminBouquetsPage() {
  return (
    <AdminEntryGate route="/admin">
      <AdminAppShell title="Букеты">
        <AdminCatalogManager embedded />
      </AdminAppShell>
    </AdminEntryGate>
  );
}
