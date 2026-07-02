// ==================================================
// SECTION: Admin Shell — control center client entry
// РАЗДЕЛ: Клиентская точка входа Admin Control Center
// ==================================================
"use client";

import { AdminEntryGate } from "@/components/adminEntry";
import { AdminShell } from "@/components/adminShell/AdminShell";

export function AdminControlCenterClient() {
  return (
    <AdminEntryGate route="/admin">
      <AdminShell />
    </AdminEntryGate>
  );
}
