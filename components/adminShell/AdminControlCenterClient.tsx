// ==================================================
// SECTION: Admin Shell — control center client entry
// РАЗДЕЛ: Клиентская точка входа Admin Control Center
// ==================================================
"use client";

import { AdminEntryGate } from "@/components/adminEntry";
import { AdminAppShell } from "@/components/adminEntry/AdminAppShell";
import { AdminDashboardHome } from "@/components/adminShell/AdminDashboardHome";
import { useAdminModule } from "@/components/adminShell/useAdminModule";

export function AdminControlCenterClient() {
  const [activeModuleId] = useAdminModule();

  return (
    <AdminEntryGate route="/admin">
      <AdminAppShell title="Дашборд">
        <AdminDashboardHome activeModuleId={activeModuleId} />
      </AdminAppShell>
    </AdminEntryGate>
  );
}
