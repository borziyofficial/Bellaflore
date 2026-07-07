// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: BellaFlore Admin — Stage 1 foundation dashboard
// ==================================================

import type { Metadata } from "next";
import { AdminAppPage, AdminDashboardModule } from "@/components/adminApp";

export const metadata: Metadata = {
  title: "BellaFlore Admin",
  description: "Премиальная админ-панель BellaFlore",
};

export default function AdminPage() {
  return (
    <AdminAppPage route="/admin" title="Dashboard">
      <AdminDashboardModule />
    </AdminAppPage>
  );
}
