// ==================================================
// SECTION: Admin — Orders (Stage 1 placeholder)
// ==================================================
"use client";

import { AdminAppPage, AdminOrdersModule } from "@/components/adminApp";

export default function AdminOrdersPage() {
  return (
    <AdminAppPage route="/admin" title="Orders">
      <AdminOrdersModule />
    </AdminAppPage>
  );
}
