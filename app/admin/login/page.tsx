// ==================================================
// SECTION: Admin — Login Page
// РАЗДЕЛ: Admin — страница входа
// ==================================================

import { Suspense } from "react";
import AdminLoginPageClient from "@/app/admin/login/AdminLoginPageClient";

function AdminLoginPageFallback() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        alignItems: "center",
        padding: "24px",
        background: "#f7f2ea",
      }}
      aria-hidden="true"
    />
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginPageFallback />}>
      <AdminLoginPageClient />
    </Suspense>
  );
}
