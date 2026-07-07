// ==================================================
// SECTION: ADMIN APP — Persistent route layout (Stage 2.3.2)
// ==================================================
"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import { resolveAdminPageTitle } from "@/components/adminApp/foundation/navigation";
import { AdminFoundationShell } from "@/components/adminApp/layout/AdminFoundationShell";
import { AdminEntryGate } from "@/components/adminEntry/AdminEntryGate";

const ADMIN_ROUTE_LAYOUT_EXCLUDED_PREFIXES = [
  "/admin/login",
  "/admin/internal",
  "/admin/system-brain",
  "/admin/delivery",
  "/admin/products",
  "/admin/crm",
];

function isAdminRouteLayoutExcluded(pathname: string): boolean {
  return ADMIN_ROUTE_LAYOUT_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function AdminRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/admin";

  if (isAdminRouteLayoutExcluded(pathname)) {
    return <>{children}</>;
  }

  const title = resolveAdminPageTitle(pathname);

  return (
    <AdminEntryGate route="/admin">
      <AdminFoundationShell title={title}>{children}</AdminFoundationShell>
    </AdminEntryGate>
  );
}
