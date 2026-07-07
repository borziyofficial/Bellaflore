// ==================================================
// SECTION: ADMIN — Add bouquet (Stage 1 placeholder)
// ==================================================

import { AdminAppPage, AdminAddModule } from "@/components/adminApp";

export default function AdminAddPage() {
  return (
    <AdminAppPage route="/admin" title="Add bouquet">
      <AdminAddModule />
    </AdminAppPage>
  );
}
