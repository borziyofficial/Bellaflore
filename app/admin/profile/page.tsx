// ==================================================
// SECTION: ADMIN — Profile (Stage 1 placeholder)
// ==================================================

import { AdminAppPage, AdminProfileModule } from "@/components/adminApp";

export default function AdminProfilePage() {
  return (
    <AdminAppPage route="/admin" title="Profile">
      <AdminProfileModule />
    </AdminAppPage>
  );
}
