// ==================================================
// SECTION: ADMIN — Edit product
// ==================================================
"use client";

import { useParams } from "next/navigation";
import { AdminCatalogManager } from "@/components/adminCatalogManager/AdminCatalogManager";
import { AdminAppPage } from "@/components/adminApp";

// Shell (sidebar + bottom nav) and the auth gate are already provided by
// AdminRouteLayout for this route — do not wrap in AdminAppShell/AdminEntryGate
// here, or the shell (and bottom navigation) renders twice.
export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? decodeURIComponent(params.id) : null;

  return (
    <AdminAppPage route="/admin" title="Редактировать товар">
      <AdminCatalogManager embedded initialMode="edit" initialEditId={id} />
    </AdminAppPage>
  );
}
