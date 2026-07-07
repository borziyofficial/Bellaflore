// Admin routes keep Pearl day theme — isolated from storefront dark-luxury CSS.
import { AdminRouteLayout } from "@/components/adminApp/layout/AdminRouteLayout";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div data-admin-route="true">
      <AdminRouteLayout>{children}</AdminRouteLayout>
    </div>
  );
}
