// ==================================================
// SECTION: ADMIN
// РАЗДЕЛ: BellaFlore Admin Control Center
// ==================================================

import type { Metadata } from "next";
import { AdminControlCenterClient } from "@/components/adminShell/AdminControlCenterClient";

export const metadata: Metadata = {
  title: "BellaFlore Admin",
  description: "Премиальная админ-панель BellaFlore",
};

export default function AdminPage() {
  return <AdminControlCenterClient />;
}
