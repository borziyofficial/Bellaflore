// ==================================================
// SECTION: Admin — Delivery Planner
// РАЗДЕЛ: Admin — планировщик доставки с картой зон
// ==================================================

"use client";

import { AdminDeliveryPlannerContent } from "@/components/admin/AdminDeliveryPlannerContent";
import { AdminAppShell, AdminEntryGate } from "@/components/adminEntry";

export default function AdminDeliveryPlannerPage() {
  return (
    <AdminEntryGate route="/admin">
      <AdminAppShell title="Доставка">
        <AdminDeliveryPlannerContent />
      </AdminAppShell>
    </AdminEntryGate>
  );
}
