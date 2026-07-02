// ==================================================
// SECTION: ADMIN FOUNDATION
// РАЗДЕЛ: Client-only entry для admin shell
// ==================================================
"use client";

import dynamic from "next/dynamic";
import { AdminFoundationPageLoader } from "@/components/adminFoundation/AdminFoundationPageLoader";

const AdminFoundationPage = dynamic(
  () =>
    import("@/components/adminFoundation/AdminFoundationPage").then(
      (module) => module.AdminFoundationPage,
    ),
  {
    ssr: false,
    loading: () => <AdminFoundationPageLoader />,
  },
);

type AdminFoundationPageClientProps = {
  adminUsername: string;
};

export function AdminFoundationPageClient({
  adminUsername,
}: AdminFoundationPageClientProps) {
  return <AdminFoundationPage adminUsername={adminUsername} />;
}
