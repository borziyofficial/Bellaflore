// ==================================================
// SECTION: Admin — Products Catalog Management
// РАЗДЕЛ: Admin — управление каталогом товаров (Stage 53)
// ==================================================
"use client";

import { AdminCatalogManager } from "@/components/adminCatalogManager/AdminCatalogManager";
import { AdminAppShell, AdminEntryGate } from "@/components/adminEntry";

export default function AdminProductsPage() {
  return (
    <AdminEntryGate route="/admin">
      <AdminAppShell title="Товары">
        <AdminCatalogManager embedded />
      </AdminAppShell>
    </AdminEntryGate>
  );
}
