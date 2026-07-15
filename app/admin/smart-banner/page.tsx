// ==================================================
// SECTION: ADMIN — Smart banner (hero management)
// ==================================================

import { AdminAppPage, AdminSmartBannerModule } from "@/components/adminApp";

export default function AdminSmartBannerPage() {
  return (
    <AdminAppPage route="/admin" title="Умный баннер">
      <AdminSmartBannerModule />
    </AdminAppPage>
  );
}
