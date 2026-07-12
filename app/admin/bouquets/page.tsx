// ==================================================
// SECTION: ADMIN — Bouquets product studio
// ==================================================
"use client";

import { AdminCatalogManager } from "@/components/adminCatalogManager/AdminCatalogManager";
import { AdminAppPage } from "@/components/adminApp";

// Shell (sidebar + bottom nav) and the auth gate are already provided by
// AdminRouteLayout for this route — do not wrap in AdminAppShell/AdminEntryGate
// here, or the shell (and bottom navigation) renders twice.
export default function AdminBouquetsPage() {
  return (
    <AdminAppPage route="/admin" title="Букеты">
      <AdminCatalogManager embedded />
    </AdminAppPage>
  );
}
