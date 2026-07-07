// ==================================================
// SECTION: ADMIN APP — Page wrapper
// ==================================================
"use client";

import { type ReactNode } from "react";

type AdminAppPageProps = {
  route?: string;
  title?: string;
  children: ReactNode;
};

/** Content-only wrapper. Shell and auth gate live in `AdminRouteLayout`. */
export function AdminAppPage({ children }: AdminAppPageProps) {
  return <>{children}</>;
}
