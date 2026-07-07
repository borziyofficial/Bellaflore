// ==================================================
// SECTION: ADMIN — Bouquets (Stage 2.1 core)
// ==================================================

import { AdminAppPage, AdminBouquetsModule } from "@/components/adminApp";

export default function AdminBouquetsPage() {
  return (
    <AdminAppPage route="/admin" title="Букеты">
      <AdminBouquetsModule />
    </AdminAppPage>
  );
}
