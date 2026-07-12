// ==================================================
// SECTION: ADMIN — Edit product
// ==================================================
"use client";

import { useParams } from "next/navigation";
import { AdminCatalogManager } from "@/components/adminCatalogManager/AdminCatalogManager";
import { AdminAppShell, AdminEntryGate } from "@/components/adminEntry";

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? decodeURIComponent(params.id) : null;

  return (
    <AdminEntryGate route="/admin">
      <AdminAppShell title="Редактировать товар">
        <AdminCatalogManager embedded initialMode="edit" initialEditId={id} />
      </AdminAppShell>
    </AdminEntryGate>
  );
}
