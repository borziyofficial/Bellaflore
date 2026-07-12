// ==================================================
// SECTION: ADMIN — Add product
// ==================================================
"use client";

import { AdminCatalogManager } from "@/components/adminCatalogManager/AdminCatalogManager";
import { AdminAppPage } from "@/components/adminApp";

// Shell (sidebar + bottom nav) and the auth gate are already provided by
// AdminRouteLayout for this route — do not wrap in AdminAppShell/AdminEntryGate
// here, or the shell (and bottom navigation) renders twice.
export default function AdminAddPage() {
  return (
    <AdminAppPage route="/admin" title="Добавить товар">
      <AdminCatalogManager embedded initialMode="create" />
    </AdminAppPage>
  );
}
