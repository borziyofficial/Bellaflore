// ==================================================
// SECTION: Admin — Delivery Planner
// РАЗДЕЛ: Admin — планировщик доставки с картой зон
// ==================================================

"use client";

import { AdminDeliveryPlannerContent } from "@/components/admin/AdminDeliveryPlannerContent";
import { AdminEntryGate, AdminNavigationShell } from "@/components/adminEntry";

export default function AdminDeliveryPlannerPage() {
  return (
    <AdminEntryGate route="/admin">
      <AdminNavigationShell activeRoute="/admin">
        <AdminDeliveryPlannerContent />
      </AdminNavigationShell>
    </AdminEntryGate>
  );
}
