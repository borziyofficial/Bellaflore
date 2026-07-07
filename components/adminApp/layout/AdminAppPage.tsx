// ==================================================
// SECTION: ADMIN APP — Page wrapper
// ==================================================
"use client";

import { type ReactNode } from "react";
import { AdminEntryGate } from "@/components/adminEntry/AdminEntryGate";
import type { AdminEntryRoutePath } from "@/components/adminEntry/adminEntryTypes";
import { AdminFoundationShell } from "@/components/adminApp/layout/AdminFoundationShell";

type AdminAppPageProps = {
  route?: AdminEntryRoutePath;
  title: string;
  children: ReactNode;
};

export function AdminAppPage({ route = "/admin", title, children }: AdminAppPageProps) {
  return (
    <AdminEntryGate route={route}>
      <AdminFoundationShell title={title}>{children}</AdminFoundationShell>
    </AdminEntryGate>
  );
}
