// ==================================================
// SECTION: Admin Shell — control center client entry
// РАЗДЕЛ: Legacy entry — delegates to Stage 1 foundation
// ==================================================
"use client";

import { AdminAppPage, AdminDashboardModule } from "@/components/adminApp";

export function AdminControlCenterClient() {
  return (
    <AdminAppPage route="/admin" title="Dashboard">
      <AdminDashboardModule />
    </AdminAppPage>
  );
}
