// ==================================================
// SECTION: ADMIN — Smart banner (hero management)
// ==================================================

import { AdminAppPage, AdminSmartBannerModule } from "@/components/adminApp";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/lib/adminApiAuth";
import { getPromoBannerSnapshot } from "@/lib/promoBannerDb";

export default async function AdminSmartBannerPage() {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  const initialSnapshot =
    token && verifyAdminSessionToken(token)
      ? await getPromoBannerSnapshot().catch(() => null)
      : null;

  return (
    <AdminAppPage route="/admin" title="Умный баннер">
      <AdminSmartBannerModule initialSnapshot={initialSnapshot} />
    </AdminAppPage>
  );
}
