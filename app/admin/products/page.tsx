// ==================================================
// SECTION: Admin — Products Catalog Management
// РАЗДЕЛ: Admin — управление каталогом товаров (Stage 53)
// ==================================================
"use client";

import { AdminCatalogManager } from "@/components/adminCatalogManager/AdminCatalogManager";
import { AdminEntryGate } from "@/components/adminEntry/AdminEntryGate";

export default function AdminProductsPage() {
  return (
    <AdminEntryGate route="/admin">
      <AdminCatalogManager />
    </AdminEntryGate>
  );
}
