// ==================================================
// SECTION: ADMIN — Bouquets (Stage 1 placeholder)
// ==================================================

import { AdminAppPage, AdminBouquetsModule } from "@/components/adminApp";

export default function AdminBouquetsPage() {
  return (
    <AdminAppPage route="/admin" title="Bouquets">
      <AdminBouquetsModule />
    </AdminAppPage>
  );
}
